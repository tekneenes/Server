import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { setMaxAnisotropy, clearTextureCache } from './textures.js';
import { createMaterials, sharedGeoPool } from './materials.js';
import { buildExteriorCity } from './exterior.js';
import { buildDataCenter } from './building.js';
import { createNavigationController } from './controls.js';
import { createBlueprintController, getZoneKeyAt, getZoneNameAt } from './blueprint.js';
import { createDataCenterAudio } from './audio.js';

function detectSoftwareWebGL() {
  try {
    const probeCanvas = document.createElement('canvas');
    const gl = probeCanvas.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function init() {
  const mount = document.getElementById('webgl-mount');
  const fallbackEl = document.getElementById('webgl-fallback');
  if (!mount) return;

  const isSoftwareGl = detectSoftwareWebGL();
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
  } catch {
    fallbackEl.hidden = false;
    return;
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
  renderer.setSize(mount.clientWidth || window.innerWidth, mount.clientHeight || window.innerHeight);
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  mount.appendChild(renderer.domElement);

  setMaxAnisotropy(renderer.capabilities.getMaxAnisotropy());

  renderer.domElement.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    fallbackEl.hidden = false;
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    fallbackEl.hidden = true;
  });

  // Scene & Atmospheric Horizon
  const scene = new THREE.Scene();
  const skyColor = new THREE.Color(0x9bb0c4);
  scene.background = skyColor;
  scene.fog = new THREE.FogExp2(0x9bb0c4, 0.0068);

  // Studio / Outdoor Environment Reflections
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  pmremGenerator.dispose();

  // Camera
  const aspect = (mount.clientWidth || window.innerWidth) / (mount.clientHeight || window.innerHeight);
  const camera = new THREE.PerspectiveCamera(58, aspect, 0.15, 280);
  camera.position.set(-28, 20, 34);

  // Warm / Cool Lighting Rig
  const hemiLight = new THREE.HemisphereLight(0xcbe4ff, 0x3b444f, 0.72);
  hemiLight.position.set(0, 50, 0);
  scene.add(hemiLight);

  const sunLight = new THREE.DirectionalLight(0xfff1db, 1.85);
  sunLight.position.set(36, 48, 32);
  sunLight.castShadow = !isSoftwareGl;
  sunLight.shadow.mapSize.width = 1536;
  sunLight.shadow.mapSize.height = 1536;
  sunLight.shadow.camera.near = 5;
  sunLight.shadow.camera.far = 140;
  const d = 44;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.bias = -0.0005;
  sunLight.shadow.normalBias = 0.02;
  scene.add(sunLight);

  // Cool rim / back fill light
  const fillLight = new THREE.DirectionalLight(0x93c5fd, 0.55);
  fillLight.position.set(-34, 24, -28);
  scene.add(fillLight);

  // Build World & Data Center (zone-controlled lighting lives inside buildDataCenter)
  const materials = createMaterials(isSoftwareGl);
  const colliders = [];
  const inspectables = [];
  const doors = [];
  const animatedFans = [];
  const animatedGates = [];

  const exterior = buildExteriorCity(
    scene,
    materials,
    colliders,
    inspectables,
    animatedFans,
    animatedGates,
    {
      anisotropy: renderer.capabilities.getMaxAnisotropy(),
      isSoftwareGl,
    }
  );
  const {
    roofGroup,
    roofTopProps,
    zoneGroups,
    nocWallManager,
    updateLeds,
  } = buildDataCenter(scene, materials, colliders, inspectables, doors);

  // Freeze transform matrices on static world meshes while keeping doors, gates, fans & ancestors dynamic
  scene.updateMatrixWorld(true);
  const dynamicExact = new Set([camera, scene, sunLight, hemiLight, fillLight]);
  const addDyn = (obj) => {
    if (obj) dynamicExact.add(obj);
  };
  doors.forEach((d) => {
    addDyn(d.leafA);
    addDyn(d.leafB);
    d.dynamicNodes?.forEach(addDyn);
  });
  animatedGates.forEach((g) => {
    addDyn(g.target);
    addDyn(g.leafL);
    addDyn(g.leafR);
    addDyn(g.armPivot);
  });
  animatedFans.forEach(addDyn);

  const dynamicAncestors = new Set();
  dynamicExact.forEach((node) => {
    let cur = node;
    while (cur) {
      dynamicAncestors.add(cur);
      cur = cur.parent;
    }
  });
  scene.traverse((obj) => {
    if (!dynamicExact.has(obj)) {
      obj.matrixAutoUpdate = false;
      if (!dynamicAncestors.has(obj)) {
        obj.matrixWorldAutoUpdate = false;
      }
    }
  });

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
    // Pre-upload all room CanvasTextures/DataTextures to GPU before visibility culling hides rooms
    const warmedTex = new Set();
    scene.traverse((obj) => {
      const mat = obj.material;
      if (!mat) return;
      const mats = Array.isArray(mat) ? mat : [mat];
      for (let i = 0; i < mats.length; i++) {
        const m = mats[i];
        if (!m) continue;
        const keys = Object.keys(m);
        for (let k = 0; k < keys.length; k++) {
          const v = m[keys[k]];
          if (v && (v.isCanvasTexture || v.isDataTexture) && !warmedTex.has(v)) {
            warmedTex.add(v);
            renderer.initTexture(v);
          }
        }
      }
    });
  }

  // DOM HUD References
  const heroIntroEl = document.getElementById('hero-intro');
  const btnHeroStart = document.getElementById('btn-hero-start');
  const storyOverlayEl = document.getElementById('story-overlay');
  const storyBadgeEl = document.getElementById('story-badge');
  const storyTitleEl = document.getElementById('story-title');
  const storyBodyEl = document.getElementById('story-body');
  const storyActionsEl = document.getElementById('story-actions');
  const zoneLabelEl = document.getElementById('current-zone-label');
  const modeReadoutEl = document.getElementById('mode-readout');
  const walkReticleEl = document.getElementById('walk-reticle');
  const walkHintEl = document.getElementById('walk-hint');
  const touchDpadEl = document.getElementById('touch-dpad');
  const inspectorBarEl = document.getElementById('inspector-bar');
  const inspectorCatEl = document.getElementById('inspector-category');
  const inspectorNameEl = document.getElementById('inspector-name');
  const inspectorSpecsEl = document.getElementById('inspector-specs');
  const btnCloseInspector = document.getElementById('btn-close-inspector');

  const btnModeTour = document.getElementById('btn-mode-tour');
  const btnModeOrbit = document.getElementById('btn-mode-orbit');
  const btnModeWalk = document.getElementById('btn-mode-walk');
  const tourCardEl = document.getElementById('tour-card');
  const tourStageBadgeEl = document.getElementById('tour-stage-badge');
  const tourStepBadgeEl = document.getElementById('tour-step-badge');
  const tourTitleEl = document.getElementById('tour-title');
  const tourDescEl = document.getElementById('tour-desc');
  const tourRangeEl = document.getElementById('tour-range');
  const btnTourPrev = document.getElementById('btn-tour-prev');
  const btnTourNext = document.getElementById('btn-tour-next');
  const presetBtns = Array.from(document.querySelectorAll('.preset-btn'));
  const btnToggleRoof = document.getElementById('btn-toggle-roof');
  const btnToggleBlueprint = document.getElementById('btn-toggle-blueprint');
  const btnCollapseDock = document.getElementById('btn-collapse-dock');
  const dockWrapper = document.getElementById('dock-wrapper');
  const btnToggleKroki = document.getElementById('btn-toggle-kroki');
  const krokiBody = document.getElementById('kroki-body');
  const krokiCanvas = document.getElementById('kroki-canvas');
  const btnToggleAudio = document.getElementById('btn-toggle-audio');
  const btnToggleExplore = document.getElementById('btn-toggle-explore');

  const audio = createDataCenterAudio();
  const handleFirstUserGesture = () => {
    audio.unlock(() => {
      window.removeEventListener('pointerdown', handleFirstUserGesture);
      window.removeEventListener('keydown', handleFirstUserGesture);
      window.removeEventListener('wheel', handleFirstUserGesture);
    });
  };
  window.addEventListener('pointerdown', handleFirstUserGesture, { passive: true });
  window.addEventListener('keydown', handleFirstUserGesture, { passive: true });
  window.addEventListener('wheel', handleFirstUserGesture, { passive: true });

  if (btnToggleAudio) {
    btnToggleAudio.addEventListener('click', () => {
      audio.unlock();
      const nextMuted = !audio.isMuted();
      audio.setMuted(nextMuted);
      btnToggleAudio.classList.toggle('muted', nextMuted);
      btnToggleAudio.setAttribute('aria-pressed', String(!nextMuted));
      btnToggleAudio.textContent = nextMuted ? '🔇 Sessiz' : '🔊 Ses Açık';
    });
  }

  let roofRemoved = false;
  let blueprintViewActive = false;
  let devUiEnabled = false;
  let lastDevToggleMs = -1000;
  let currentMode = 'tour';
  let currentTourT = 0;
  const EXTERIOR_PRESETS = new Set(['campus', 'chiller', 'generator']);

  const STORY_BEATS = [
    {
      id: 'campus-tier3',
      min: 0.02,
      max: 0.074,
      pos: 'bottom-right',
      badge: '01 · TEMEL KAVRAMLAR',
      title: 'Veri Merkezi ve Tier III Nedir?',
      points: [
        {
          label: 'Veri Merkezi Nedir?',
          text: 'Fotoğraflarımızdan banka işlemlerimize kadar tüm dijital dünyayı 7/24 barındıran, yüksek güvenlikli özel bilgisayar binalarıdır.',
        },
        {
          label: 'Tier III Ne Demek?',
          text: 'Dayanıklılık seviyesini gösterir (1’den 4’e). Tier III, bakım yapılırken bile elektrik ve soğutmanın hiç kesilmediği (%99.982 süreklilik) standarttır.',
        },
      ],
    },
    {
      id: 'lobby-reception',
      min: 0.075,
      max: 0.104,
      pos: 'bottom-right',
      badge: '02 · KARŞILAMA & KAYIT',
      title: 'İçeri Kimler Girebilir?',
      points: [
        {
          label: 'Kimlik & Geçici Kart:',
          text: 'Ziyaretçi ve teknisyenler önce 7/24 resepsiyonda kimlik doğrulaması yapar; yalnızca gidecekleri odaya özel süreli geçiş kartı alır.',
        },
      ],
    },
    {
      id: 'lobby-noc-gate',
      min: 0.104,
      max: 0.125,
      pos: 'top-right',
      badge: '03 · İZLEME BÖLGESİ',
      title: 'Kontrol Merkezi Girişi',
      points: [
        {
          label: 'Yetkili İzleme Ekibi:',
          text: 'Bu turnike, tesisin elektrik, soğutma ve kameralarını 7/24 izleyen operatör odasına açılır; yalnızca yetkili ekip kartıyla geçilebilir.',
        },
      ],
    },
    {
      id: 'lobby-mantrap-gate',
      min: 0.125,
      max: 0.162,
      pos: 'top-left',
      badge: '04 · KRİTİK BÖLGE GEÇİŞİ',
      title: 'Çift Kapılı Güvenlik (Mantrap)',
      points: [
        {
          label: 'Tek Kişilik Kontrollü Geçiş:',
          text: 'Sunucu tarafına giden asıl kapı burasıdır. Arkadaki güvenlik bölmesinde ilk kapı tamamen kilitlenmeden ikinci kapı açılmaz; içeri tek seferde sadece bir kişi girebilir.',
        },
      ],
    },
    {
      id: 'security-xray-desk',
      min: 0.162,
      max: 0.183,
      pos: 'bottom-right',
      badge: '05 · FİZİKSEL GÜVENLİK KONTROLÜ',
      title: 'X-Ray Tarama & Güvenlik Kontrolü',
      points: [
        {
          label: 'Çift Enerjili X-Ray Tarayıcı:',
          text: 'Sunucu salonuna girecek tüm çanta, el aleti ve yedek donanımlar 140 kV X-Ray cihazından geçirilerek yasaklı materyallere karşı taranır.',
        },
        {
          label: 'Görevli Masası & Acil Müdahale:',
          text: 'Güvenlik personeli giriş izinlerini ve KKD/ESD kurallarını sahada denetler; odada acil durumlar için duvar tipi CO₂ söndürücü bulunur.',
        },
      ],
    },
    {
      id: 'security-dual-capsules',
      min: 0.183,
      max: 0.203,
      pos: 'bottom-right',
      badge: '06 · KATMANLI ERİŞİM & TARTIM',
      title: 'İkili Tartımlı Biyometrik Kapsül',
      points: [
        {
          label: 'Kilitli Çift Kapak (Interlocking):',
          text: 'Kapsüle aynı anda yalnızca bir kişi alınır; güvenlik tarafındaki kavisli cam tamamen kilitlenmeden sunucu salonu tarafı açılmaz.',
        },
        {
          label: 'Yük Hücreli (Load-Cell) Tartım:',
          text: 'Zemin terazisi kişinin giriş ve çıkıştaki ağırlığını karşılaştırır; içeriden izinsiz donanım veya disk çıkarılırsa kilo farkını algılayıp çıkışı kilitler.',
        },
      ],
    },
    {
      id: 'staging-nvr-logistics',
      min: 0.203,
      max: 0.232,
      pos: 'bottom-right',
      badge: '07 · DONANIM HAZIRLIK · NVR & LOJİSTİK',
      title: 'SEC-NVR-01, Taşıma Arabası & Stok Rafı',
      points: [
        {
          label: 'SEC-NVR-01 Güvenlik Kabini:',
          text: 'Kamera, biyometrik geçiş ve X-Ray kayıtlarının toplandığı NVR kabinidir; sunucu salonuyla tavandaki fiber kanal üzerinden haberleşir.',
        },
        {
          label: 'ESD Kaldırma Arabası & Yedek Rafı:',
          text: 'Yeni sunucular antistatik kaldırma arabasıyla taşınır; yedek blade kasalar, platinum PSU’lar ve OM4/OS2 fiber makaraları stokta hazır bekletilir.',
        },
      ],
    },
    {
      id: 'staging-bench-test',
      min: 0.232,
      max: 0.261,
      pos: 'bottom-right',
      badge: '08 · DONANIM HAZIRLIK · TEST & KURULUM',
      title: 'ESD Test Masası & TST-01 Kabini',
      points: [
        {
          label: 'ESD Burn-In Test Masası:',
          text: 'Yeni donanımların BIOS, firmware ve antistatik kontrolleri canlı salona girmeden önce ESD topraklı test tezgahında yapılır.',
        },
        {
          label: 'TST-01 Ön Kurulum Kabini:',
          text: 'Sunucu ve ağ cihazları canlı ağa alınmadan önce TST-01 test kabininde güç, sıcaklık ve yük testinden geçirilir; onaylananlar kapsül güvenlik hattından salona taşınır.',
        },
      ],
    },
    {
      id: 'power-batteries',
      min: 0.261,
      max: 0.32,
      pos: 'bottom-right',
      badge: '09 · GÜÇ ODASI · KESİNTİSİZ YEDEK',
      title: '480V Li-Ion Akü Bankaları (BAT-A / BAT-B)',
      points: [
        {
          label: 'Sıfır Kesinti Köprüsü:',
          text: 'Elektrik kesildiğinde jeneratörler çalışana kadar (ve yaklaşık 15 dakikalık tam yük otonomisi boyunca) tüm tesisi milisaniye kayıpsız taşıyan akü gruplarıdır.',
        },
        {
          label: 'Bağımsız A/B Yedeklilik:',
          text: 'BAT-A ve BAT-B koridorları kendi 480V DC şalter ve BMS izleme kabinleriyle ayrı çalışır; üst DC kanallardan UPS ünitelerine doğrudan enerji verir.',
        },
      ],
    },
    {
      id: 'power-ups-n1',
      min: 0.32,
      max: 0.344,
      pos: 'bottom-right',
      badge: '10 · GÜÇ ODASI · N+1 UPS OMURGASI',
      title: 'Modüler UPS-01..03 (3×500 kVA)',
      points: [
        {
          label: 'Online Çift Çevrim Koruma:',
          text: 'Şebekedeki tüm voltaj dalgalanmalarını ve kesintileri filtreleyerek sunuculara %96.8 verimle tertemiz ve kararlı AC güç sağlar.',
        },
        {
          label: 'Tier III N+1 Yedeklilik:',
          text: 'Üç adet 500 kVA UPS modüler yapıda çalışır; biri arızalansa veya bakıma alınsa bile kalan ikisi sunucu salonunun tam yükünü kesintisiz taşımaya devam eder.',
        },
      ],
    },
    {
      id: 'power-ats-busbar',
      min: 0.344,
      max: 0.392,
      pos: 'bottom-right',
      badge: '11 · GÜÇ ODASI · TRANSFER & A/B HAT',
      title: 'ATS Panoları, Bakır Busbar & Çift Besleme',
      points: [
        {
          label: 'ATS-01 & AG Dağıtım Panoları:',
          text: 'Dış şebeke kesildiğinde ATS-01 otomatik olarak yükü 2.5 MVA dizel jeneratörlere aktarır; AG-PANO-A/B ve BYPASS şalterleri bakımı güvenli kılar.',
        },
        {
          label: 'Feed-A & Feed-B Çift Yol (Tier III):',
          text: 'Tavandaki kalın bakır busbar (Feed-A) ile yedek kablo tavası (Feed-B) sunucu salonuna iki ayrı yoldan gider; tek hat kapatılsa bile kabinler kapanmaz.',
        },
      ],
    },
    {
      id: 'server-edge-core',
      min: 0.392,
      max: 0.464,
      pos: 'bottom-right',
      badge: '12 · SUNUCU SALONU · AĞ & GÜVENLİK',
      title: 'BGP İnternet, DDoS Kalkanı & 400G Omurga',
      points: [
        {
          label: 'BGP & 1.2 Tbps DDoS Koruması:',
          text: 'Dış dünyadan çift ISP ile gelen trafik önce BGP-EDGE-01 ile yönlendirilir, ardından FW-DDOS-01 kümesinde siber saldırı ve botnet trafiğinden arındırılır.',
        },
        {
          label: '400G Core Spine Omurga:',
          text: 'Temizlenen ağ trafiği CORE-SPINE-01 omurgasından tavan fiber köprüleri aracılığıyla sunucu koridorlarındaki dağıtım switchlerine dağıtılır.',
        },
      ],
    },
    {
      id: 'server-mmr-fire',
      min: 0.464,
      max: 0.502,
      pos: 'bottom-right',
      badge: '13 · SUNUCU SALONU · FİBER & SÖNDÜRME',
      title: 'Meet-Me Fiber Girişi & Novec 1230',
      points: [
        {
          label: 'MMR-ODF-01 Çift ISP Girişi:',
          text: 'Yeraltı menhollerden gelen yedekli ISP-A (sarı) ve ISP-B (turkuaz) fiber hatları kilitli çelik ODF kabininde sonlanır.',
        },
        {
          label: 'Novec 1230 Gazlı Söndürme:',
          text: 'Yangın anında su yerine elektrik iletmeyen temiz gaz basarak çalışan sunuculara ve verilere zarar vermeden alevi saniyeler içinde boğar.',
        },
      ],
    },
    {
      id: 'server-cold-aisle',
      min: 0.502,
      max: 0.532,
      pos: 'bottom-right',
      badge: '14 · SUNUCU SALONU · KAPALI KORİDOR',
      title: '42U Kabinetler & Kapalı Soğuk Koridor',
      points: [
        {
          label: 'Cold Aisle Containment:',
          text: 'Karşılıklı dizilen 12 adet 42U sunucu, switch ve depolama kabininin üstü cam tavanla kapatılarak soğuk havanın sıcak havayla karışması engellenir.',
        },
        {
          label: 'A/B Çift Güç & Fiber:',
          text: 'Her kabine tavandan hem yedekli Feed-A/B güç hattı hem de sarı/turkuaz çift fiber omurgası girer; koridor cam kapısı yaklaşım sensörüyle açılır.',
        },
      ],
    },
    {
      id: 'server-crah-airflow',
      min: 0.532,
      max: 0.556,
      pos: 'bottom-right',
      badge: '15 · SUNUCU SALONU · SOĞUTMA DÖNGÜSÜ',
      title: 'Yükseltilmiş Taban & CRAH Hassas Klima',
      points: [
        {
          label: 'Basınçlı Yükseltilmiş Döşeme:',
          text: 'Kuzey duvarındaki CRAH-01..04 üniteleri soğuk havayı yükseltilmiş taban altına üfler; soğuk hava delikli (perfore) yer karolarından sunucu önlerine yükselir.',
        },
        {
          label: 'Sıcak Hava Dönüşü:',
          text: 'Sunucuların arkasından çıkan sıcak hava tavan boşluğundan tekrar CRAH emişine döner; soğutma enerjisi yüksek verimle geri kazanılır.',
        },
      ],
    },
    {
      id: 'mech-phe-pumps-buffer',
      min: 0.556,
      max: 0.59,
      pos: 'bottom-right',
      badge: '16 · SOĞUTMA ODASI · EŞANJÖR & POMPA',
      title: 'PHE-01, VFD Pompalar & Tampon Tank',
      points: [
        {
          label: 'PHE-01 & P-01..03 Pompalar:',
          text: 'Dış Chiller hattından gelen soğuk suyu 2.4 MW plakalı eşanjörde yalıtır; N+1 yedekli 3 adet frekans kontrollü pompa sunucu salonu klimalarına basar.',
        },
        {
          label: 'BUFFER-01 (3000 L) Termal Tank:',
          text: 'Elektrik kesintisinde jeneratör devreye girene kadar yaklaşık 12 dakikalık kesintisiz soğutma rezervi (thermal ride-through) sağlar.',
        },
      ],
    },
    {
      id: 'mech-novec-central',
      min: 0.59,
      max: 0.614,
      pos: 'bottom-right',
      badge: '17 · SOĞUTMA ODASI · MERKEZİ SÖNDÜRME',
      title: 'Merkezi Novec 1230 Söndürme Deposu',
      points: [
        {
          label: 'Çok Bölgeli N+1 Gaz Bataryası:',
          text: '6×140 L (42 Bar) iletken olmayan temiz gaz tüpleri ve azot pilot hatları, seçici vana kolektörüyle tüm kritik odaları korur.',
        },
        {
          label: '5 Zon Otomatik Dağıtım:',
          text: 'Yangın algılandığında yalnızca ilgili bölgeye (Sunucu Salonu, Güç, NOC, Lobi veya Staging) yüksek basınçlı gaz boşaltılır; yanında 50 kg mobil elektrik söndürme arabası bulunur.',
        },
      ],
    },
    {
      id: 'mech-vfd-scada',
      min: 0.614,
      max: 0.652,
      pos: 'bottom-right',
      badge: '18 · SOĞUTMA ODASI · OTOMASYON & SCADA',
      title: 'VFD Sürücü, Glikol & Soğutma SCADA',
      points: [
        {
          label: 'VFD BMS & Glikol Dozaj:',
          text: 'Frekans invertörlü pano hat basıncına (ΔP) göre pompa devrini otomatik ayarlar; glikol ünitesi donmaya ve korozyona karşı tam koruma sağlar.',
        },
        {
          label: 'Canlı Soğutma SCADA:',
          text: 'Doğu duvarındaki SCADA ekranı besleme (18.5°C) ile dönüş sıcaklıklarını, pompa debilerini ve tüm hat basınçlarını 7/24 izler.',
        },
      ],
    },
    {
      id: 'noc-videowall-ops',
      min: 0.676,
      max: 0.728,
      pos: 'bottom-right',
      badge: '19 · KONTROL MERKEZİ (NOC) · 7/24 İZLEME',
      title: 'Micro-LED Komuta Duvarı & Operatörler',
      points: [
        {
          label: '7/24 Canlı Telemetri:',
          text: '4 panelli Micro-LED ekran duvarında PUE (1.23), toplam yük (1.42 MW), UPS/jeneratör durumu ve güvenlik kameraları anlık izlenir.',
        },
        {
          label: '4 Operatör İstasyonu (OP-01..04):',
          text: 'Her masada 3 monitör ve yedekli iş istasyonlarıyla ağ trafiği, soğutma ve acil durum müdahaleleri yönetilir.',
        },
      ],
    },
    {
      id: 'noc-idf-printer',
      min: 0.728,
      max: 0.764,
      pos: 'bottom-right',
      badge: '20 · KONTROL MERKEZİ · AĞ & ARŞİV',
      title: 'A3 Lazer Yazıcı & NOC-IDF-01 Kabini',
      points: [
        {
          label: 'Kuzey Arşiv & A3 Plotter:',
          text: 'Topoloji planları ve vardiya raporları kurumsal A3 lazer yazıcıda basılır; evraklar çelik dosya dolaplarında saklanır.',
        },
        {
          label: 'NOC-IDF-01 Dağıtım Kabini:',
          text: 'NOC içindeki tüm operatör konsolları ve Video Wall doğrudan sunucu salonuna bağlı NOC-IDF-01 switch kabini üzerinden beslenir.',
        },
      ],
    },
    {
      id: 'noc-window-exit',
      min: 0.764,
      max: 0.812,
      pos: 'bottom-right',
      badge: '21 · KONTROL MERKEZİ · GÖZLEM & ÇIKIŞ',
      title: 'Panoramik Gözlem Camı & Turnike Çıkışı',
      points: [
        {
          label: 'Fiziksel İzolasyon, Tam Görüş:',
          text: 'Operatörler yangın ve ses yalıtımlı cam duvarın arkasından tüm sunucu salonunu doğrudan gözlemler.',
        },
        {
          label: 'Kontrollü Lobi Çıkışı:',
          text: 'Kilitli ekipman/OTDR dolabı ve optik hız turnikeleri üzerinden güvenli lobi çıkışına geçilir.',
        },
      ],
    },
    {
      id: 'exterior-chiller-isp',
      min: 0.892,
      max: 0.938,
      pos: 'bottom-right',
      badge: '22 · DIŞ ALTYAPI · SOĞUTMA & FİBER',
      title: 'Chiller Sahası (CH-01..03) & ISP Menholleri',
      points: [
        {
          label: '3×850 kW V-Coil Free-Cooling Chiller:',
          text: 'Dış hava serinlediğinde kompresörleri devre dışı bırakıp serbest soğutma (economizer) yapan 3 ünite, içerideki PHE-01 ısı eşanjörüne 7°C soğutulmuş su gönderir.',
        },
        {
          label: 'Çift Yedekli ISP-A / ISP-B Menholleri:',
          text: 'Tesise birbirinden farklı iki coğrafi güzergahtan yeraltı fiber kabloları girer; fiziksel kablo kopmalarında dahi internet bağlantısı kesilmez.',
        },
      ],
    },
    {
      id: 'exterior-trafo-gen',
      min: 0.938,
      max: 0.968,
      pos: 'bottom-right',
      badge: '23 · DIŞ ALTYAPI · ENERJİ & JENERATÖR',
      title: '34.5 kV Trafo & 2×2.5 MVA Dizel Jeneratör',
      points: [
        {
          label: 'Çift Hat 34.5 kV / 400V Trafo Merkezi:',
          text: 'Ana iletim pilonundan gelen orta gerilim RMU hücrelerinden geçip TR-01 ve TR-02 (2×3150 kVA) trafolarında düşürülerek Güç Odası’na iletilir.',
        },
        {
          label: 'GEN-01 & GEN-02 (72 Saat Yakıtlı):',
          text: 'Uzun süreli şehir elektriği kesintisinde 2×2.5 MVA dizel jeneratörler otomatik senkron olup kesintisiz enerji sağlar.',
        },
      ],
    },
    {
      id: 'campus-tier3-finale',
      min: 0.968,
      max: 1.01,
      pos: 'bottom-right',
      badge: '24 · BÜYÜK FİNAL · TİER-III MİMARİ',
      title: 'Eş Zamanlı Bakım & N+1 Kampüs Özeti',
      points: [
        {
          label: '%99.982 Erişilebilirlik Standardı:',
          text: 'Girdiğiniz güvenlik kapısından sunucu soğutmasına, çift trafodan N+1 UPS ve jeneratörlere kadar hiçbir bileşen tek arıza noktası (SPOF) oluşturmaz.',
        },
        {
          label: 'Serbest Keşfe Hazır:',
          text: 'Aşağıdaki düğmeyle tüm kontrol panellerini açıp Çatı Kesiti, 2D Kroki ve oda kısayollarıyla dilediğiniz ekipmana tıklayabilirsiniz.',
        },
      ],
      actions: [
        { label: 'Serbest Moda Geç →', mode: 'orbit', primary: true },
        { label: 'İçinde Yürü (FPS)', mode: 'walk', primary: false },
      ],
    },
  ];
  let activeStoryId = '';

  function updateHeroIntroState() {
    if (!heroIntroEl) return;
    const hideHero = devUiEnabled || currentMode !== 'tour' || currentTourT > 0.014;
    heroIntroEl.classList.toggle('hero-hidden', hideHero);

    if (!storyOverlayEl) return;
    const showStory = !devUiEnabled && currentMode === 'tour';
    const beat = showStory
      ? STORY_BEATS.find((b) => currentTourT >= b.min && currentTourT < b.max) || null
      : null;

    if (!beat) {
      if (activeStoryId !== '') {
        activeStoryId = '';
        storyOverlayEl.classList.remove('story-visible', 'has-actions');
        storyOverlayEl.hidden = true;
      }
      return;
    }

    if (beat.id !== activeStoryId) {
      activeStoryId = beat.id;
      storyOverlayEl.classList.remove('story-visible');
      storyOverlayEl.dataset.pos = beat.pos || 'bottom-right';
      storyBadgeEl.textContent = beat.badge;
      storyTitleEl.textContent = beat.title;
      storyBodyEl.textContent = '';
      beat.points.forEach((pt) => {
        const p = document.createElement('p');
        p.className = 'story-point';
        const strong = document.createElement('strong');
        strong.textContent = `${pt.label} `;
        p.appendChild(strong);
        p.appendChild(document.createTextNode(pt.text));
        storyBodyEl.appendChild(p);
      });

      const hasActions = Array.isArray(beat.actions) && beat.actions.length > 0;
      storyOverlayEl.classList.toggle('has-actions', hasActions);
      if (storyActionsEl) {
        storyActionsEl.textContent = '';
        if (hasActions) {
          beat.actions.forEach((act) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = act.primary ? 'story-action-btn primary' : 'story-action-btn';
            btn.textContent = act.label;
            btn.addEventListener('click', () => {
              setDevUi(true);
              nav.setMode(act.mode || 'orbit');
            });
            storyActionsEl.appendChild(btn);
          });
          storyActionsEl.hidden = false;
        } else {
          storyActionsEl.hidden = true;
        }
      }

      storyOverlayEl.hidden = false;
      void storyOverlayEl.offsetWidth;
      requestAnimationFrame(() => {
        if (activeStoryId === beat.id) {
          storyOverlayEl.classList.add('story-visible');
        }
      });
    }
  }

  function setRoofRemoved(removed) {
    if (roofRemoved === removed) return;
    roofRemoved = removed;
    roofGroup.visible = !roofRemoved;
    btnToggleRoof.setAttribute('aria-pressed', String(roofRemoved));
    renderer.shadowMap.needsUpdate = true;
  }

  function showInspector(info) {
    inspectorCatEl.textContent = info.category;
    inspectorNameEl.textContent = info.name;
    inspectorSpecsEl.textContent = info.specs;
    inspectorBarEl.hidden = false;
    audio.playInspectCue();
  }

  btnCloseInspector.addEventListener('click', () => {
    inspectorBarEl.hidden = true;
  });

  const TOUR_CHAPTERS = [
    {
      min: 0.0,
      max: 0.02,
      stage: 'BÖLÜM 1 · DIŞ KAMPÜS → GİRİŞ LOBİSİ',
      step: '1 / 11',
      title: 'Tier-III Veri Merkezi Kampüsü',
      desc: 'Çift hatlı 34.5 kV enerji beslemesi, çevre güvenlik çiti, nizamiye ve ana veri merkezi binasına dış bakış.',
    },
    {
      min: 0.02,
      max: 0.07,
      stage: 'BÖLÜM 1 · KAMPÜS GÜVENLİĞİ',
      step: '2 / 11',
      title: 'Nizamiye & Yaya Protokol Kapısı',
      desc: '7/24 kampüs çevre güvenliği ve RFID kontrollü çift kanatlı cam protokol kapısının yaklaşım sensörüyle otomatik açılışı.',
    },
    {
      min: 0.07,
      max: 0.16,
      stage: 'BÖLÜM 1 · GİRİŞ LOBİSİ',
      step: '3 / 11',
      title: 'Ana Giriş, Resepsiyon & Optik Turnikeler',
      desc: 'Otomatik cam giriş kapısından lobiye geçiş, 7/24 kayıt bankosu, ziyaretçi alanı ve Biyometrik Mantrap öncesi turnikeler.',
    },
    {
      min: 0.16,
      max: 0.261,
      stage: 'BÖLÜM 2 · GÜVENLİK & STAGİNG',
      step: '4 / 11',
      title: 'Mantrap, X-Ray, Tartımlı Kapsül & Staging',
      desc: 'Biyometrik mantrap, 140 kV X-Ray tarama, ikili tartımlı güvenlik kapsülleri ve Donanım Hazırlık (SEC-NVR-01, ESD tezgah, TST-01).',
    },
    {
      min: 0.261,
      max: 0.398,
      stage: 'BÖLÜM 3 · GÜÇ & UPS ODASI',
      step: '5 / 11',
      title: 'BAT-A/B Aküler, N+1 UPS & Ana Dağıtım',
      desc: 'Lityum-İyon akü grupları, UPS-01..03 (500 kVA N+1) üniteleri, AG/OG dağıtım panoları ve tavan bakır busbar omurgası.',
    },
    {
      min: 0.398,
      max: 0.488,
      stage: 'BÖLÜM 4A · EDGE & CORE AĞ KÜMESİ',
      step: '6 / 11',
      title: 'BGP-EDGE-01 · FW-DDOS-01 · CORE-SPINE-01',
      desc: 'Çift ISP yönlendirme (BGP4), 1.2 Tbps DDoS & Firewall koruması ve 400G Core Spine omurga kabinlerinin önünden sırayla geçiş.',
    },
    {
      min: 0.488,
      max: 0.555,
      stage: 'BÖLÜM 4B · SUNUCU SALONU',
      step: '7 / 11',
      title: 'MMR-ODF-01, Novec 1230 & Soğuk Koridor A',
      desc: 'Meet-Me fiber girişi, gazlı yangın söndürme tüpleri ve cam kapısı otomatik açılan Soğuk Koridor içindeki 42U kabinler.',
    },
    {
      min: 0.555,
      max: 0.678,
      stage: 'BÖLÜM 5 · SOĞUTMA ODASI',
      step: '8 / 11',
      title: 'Plakalı Eşanjör (PHE), VFD Pompalar & Tank',
      desc: 'Sunucu salonundaki CRAH-01..04 ünitelerine 18.5°C soğutulmuş su sağlayan mekanik pompa grubu ve VFD kontrol panosu.',
    },
    {
      min: 0.678,
      max: 0.901,
      stage: 'BÖLÜM 6 · KONTROL MERKEZİ (NOC)',
      step: '9 / 11',
      title: 'Video Wall, Konsollar, Yazıcı & Ana Kapı Çıkışı',
      desc: 'Micro-LED izleme duvarı, operatör masaları ve yazıcı hattını dolaşarak NOC güney kapısından lobiye ve ana girişten açık havaya çıkış.',
    },
    {
      min: 0.901,
      max: 0.957,
      stage: 'BÖLÜM 7 · DIŞ ALTYAPI SAHASI',
      step: '10 / 11',
      title: 'Chiller Sahası (CH-01..03) & ISP Menholleri',
      desc: 'Açık havadan kuzeye yükselerek 3×850 kW Free-Cooling Chiller üniteleri ve yeraltı ISP-A/B fiber menholleri.',
    },
    {
      min: 0.957,
      max: 1.01,
      stage: 'BÖLÜM 7 · BÜYÜK FİNAL',
      step: '11 / 11',
      title: 'Jeneratör, Trafo & Tier-III Kampüs Kuşbakışı',
      desc: '2×2.5 MVA dizel jeneratör, 34.5 kV trafo sahası ve tüm tesisin N+1 yedekli mimarisine üstten genel bakış.',
    },
  ];
  let lastTourStep = '';
  let isScrubbingTour = false;

  function updateTourHud(t) {
    currentTourT = t;
    updateHeroIntroState();
    if (!isScrubbingTour) {
      tourRangeEl.value = String(Math.round(t * 1000));
    }
    btnTourPrev.disabled = t <= 0.015;
    btnTourNext.disabled = t >= 0.985;

    const chapter = TOUR_CHAPTERS.find((c) => t >= c.min && t < c.max) || TOUR_CHAPTERS[TOUR_CHAPTERS.length - 1];
    if (chapter.step !== lastTourStep) {
      lastTourStep = chapter.step;
      tourStageBadgeEl.textContent = chapter.stage;
      tourStepBadgeEl.textContent = chapter.step;
      tourTitleEl.textContent = chapter.title;
      tourDescEl.textContent = chapter.desc;
    }
  }

  // Navigation Controller
  const nav = createNavigationController({
    camera,
    domElement: renderer.domElement,
    colliders,
    doors,
    gates: animatedGates,
    inspectables,
    isSoftwareGl,
    onInspect: showInspector,
    onTourProgress: updateTourHud,
    onModeChange: (nextMode) => {
      currentMode = nextMode;
      updateHeroIntroState();
      const isWalk = nextMode === 'walk';
      const isTour = nextMode === 'tour';
      const isOrbit = nextMode === 'orbit';
      btnModeTour.classList.toggle('active', isTour);
      btnModeOrbit.classList.toggle('active', isOrbit);
      btnModeWalk.classList.toggle('active', isWalk);
      modeReadoutEl.textContent = isTour
        ? 'Rehberli Tur (Scroll)'
        : isWalk
          ? 'Yürüyüş Modu (FPS)'
          : 'Serbest İnceleme';
      tourCardEl.hidden = !isTour;
      walkReticleEl.hidden = !isWalk;
      walkHintEl.hidden = !isWalk;
      touchDpadEl.hidden = !isWalk;
      if ((isWalk || isTour) && roofRemoved) {
        setRoofRemoved(false);
      }
      if (isWalk || isTour) {
        blueprintViewActive = false;
        btnToggleBlueprint.setAttribute('aria-pressed', 'false');
      }
    },
  });

  // Interactive 2D Kroki Controller
  const blueprint = createBlueprintController(krokiCanvas, (wx, wz, roomId) => {
    nav.teleportToPoint(wx, wz);
    if (nav.getMode() === 'orbit') {
      setRoofRemoved(!EXTERIOR_PRESETS.has(roomId));
    }
    presetBtns.forEach((b) => b.classList.toggle('active', b.dataset.preset === roomId));
  });

  // UI Event Handlers
  btnModeTour.addEventListener('click', () => nav.setMode('tour'));
  btnModeOrbit.addEventListener('click', () => nav.setMode('orbit'));
  btnModeWalk.addEventListener('click', () => nav.setMode('walk'));

  btnTourPrev.addEventListener('click', () => nav.stepTour(-1));
  btnTourNext.addEventListener('click', () => nav.stepTour(1));
  tourRangeEl.addEventListener('pointerdown', () => {
    isScrubbingTour = true;
  });
  tourRangeEl.addEventListener('input', () => {
    nav.setTourProgress(Number(tourRangeEl.value) / 1000);
  });
  const stopScrub = () => {
    isScrubbingTour = false;
  };
  tourRangeEl.addEventListener('pointerup', stopScrub);
  tourRangeEl.addEventListener('change', stopScrub);
  tourCardEl.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      nav.nudgeTour(e.deltaY);
    },
    { passive: false }
  );

  // Start in Stage 1 Guided Tour from the Campus exterior opening angle
  nav.setMode('tour', { reset: true });

  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.preset;
      presetBtns.forEach((b) => b.classList.toggle('active', b === btn));
      blueprintViewActive = false;
      btnToggleBlueprint.setAttribute('aria-pressed', 'false');

      // When inspecting interior rooms in Orbit mode, auto-lift roof for clear cutaway view
      nav.flyToPreset(key);
      if (nav.getMode() === 'orbit') {
        setRoofRemoved(!EXTERIOR_PRESETS.has(key));
      }
    });
  });

  btnToggleRoof.addEventListener('click', () => {
    setRoofRemoved(!roofRemoved);
  });

  btnToggleBlueprint.addEventListener('click', () => {
    blueprintViewActive = !blueprintViewActive;
    btnToggleBlueprint.setAttribute('aria-pressed', String(blueprintViewActive));
    if (blueprintViewActive) {
      if (nav.getMode() === 'walk') nav.setMode('orbit');
      setRoofRemoved(true);
      nav.flyToPreset('blueprint');
      presetBtns.forEach((b) => b.classList.remove('active'));
    } else {
      setRoofRemoved(false);
      nav.flyToPreset('campus');
      presetBtns.forEach((b) => b.classList.toggle('active', b.dataset.preset === 'campus'));
    }
  });

  btnCollapseDock.addEventListener('click', () => {
    const collapsed = dockWrapper.classList.toggle('dock-collapsed');
    btnCollapseDock.setAttribute('aria-expanded', String(!collapsed));
    btnCollapseDock.textContent = collapsed ? '▴ Kontrolleri Göster' : '▾ Kontrolleri Gizle';
  });

  btnToggleKroki.addEventListener('click', () => {
    const collapsed = krokiBody.classList.toggle('collapsed');
    btnToggleKroki.setAttribute('aria-expanded', String(!collapsed));
    btnToggleKroki.textContent = collapsed ? 'Göster' : 'Gizle';
  });

  // Touch D-Pad wiring
  touchDpadEl.querySelectorAll('button[data-move]').forEach((btn) => {
    const dir = btn.dataset.move;
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      nav.setTouchDirection(dir, true);
    });
    const stop = () => nav.setTouchDirection(dir, false);
    btn.addEventListener('pointerup', stop);
    btn.addEventListener('pointerleave', stop);
    btn.addEventListener('pointercancel', stop);
  });

  // Developer UI Toggle (hidden by default; type `dev` or `dev()` in browser DevTools Console to show/hide controls)
  function syncExploreToggleBtn() {
    if (!btnToggleExplore) return;
    btnToggleExplore.setAttribute('aria-pressed', String(devUiEnabled));
    btnToggleExplore.textContent = devUiEnabled ? '🎬 Tura Dön' : '🧭 Serbest Keşif';
    btnToggleExplore.title = devUiEnabled
      ? 'Sade rehberli tur görünümüne geri dön'
      : 'Serbest kamera, FPS yürüme ve 2D kat krokisi kontrollerini aç';
  }

  function setDevUi(enabled) {
    devUiEnabled = Boolean(enabled);
    document.body.classList.toggle('dev-ui', devUiEnabled);
    syncExploreToggleBtn();
    updateHeroIntroState();
    lastBpX = NaN;
    lastBpYaw = NaN;
    console.info(
      devUiEnabled
        ? '[Veri Merkezi 3D] Geliştirici kontrolleri AÇILDI. Kapatmak için konsola tekrar `dev` yazın.'
        : '[Veri Merkezi 3D] Geliştirici kontrolleri GİZLENDİ. Açmak için konsola `dev` yazın.'
    );
    return devUiEnabled;
  }

  if (btnHeroStart) {
    btnHeroStart.addEventListener('click', () => {
      audio.unlock();
      if (nav.getMode() !== 'tour') nav.setMode('tour');
      nav.setTourProgress(0.032);
    });
  }

  if (btnToggleExplore) {
    syncExploreToggleBtn();
    btnToggleExplore.addEventListener('click', () => {
      audio.unlock();
      if (devUiEnabled) {
        setDevUi(false);
        nav.setMode('tour');
      } else {
        setDevUi(true);
        if (nav.getMode() === 'tour') {
          nav.setMode('orbit');
        }
      }
    });
  }

  const devApi = (force) => {
    const now = performance.now();
    if (typeof force === 'boolean') {
      lastDevToggleMs = now;
      return setDevUi(force);
    }
    if (now - lastDevToggleMs < 80) {
      return devUiEnabled;
    }
    lastDevToggleMs = now;
    return setDevUi(!devUiEnabled);
  };

  Object.defineProperty(window, 'dev', {
    configurable: true,
    enumerable: false,
    get() {
      const now = performance.now();
      if (now - lastDevToggleMs >= 80) {
        lastDevToggleMs = now;
        setDevUi(!devUiEnabled);
      }
      return devApi;
    },
  });

  // Keyboard shortcuts (R: Roof Cutaway, K: Top-down Kroki, H: Hide Dock, M: Minimap — active in dev mode)
  window.addEventListener('keydown', (e) => {
    if (!devUiEnabled) return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    if (e.code === 'KeyR') btnToggleRoof.click();
    else if (e.code === 'KeyK') btnToggleBlueprint.click();
    else if (e.code === 'KeyH') btnCollapseDock.click();
    else if (e.code === 'KeyM') btnToggleKroki.click();
  });

  // Resize handler
  const onResize = () => {
    const w = mount.clientWidth || window.innerWidth;
    const h = mount.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
  };
  window.addEventListener('resize', onResize);

  // Frame Loop with Software-WebGL afterDraw Pacing
  const clock = new THREE.Clock();
  let frameId = 0;
  let nocRedrawAccum = 0;
  let lastZoneText = '';
  let lastBpX = NaN;
  let lastBpZ = NaN;
  let lastBpYaw = NaN;
  let lastGateSum = -1;

  function isDoorOpenNear(dx, dz) {
    for (let i = 0; i < doors.length; i++) {
      const d = doors[i];
      if (Math.abs(d.x - dx) < 0.6 && Math.abs(d.z - dz) < 0.6 && d.openAmount > 0.02) {
        return true;
      }
    }
    return false;
  }

  function updateVisibilityCulling(zoneKey, isInsideClosedBuilding) {
    const extGrp = exterior.exteriorGroup;
    if (roofRemoved) {
      extGrp.visible = true;
      roofTopProps.visible = true;
      zoneGroups.lobby.visible = true;
      zoneGroups.staging.visible = true;
      zoneGroups.noc.visible = true;
      zoneGroups.server.visible = true;
      zoneGroups.power.visible = true;
      zoneGroups.mech.visible = true;
      return;
    }

    if (isInsideClosedBuilding) {
      roofTopProps.visible = false;
      const showExt =
        zoneKey === 'lobby' || zoneKey === 'noc' || (zoneKey === 'power' && isDoorOpenNear(17.82, 9.8));
      extGrp.visible = showExt;

      zoneGroups.lobby.visible =
        zoneKey === 'lobby' || zoneKey === 'noc' || zoneKey === 'staging';
      zoneGroups.noc.visible = zoneKey === 'noc' || zoneKey === 'lobby' || zoneKey === 'server';
      zoneGroups.staging.visible =
        zoneKey === 'staging' ||
        zoneKey === 'lobby' ||
        zoneKey === 'server' ||
        (zoneKey === 'power' && isDoorOpenNear(9.0, 9.1));
      zoneGroups.server.visible =
        zoneKey === 'server' ||
        zoneKey === 'noc' ||
        zoneKey === 'staging' ||
        (zoneKey === 'power' && isDoorOpenNear(9.0, -3.9)) ||
        (zoneKey === 'mech' && isDoorOpenNear(-7.0, -9.0));
      zoneGroups.power.visible =
        zoneKey === 'power' ||
        (zoneKey === 'staging' && isDoorOpenNear(9.0, 9.1)) ||
        (zoneKey === 'server' && isDoorOpenNear(9.0, -3.9));
      zoneGroups.mech.visible = zoneKey === 'mech' || (zoneKey === 'server' && isDoorOpenNear(-7.0, -9.0));
      return;
    }

    // Outside with closed roof: hide solid interior rooms, keep lobby/noc if visible from front/west exterior
    extGrp.visible = true;
    roofTopProps.visible = true;
    const frontExterior = camera.position.z > -4 || camera.position.x < -8;
    zoneGroups.lobby.visible = frontExterior;
    zoneGroups.noc.visible = frontExterior;
    zoneGroups.staging.visible = false;
    zoneGroups.server.visible = false;
    zoneGroups.power.visible = false;
    zoneGroups.mech.visible = false;
  }

  function afterDraw(cb) {
    const gl = renderer.getContext();
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        frameId = window.setTimeout(cb, 80);
      }
    };
    frameId = window.setTimeout(poll, 5);
  }

  function tick() {
    const dt = clock.getDelta();
    const elapsed = clock.elapsedTime;

    const yawRad = nav.update(dt);

    // Adjust visibility culling for closed rooms / exterior before rendering
    const zoneKey = getZoneKeyAt(camera.position.x, camera.position.z);
    const isInsideClosedBuilding = !roofRemoved && zoneKey !== null && camera.position.y < 5.35;
    updateVisibilityCulling(zoneKey, isInsideClosedBuilding);
    audio.update(dt, {
      camX: camera.position.x,
      camY: camera.position.y,
      camZ: camera.position.z,
      zoneKey,
      doors,
    });

    // Update cached shadow map only when exterior gates are actively moving
    if (sunLight.castShadow && exterior.exteriorGroup.visible) {
      let gateSum = 0;
      for (let i = 0; i < animatedGates.length; i++) {
        gateSum += animatedGates[i].openAmount;
      }
      if (Math.abs(gateSum - lastGateSum) > 0.002) {
        lastGateSum = gateSum;
        renderer.shadowMap.needsUpdate = true;
      }
    }

    // Spin exterior chiller condenser fans only when exterior is visible
    if (exterior.exteriorGroup.visible) {
      const fanSpin = dt * 6.5;
      for (let i = 0; i < animatedFans.length; i++) {
        animatedFans[i].rotation.y += fanSpin;
      }
    }

    // Only update & draw cabinet LEDs when Server Hall, NOC, or Roof Cutaway is active
    const wantLeds =
      roofRemoved || zoneGroups.server.visible || zoneKey === 'noc';
    updateLeds.setActive(wantLeds);
    if (wantLeds) {
      updateLeds(elapsed);
    }

    let envTarget = 1.0;
    let hemiTarget = 0.72;
    let fillTarget = 0.55;
    let sunTarget = 1.85;

    if (isInsideClosedBuilding) {
      envTarget = 1.2;
      hemiTarget = 1.2;
      fillTarget = 0.62;
      sunTarget = zoneKey === 'lobby' ? 1.85 : 0.75;
    }

    const blend = Math.min(1, dt * 8);
    scene.environmentIntensity += (envTarget - scene.environmentIntensity) * blend;
    hemiLight.intensity += (hemiTarget - hemiLight.intensity) * blend;
    fillLight.intensity += (fillTarget - fillLight.intensity) * blend;
    sunLight.intensity += (sunTarget - sunLight.intensity) * blend;

    // Refresh NOC video wall telemetry twice per second only when NOC zone group is visible
    nocRedrawAccum += dt;
    if (nocRedrawAccum >= 0.5) {
      nocRedrawAccum = 0;
      if (zoneGroups.noc.visible) {
        nocWallManager.update(elapsed);
      }
    }

    // Update live zone indicator & 2D Kroki minimap (only redraw 2D canvas when camera moved)
    const currentZone = getZoneNameAt(camera.position.x, camera.position.z);
    if (currentZone !== lastZoneText) {
      lastZoneText = currentZone;
      zoneLabelEl.textContent = currentZone;
    }
    if (devUiEnabled && !krokiBody.classList.contains('collapsed')) {
      if (
        Number.isNaN(lastBpX) ||
        Math.abs(camera.position.x - lastBpX) > 0.02 ||
        Math.abs(camera.position.z - lastBpZ) > 0.02 ||
        Math.abs(yawRad - lastBpYaw) > 0.004
      ) {
        lastBpX = camera.position.x;
        lastBpZ = camera.position.z;
        lastBpYaw = yawRad;
        blueprint.render(camera.position.x, camera.position.z, yawRad);
      }
    } else {
      lastBpX = NaN;
    }

    renderer.render(scene, camera);

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }
  }

  tick();

  function disposeSceneResources() {
    const disposedGeos = new Set();
    const disposedMats = new Set();
    const disposedTexs = new Set();
    scene.traverse((obj) => {
      if (obj.geometry && !disposedGeos.has(obj.geometry)) {
        disposedGeos.add(obj.geometry);
        obj.geometry.dispose();
      }
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((mat) => {
          if (!mat || disposedMats.has(mat)) return;
          disposedMats.add(mat);
          for (const key of Object.keys(mat)) {
            const val = mat[key];
            if (val && val.isTexture && !disposedTexs.has(val)) {
              disposedTexs.add(val);
              val.dispose();
            }
          }
          mat.dispose();
        });
      }
    });
    if (scene.environment && !disposedTexs.has(scene.environment)) {
      scene.environment.dispose();
    }
    clearTextureCache();
    sharedGeoPool.clear();
  }

  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(frameId);
    clearTimeout(frameId);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('pointerdown', handleFirstUserGesture);
    window.removeEventListener('keydown', handleFirstUserGesture);
    window.removeEventListener('wheel', handleFirstUserGesture);
    audio.dispose();
    nav.dispose();
    exterior?.dispose?.();
    disposeSceneResources();
    renderer.dispose();
  });
}

init();
