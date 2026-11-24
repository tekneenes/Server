import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _move = new THREE.Vector3();
const _rayMouse = new THREE.Vector2();
const _lookDir = new THREE.Vector3();
const _tourPos = new THREE.Vector3();
const _tourLook = new THREE.Vector3();

// Tam 7 Bölümlü Tier-III Rehberli Tur Yolu (Seçenek A: NOC -> Lobi Ana Kapıdan Açık Havaya Çıkış)
const TOUR_STAGE_STOPS = [0.0, 0.0351, 0.1228, 0.2105, 0.3158, 0.4386, 0.5263, 0.5789, 0.7018, 0.9298, 1.0];

const tourPosCurve = new THREE.CatmullRomCurve3(
  [
    // Bölüm 1: Dış Kampüs -> Protokol Kapısı -> Giriş Lobisi
    new THREE.Vector3(-24.2, 9.4, 33.8),  // 0: Fotoğraf açılış açısı
    new THREE.Vector3(-15.5, 4.6, 28.8),  // 1: Nizamiye önü
    new THREE.Vector3(-10.5, 2.05, 25.0), // 2: Yaya Protokol Kapısı (otomatik açılır)
    new THREE.Vector3(-11.0, 1.92, 20.0), // 3: Kampüs meydanı yürüyüş yolu
    new THREE.Vector3(-11.5, 1.9, 14.8),  // 4: Ana bina cam kapı önü (otomatik açılır)
    new THREE.Vector3(-11.5, 1.88, 11.6), // 5: Lobi giriş paspası & Resepsiyon bankosu önü
    new THREE.Vector3(-12.5, 1.92, 9.4),  // 6: Resepsiyon yanından yumuşak sağa dönüş (NOC & pano önü)
    new THREE.Vector3(-11.0, 1.95, 8.1),  // 7: Lobi orta koridordan dijital rehber & turnikelere yöneliş
    new THREE.Vector3(-8.8, 1.94, 8.6),   // 8: Optik turnike giriş hizasına yumuşak yaklaşım
    // Bölüm 2: Turnikeler -> Biyometrik Mantrap -> Güvenlik & Staging
    new THREE.Vector3(-6.35, 1.9, 8.61),  // 9: Optik turnike koridoru & Mantrap kapısı
    new THREE.Vector3(-3.6, 1.92, 8.85),  // 10: Güvenlik odası içi -> X-Ray & Güvenlik Masası
    new THREE.Vector3(-0.15, 1.92, 8.95), // 11: İkili Tartımlı Biyometrik Kapsüllerin tam karşısı
    new THREE.Vector3(4.45, 1.95, 9.25),  // 12: Donanım Hazırlık -> SEC-NVR-01, taşıma arabası & stok rafı
    new THREE.Vector3(5.2, 1.95, 8.85),   // 13: Donanım Hazırlık içi yumuşak doğu dönüşü
    new THREE.Vector3(6.0, 1.95, 8.55),   // 14: ESD Burn-In Test Masası & TST-01 kabini tam karşısı
    // Bölüm 3: Güç & UPS Odası (BAT-A güney ucunu dolaşarak açık koridora dönüş)
    new THREE.Vector3(8.4, 1.92, 9.2),    // 10: Güç & UPS Güney kapısı girişi
    new THREE.Vector3(11.2, 1.95, 9.6),   // 11: BAT-A güney ucu önü (tamamen açık güney koridoru)
    new THREE.Vector3(13.6, 1.98, 9.5),   // 12: BAT-A ve BAT-B arası orta koridora dönüş
    new THREE.Vector3(13.6, 2.02, 5.2),   // 13: BAT-A / BAT-B akü grupları arası
    new THREE.Vector3(13.6, 2.05, -2.5),  // 14: UPS-01..03, Switchgear & Busbar omurgası
    new THREE.Vector3(12.95, 2.02, -6.9), // 15: ATS-01, AG-Pano & BYPASS panolarına yakın bakış
    new THREE.Vector3(11.9, 1.98, -4.3),  // 16: Feed-A/B hatları altından Sunucu Salonu kapısına yöneliş
    new THREE.Vector3(10.2, 1.95, -3.9),  // 17: Sunucu Salonu Doğu kapısı hizası
    // Bölüm 4A: Sunucu Salonu — Edge & Core Ağ Kümesi önünden yakın sırayla geçiş
    new THREE.Vector3(6.0, 1.95, -2.8),   // 16: Güç kapısı çıkışı -> Edge/Core sırasına dönüş
    new THREE.Vector3(5.35, 1.92, -0.1),  // 17: BGP-EDGE-01 tam karşısı
    new THREE.Vector3(5.35, 1.92, 1.0),   // 18: FW-DDOS-01 tam karşısı
    new THREE.Vector3(5.35, 1.92, 2.1),   // 19: CORE-SPINE-01 tam karşısı
    // Bölüm 4B: Meet-Me, Novec 1230 & Soğuk Koridor A
    new THREE.Vector3(4.5, 1.95, -3.0),   // 20: Açık koridordan kuzeye dönüş
    new THREE.Vector3(5.95, 1.95, -8.35), // 21: MMR-ODF-01 & Novec 1230 tüpleri yakın önü
    new THREE.Vector3(4.2, 1.95, -7.9),   // 22: Soğuk Koridor A Doğu kapısı önü
    new THREE.Vector3(-0.4, 1.9, -7.9),   // 23: Soğuk Koridor A içi (42U kabinler & LED)
    new THREE.Vector3(-5.2, 1.95, -7.9),  // 24: Soğuk Koridor A Batı çıkışı -> CRAH-01
    // Bölüm 5: Soğutma Odası (Mechanical — etrafı yumuşak tur ile dolaşıp kapıdan çıkış)
    new THREE.Vector3(-7.0, 1.92, -9.0),  // 27: Soğutma Odası kapı merkezi giriş
    new THREE.Vector3(-10.4, 1.98, -7.4), // 28: PHE Plakalı Eşanjör, VFD Pompalar & Buffer Tank
    new THREE.Vector3(-13.2, 1.96, -7.65), // 29: Batıya yumuşak dönüş -> Novec 1230 Söndürme Deposu önü
    new THREE.Vector3(-11.6, 1.95, -7.55), // 30: Güney koridordan dönüş -> VFD Sürücü & Glikol Dozaj
    new THREE.Vector3(-9.2, 1.94, -7.85),  // 31: Doğuya dönüş -> Soğutma SCADA & kapıya yöneliş
    new THREE.Vector3(-7.0, 1.92, -9.0),  // 32: Soğutma Odası kapısından merkezli yumuşak çıkış
    new THREE.Vector3(-5.4, 1.95, -6.8),  // 33: Batı koridoruna dönüş ve NOC kapısına süzülüş
    // Bölüm 6: Kontrol Merkezi (NOC -> Video Wall önüne gidiş -> Masalar & Yazıcı -> Güney Kapıdan Lobiye Çıkış)
    new THREE.Vector3(-5.4, 1.95, 3.1),   // 34: Batı koridoru -> NOC doğu kapısı tam merkezi
    new THREE.Vector3(-9.5, 2.2, 3.0),    // 35: NOC giriş -> Video Wall & operatör konsolları
    new THREE.Vector3(-15.4, 2.02, 2.6),  // 36: Karşı tarafa (Video Wall önüne) gidiş & sağa dönüş başlangıcı
    new THREE.Vector3(-15.5, 2.02, -2.2), // 37: Sağa dönerek operatör masaları & kuzey yazıcı yönüne ilerleyiş
    new THREE.Vector3(-11.0, 1.98, -3.1), // 38: Lazer yazıcı önünden NOC-IDF-01 kabinetine yöneliş
    new THREE.Vector3(-9.35, 1.98, -0.2), // 39: Doğu koridorundan panoramik sunucu salonu camına & masalara bakış
    new THREE.Vector3(-11.2, 1.95, 2.8),  // 42: NOC Depo önünden güney cam kapı doğu turnike hattına yöneliş
    new THREE.Vector3(-12.01, 1.95, 5.0), // 43: NOC -> Lobi güney cam kapısı & doğu turnike şeridinden çıkış
    new THREE.Vector3(-12.01, 1.92, 9.2), // 44: Lobi batı geçişinden ana kapıya yöneliş
    new THREE.Vector3(-11.5, 1.9, 13.0),  // 43: Ana cam giriş kapısından dışarı adım atış
    new THREE.Vector3(-12.8, 2.25, 18.0), // 44: Ön açık alanda yumuşak sağa dönüş & yükseliş başlangıcı
    new THREE.Vector3(-17.8, 4.2, 16.5),  // 45: Nizamiye üzerinden batı köşesine kademeli tırmanış
    new THREE.Vector3(-22.5, 7.2, 11.2),  // 46: Batı cephesi boyunca çatı hizasına yumuşak yükseliş
    new THREE.Vector3(-24.5, 10.5, 4.5),  // 47: Açık havadan kuzeye süzülerek Chiller sahasına bakış
    // Bölüm 7: Dış Altyapı Sahası & Güney-Doğu Yayından Kuşbakışı Final (çatı ortasından geçmeden)
    new THREE.Vector3(-14.5, 10.2, -22.5), // 48: Dış Chiller Sahası & ISP Fiber Menholleri
    new THREE.Vector3(10.5, 14.4, -18.5),  // 49: 34.5 kV şebeke pilonunun üstünden ve önünden engelsiz geçiş
    new THREE.Vector3(31.5, 11.8, -13.5),  // 50: Yedek Dizel Jeneratör & 34.5 kV Trafo Sahası geniş açısı
    new THREE.Vector3(26.5, 17.5, 23.0),   // 51: Güneydoğu otopark/bulvar üzerinden dış yayla yükselerek dönüş
    new THREE.Vector3(-24.0, 22.0, 31.0),  // 52: Tüm Kampüs Kuşbakışı Final Görünüm
  ],
  false,
  'centripetal',
  0.5
);

const tourLookCurve = new THREE.CatmullRomCurve3(
  [
    new THREE.Vector3(-6.8, 2.8, 10.5),
    new THREE.Vector3(-10.5, 2.3, 19.5),
    new THREE.Vector3(-11.2, 2.1, 13.0),
    new THREE.Vector3(-11.5, 2.2, 12.0),
    new THREE.Vector3(-11.5, 1.75, 9.5),  // 4: Ana cam kapıdan lobiye giriş
    new THREE.Vector3(-14.8, 1.55, 8.8),  // 5: NEXA Resepsiyon bankosu & marka tabelası
    new THREE.Vector3(-11.8, 1.85, 5.4),  // 6: Kuzey duvarı & NOC cam cephesi üzerinden yumuşak sağ pan
    new THREE.Vector3(-6.8, 1.7, 7.6),    // 7: Dijital tesis rehberi & optik turnikelere doğru dönüş
    new THREE.Vector3(-5.2, 1.5, 8.85),   // 8: Optik turnike geçidine hizalanma
    new THREE.Vector3(-2.5, 1.5, 8.6),    // 9: Turnike sonrası Mantrap & X-Ray
    new THREE.Vector3(-2.1, 1.4, 6.4),    // 10: X-Ray & güvenlik kontrol
    new THREE.Vector3(1.2, 1.65, 5.0),    // 11: İkili Tartımlı Biyometrik Güvenlik Kapsülü
    new THREE.Vector3(4.75, 1.42, 5.95),  // 12: SEC-NVR-01, taşıma arabası & yedek parça rafı
    new THREE.Vector3(8.8, 1.45, 8.2),    // 13: Doğu yönüne yumuşak pan (masaya dönüş)
    new THREE.Vector3(6.0, 1.35, 11.4),   // 14: ESD Test Masası & TST-01 kabini tam karşısı
    new THREE.Vector3(12.2, 1.65, 9.4),
    new THREE.Vector3(13.6, 1.6, 7.0),
    new THREE.Vector3(13.6, 1.55, 3.0),
    new THREE.Vector3(13.6, 1.5, 0.5),
    new THREE.Vector3(15.8, 1.6, -6.5),
    new THREE.Vector3(12.85, 1.58, -11.55), // 15: ATS-01 / AG-Pano / BYPASS & Trafo giriş bakışı
    new THREE.Vector3(9.2, 1.75, -4.2),   // 16: Feed-A/B & Sunucu Salonu kapısına dönüş
    new THREE.Vector3(5.8, 1.7, -3.9),    // 17: Sunucu Salonuna bakış
    new THREE.Vector3(8.15, 1.55, -0.1),
    new THREE.Vector3(8.15, 1.55, -0.1),
    new THREE.Vector3(8.15, 1.55, 1.0),
    new THREE.Vector3(8.15, 1.55, 2.1),
    new THREE.Vector3(6.8, 1.55, -10.8),
    new THREE.Vector3(7.25, 1.48, -11.75), // MMR-ODF-01 & Novec 1230 yakın bakış
    new THREE.Vector3(-0.4, 1.5, -7.9),
    new THREE.Vector3(-3.8, 1.5, -7.9),
    new THREE.Vector3(-4.2, 1.6, -11.8),  // 26: CRAH-01 & Soğutma kapısı
    new THREE.Vector3(-10.6, 1.45, -9.5), // 27: Soğutma Odası pompaları & PHE-01
    new THREE.Vector3(-11.8, 1.35, -10.6), // 28: VFD Pompalar & Buffer Tank
    new THREE.Vector3(-15.4, 1.42, -6.3), // 29: Novec 1230 tüpleri & mobil söndürme arabası
    new THREE.Vector3(-12.3, 1.38, -5.65), // 30: VFD Pompa Sürücü & Glikol Dozaj
    new THREE.Vector3(-7.18, 1.95, -6.95), // 31: Soğutma SCADA & açık çıkış kapısı
    new THREE.Vector3(-5.5, 1.72, -8.1),  // 32: Kapıdan Sunucu Salonu batı koridoruna çıkış
    new THREE.Vector3(-5.4, 1.68, -1.5),  // 33: Batı koridorundan güneye (NOC yönüne) bakış
    new THREE.Vector3(-9.5, 1.75, 3.1),   // 34: NOC kapı merkezi -> Video Wall
    new THREE.Vector3(-16.0, 1.8, -1.2),  // 35: Video Wall & operatör konsolları genel bakış
    new THREE.Vector3(-15.8, 1.75, -1.8), // 36: Video Wall önünden kuzey yönüne yumuşak bakış
    new THREE.Vector3(-14.0, 1.45, -3.9), // 37: Masalar üzerinden kuzeydeki A3 lazer yazıcıya bakış
    new THREE.Vector3(-8.35, 1.45, -4.35), // 38: NOC-IDF-01 ağ kabinetine tam karşıdan bakış
    new THREE.Vector3(-6.8, 1.6, 0.2),    // 39: Panoramik cam üzerinden Sunucu Salonu & Doğu masalara bakış
    new THREE.Vector3(-12.0, 1.75, 6.2),  // 42: NOC -> Lobi çıkış cam kapısı & turnike şeridi
    new THREE.Vector3(-12.01, 1.8, 10.5), // 43: Turnike şeridinden Lobiye yumuşak çıkış
    new THREE.Vector3(-11.5, 1.85, 15.5), // 44: Lobi -> Ana çıkış kapısı
    new THREE.Vector3(-11.5, 2.05, 19.5), // 43: Saçak altından dışarı çıkış
    new THREE.Vector3(-16.8, 2.35, 19.5), // 44: Meydan ve Nizamiye yönüne yumuşak sağa pan
    new THREE.Vector3(-21.2, 3.4, 13.2),  // 45: Batı kampüs ağaçları & köşe yönüne kademeli dönüş
    new THREE.Vector3(-15.0, 4.0, 2.0),   // 46: Batı cephesi & çatı hattına yumuşak yöneliş
    new THREE.Vector3(-5.0, 2.6, -9.5),   // 47: Kuzeye Chiller sahasına bakış
    new THREE.Vector3(-3.5, 1.5, -14.5),  // 48: Chiller Sahası & ISP Menholleri
    new THREE.Vector3(17.5, 2.2, -10.5),  // 49: Pilon üstünden Trafo & OG Portal sahasına bakış
    new THREE.Vector3(20.5, 2.0, -4.5),   // 50: Jeneratör & Trafo Sahası geniş kadraj
    new THREE.Vector3(4.0, 2.0, 3.0),     // 51: Güneydoğudan ön cephe & kampüs bütününe bakış
    new THREE.Vector3(0.0, 1.5, 0.0),     // 52: Final Kampüs Kuşbakışı
  ],
  false,
  'centripetal',
  0.5
);

export const CAMERA_PRESETS = {
  campus: {
    pos: new THREE.Vector3(-28, 20, 34),
    target: new THREE.Vector3(0, 1.5, 0),
    walkPos: new THREE.Vector3(-11.5, 1.75, 19.5),
    walkYaw: 0,
  },
  chiller: {
    pos: new THREE.Vector3(-16.5, 8.2, -23.0),
    target: new THREE.Vector3(-4.0, 1.4, -15.5),
    walkPos: new THREE.Vector3(-8.5, 1.75, -22.0),
    walkYaw: Math.PI,
  },
  generator: {
    pos: new THREE.Vector3(29.2, 9.8, -20.2),
    target: new THREE.Vector3(17.5, 2.0, -7.8),
    walkPos: new THREE.Vector3(27.5, 1.75, -10.5),
    walkYaw: Math.PI / 2,
  },
  lobby: {
    pos: new THREE.Vector3(-15.5, 3.2, 11.8),
    target: new THREE.Vector3(-9.5, 1.6, 7.0),
    walkPos: new THREE.Vector3(-11.5, 1.88, 10.6),
    walkYaw: 0.25,
  },
  staging: {
    pos: new THREE.Vector3(7.8, 4.2, 7.8),
    target: new THREE.Vector3(-0.8, 1.3, 10.0),
    walkPos: new THREE.Vector3(1.2, 1.88, 8.6),
    walkYaw: Math.PI * 0.78,
  },
  noc: {
    pos: new THREE.Vector3(-13.8, 3.1, 3.2),
    target: new THREE.Vector3(-7.0, 1.8, -1.2),
    walkPos: new THREE.Vector3(-10.2, 1.88, 1.2),
    walkYaw: -Math.PI / 2, // Facing East through panoramic glass into Server Hall
  },
  server: {
    pos: new THREE.Vector3(-5.8, 2.7, -0.9),
    target: new THREE.Vector3(2.5, 1.6, -0.9),
    walkPos: new THREE.Vector3(-5.2, 1.88, -0.9),
    walkYaw: -Math.PI / 2, // Looking straight down Cold Aisle B
  },
  power: {
    pos: new THREE.Vector3(11.5, 3.4, 2.2),
    target: new THREE.Vector3(16.2, 1.6, -5.5),
    walkPos: new THREE.Vector3(12.6, 1.88, 0.5),
    walkYaw: -0.45,
  },
  mech: {
    pos: new THREE.Vector3(-16.2, 3.2, -6.2),
    target: new THREE.Vector3(-11.0, 1.4, -9.8),
    walkPos: new THREE.Vector3(-12.5, 1.88, -6.8),
    walkYaw: 0,
  },
  blueprint: {
    pos: new THREE.Vector3(0, 42, 6),
    target: new THREE.Vector3(0, 0, 0),
    walkPos: new THREE.Vector3(-11.5, 1.88, 10.0),
    walkYaw: 0,
  },
};

export function createNavigationController({
  camera,
  domElement,
  colliders,
  doors,
  gates = [],
  inspectables,
  isSoftwareGl,
  onInspect,
  onModeChange,
  onTourProgress,
}) {
  const orbit = new OrbitControls(camera, domElement);
  orbit.enableDamping = !isSoftwareGl;
  orbit.dampingFactor = 0.07;
  orbit.maxPolarAngle = Math.PI / 2 - 0.02;
  orbit.minDistance = 2.0;
  orbit.maxDistance = 95.0;
  orbit.target.copy(CAMERA_PRESETS.campus.target);

  let mode = 'orbit'; // 'tour' | 'orbit' | 'walk'
  let flight = null; // { pos: Vector3, target: Vector3 }
  let tourProgress = 0;
  let tourTarget = 0;
  let lastTouchY = null;

  // Walk state
  let yaw = 0; // 0 looks toward -Z
  let pitch = -0.04;
  const keys = Object.create(null);
  const touchMove = { forward: false, back: false, left: false, right: false };
  let isDraggingLook = false;
  let pointerDownPos = { x: 0, y: 0 };
  let lastPointer = { x: 0, y: 0 };

  const raycaster = new THREE.Raycaster();

  orbit.addEventListener('start', () => {
    flight = null; // Cancel scripted flight immediately on user input
  });

  function applyTourPose(t) {
    tourPosCurve.getPoint(t, _tourPos);
    tourLookCurve.getPoint(t, _tourLook);
    camera.position.copy(_tourPos);
    camera.lookAt(_tourLook);
    onTourProgress?.(t);
  }

  function setMode(nextMode, { reset = false } = {}) {
    if (mode === nextMode && !reset) return;
    const prevMode = mode;
    mode = nextMode;
    flight = null;

    if (mode === 'walk') {
      orbit.enabled = false;
      const onGroundLevel =
        camera.position.x > -42 &&
        camera.position.x < 42 &&
        camera.position.z > -42 &&
        camera.position.z < 42 &&
        camera.position.y < 5.5;
      if (!onGroundLevel) {
        const fallback = prevMode === 'tour' && tourProgress < 0.35
          ? CAMERA_PRESETS.campus.walkPos
          : CAMERA_PRESETS.lobby.walkPos;
        camera.position.copy(fallback);
        yaw = 0;
        pitch = -0.02;
      } else {
        const isInside =
          camera.position.x >= -18.2 &&
          camera.position.x <= 18.2 &&
          camera.position.z >= -13.2 &&
          camera.position.z <= 13.2;
        camera.position.y = isInside ? 1.88 : 1.72;
        camera.getWorldDirection(_lookDir);
        yaw = Math.atan2(-_lookDir.x, -_lookDir.z);
        pitch = THREE.MathUtils.clamp(Math.asin(THREE.MathUtils.clamp(_lookDir.y, -0.9, 0.9)), -1.1, 1.1);
      }
      applyWalkRotation();
    } else if (mode === 'tour') {
      if (document.pointerLockElement === domElement) {
        document.exitPointerLock?.();
      }
      orbit.enabled = false;
      if (reset) {
        tourProgress = 0;
        tourTarget = 0;
      }
      applyTourPose(tourProgress);
    } else {
      if (document.pointerLockElement === domElement) {
        document.exitPointerLock?.();
      }
      orbit.enabled = true;
      if (prevMode === 'tour') {
        tourLookCurve.getPoint(tourProgress, _tourLook);
        orbit.target.copy(_tourLook);
      } else {
        camera.getWorldDirection(_lookDir);
        orbit.target.copy(camera.position).addScaledVector(_lookDir, 6);
        orbit.target.y = Math.max(0.5, orbit.target.y);
      }
    }

    onModeChange?.(mode);
  }

  function applyWalkRotation() {
    camera.rotation.order = 'YXZ';
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
    camera.rotation.z = 0;
  }

  function flyToPreset(presetKey) {
    const preset = CAMERA_PRESETS[presetKey];
    if (!preset) return;

    if (mode === 'tour') {
      setMode('orbit');
    }

    if (mode === 'walk') {
      camera.position.copy(preset.walkPos);
      yaw = preset.walkYaw;
      pitch = -0.03;
      applyWalkRotation();
      return;
    }

    flight = {
      pos: preset.pos.clone(),
      target: preset.target.clone(),
    };
  }

  function teleportToPoint(x, z) {
    if (mode === 'tour') {
      setMode('orbit');
    }
    const isInside = x >= -18 && x <= 18 && z >= -13 && z <= 13;
    const eyeY = isInside ? 1.88 : 1.72;
    if (mode === 'walk') {
      camera.position.set(x, eyeY, z);
      applyWalkRotation();
    } else {
      flight = {
        pos: new THREE.Vector3(x - 3.5, isInside ? 3.2 : 12, z + 4.5),
        target: new THREE.Vector3(x, 1.4, z),
      };
    }
  }

  // Collision check for walk mode
  function collidesAt(nx, nz, radius = 0.36) {
    if (nx < -46 || nx > 48 || nz < -46 || nz > 46) return true;
    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      if (c.gateRef && c.gateRef.openAmount >= 0.65) continue;
      if (
        nx + radius > c.minX &&
        nx - radius < c.maxX &&
        nz + radius > c.minZ &&
        nz - radius < c.maxZ
      ) {
        return true;
      }
    }
    return false;
  }

  function setTourProgress(t, { immediate = false } = {}) {
    const clamped = THREE.MathUtils.clamp(t, 0, 1);
    tourTarget = clamped;
    if (immediate) {
      tourProgress = clamped;
      if (mode === 'tour') applyTourPose(tourProgress);
    }
  }

  function stepTour(dir) {
    const eps = 0.03;
    if (dir > 0) {
      const nextStop = TOUR_STAGE_STOPS.find((s) => s > tourTarget + eps);
      tourTarget = nextStop !== undefined ? nextStop : 1.0;
    } else {
      const rev = [...TOUR_STAGE_STOPS].reverse();
      const prevStop = rev.find((s) => s < tourTarget - eps);
      tourTarget = prevStop !== undefined ? prevStop : 0.0;
    }
  }

  // Input listeners
  const onKeyDown = (e) => {
    keys[e.code] = true;
    if (
      mode === 'tour' &&
      (e.code === 'ArrowDown' || e.code === 'ArrowUp' || e.code === 'PageDown' || e.code === 'PageUp')
    ) {
      e.preventDefault();
    }
  };
  const onKeyUp = (e) => {
    keys[e.code] = false;
  };

  const onWheel = (e) => {
    if (mode !== 'tour') return;
    e.preventDefault();
    const delta = THREE.MathUtils.clamp(e.deltaY, -140, 140);
    tourTarget = THREE.MathUtils.clamp(tourTarget + delta * 0.00024, 0, 1);
  };

  const onTouchStart = (e) => {
    if (mode !== 'tour' || e.touches.length !== 1) return;
    lastTouchY = e.touches[0].clientY;
  };

  const onTouchMove = (e) => {
    if (mode !== 'tour' || e.touches.length !== 1 || lastTouchY === null) return;
    e.preventDefault();
    const curY = e.touches[0].clientY;
    const dy = lastTouchY - curY;
    lastTouchY = curY;
    tourTarget = THREE.MathUtils.clamp(tourTarget + dy * 0.00095, 0, 1);
  };

  const onTouchEnd = () => {
    lastTouchY = null;
  };

  const onPointerDown = (e) => {
    pointerDownPos = { x: e.clientX, y: e.clientY };
    if (mode === 'walk' && e.button === 0) {
      isDraggingLook = true;
      lastPointer = { x: e.clientX, y: e.clientY };
    }
  };

  const onPointerMove = (e) => {
    if (mode !== 'walk') return;
    if (document.pointerLockElement === domElement) {
      yaw -= e.movementX * 0.0022;
      pitch = THREE.MathUtils.clamp(pitch - e.movementY * 0.0022, -1.15, 1.15);
      applyWalkRotation();
    } else if (isDraggingLook) {
      const dx = e.clientX - lastPointer.x;
      const dy = e.clientY - lastPointer.y;
      lastPointer = { x: e.clientX, y: e.clientY };
      yaw -= dx * 0.0042;
      pitch = THREE.MathUtils.clamp(pitch - dy * 0.0042, -1.15, 1.15);
      applyWalkRotation();
    }
  };

  const onPointerUp = (e) => {
    isDraggingLook = false;
    const moved = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
    if (moved < 6 && e.button === 0) {
      // Perform inspection raycast
      const rect = domElement.getBoundingClientRect();
      if (document.pointerLockElement === domElement) {
        _rayMouse.set(0, 0);
      } else {
        _rayMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        _rayMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      }
      raycaster.setFromCamera(_rayMouse, camera);
      const hits = raycaster.intersectObjects(inspectables, false);
      const visibleHit = hits.find((h) => {
        let obj = h.object;
        while (obj) {
          if (!obj.visible) return false;
          obj = obj.parent;
        }
        return true;
      });
      if (visibleHit) {
        const hitObj = visibleHit.object;
        if (hitObj.userData?.gateToggle) {
          const gate = hitObj.userData.gateToggle;
          gate.manualOpen = !gate.manualOpen;
          if (gate.pairedGate) {
            gate.pairedGate.manualOpen = gate.manualOpen;
          }
        }
        if (hitObj.userData?.inspect) {
          onInspect?.(hitObj.userData.inspect);
        }
      }
    }
  };

  const onDoubleClick = () => {
    if (mode === 'walk' && document.pointerLockElement !== domElement) {
      domElement.requestPointerLock?.();
    }
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  domElement.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  domElement.addEventListener('dblclick', onDoubleClick);
  domElement.addEventListener('wheel', onWheel, { passive: false });
  domElement.addEventListener('touchstart', onTouchStart, { passive: true });
  domElement.addEventListener('touchmove', onTouchMove, { passive: false });
  domElement.addEventListener('touchend', onTouchEnd, { passive: true });

  function setTouchDirection(dir, active) {
    touchMove[dir] = active;
  }

  function update(dt) {
    const clampedDt = Math.min(dt, 0.05);

    // 1. Update Automatic Sliding Doors based on camera proximity
    for (let i = 0; i < doors.length; i++) {
      const door = doors[i];
      const distSq =
        (camera.position.x - door.x) * (camera.position.x - door.x) +
        (camera.position.z - door.z) * (camera.position.z - door.z);
      const targetOpen = distSq < 13.5 && camera.position.y < 6.0 ? 1 : 0;
      door.openAmount = THREE.MathUtils.damp(door.openAmount, targetOpen, 8, clampedDt);
      if (door.onUpdate) {
        door.onUpdate(door.openAmount);
      } else {
        const offset = THREE.MathUtils.lerp(door.closedOffset, door.openOffset, door.openAmount);
        if (door.axis === 'x') {
          door.leafA.position.x = -offset;
          door.leafB.position.x = offset;
        } else {
          door.leafA.position.z = -offset;
          door.leafB.position.z = offset;
        }
      }
    }

    // 1b. Update Animated Campus Gates & Boom Barrier (proximity or manual click)
    for (let i = 0; i < gates.length; i++) {
      const gate = gates[i];
      const dx = camera.position.x - gate.x;
      const dz = camera.position.z - gate.z;
      const distSq = dx * dx + dz * dz;
      const nearGround = distSq < gate.triggerDistSq && camera.position.y < 8.5;
      const targetOpen = gate.manualOpen || nearGround ? 1 : 0;
      gate.openAmount = THREE.MathUtils.damp(gate.openAmount, targetOpen, 5.2, clampedDt);

      if (gate.type === 'slidingDouble') {
        const offset = THREE.MathUtils.lerp(gate.closedOffset, gate.openOffset, gate.openAmount);
        gate.leafA.position.x = -offset;
        gate.leafB.position.x = offset;
      } else if (gate.type === 'slidingSingle') {
        gate.target.position.x = THREE.MathUtils.lerp(gate.closedPos, gate.openPos, gate.openAmount);
      } else if (gate.type === 'boomBarrier') {
        gate.armPivot.rotation.z = THREE.MathUtils.lerp(gate.closedAngle, gate.openAngle, gate.openAmount);
      }

      if (gate.statusMat) {
        const isOpen = gate.openAmount > 0.35;
        const hex = isOpen ? 0x22c55e : gate.type === 'boomBarrier' ? 0xef4444 : 0xf59e0b;
        gate.statusMat.color.setHex(hex);
        gate.statusMat.emissive.setHex(hex);
      }
    }

    // 2. Camera movement
    if (mode === 'tour') {
      const keyStep =
        (keys.ArrowDown || keys.PageDown || keys.ArrowRight ? 1 : 0) -
        (keys.ArrowUp || keys.PageUp || keys.ArrowLeft ? 1 : 0);
      if (keyStep !== 0) {
        tourTarget = THREE.MathUtils.clamp(tourTarget + keyStep * clampedDt * 0.09, 0, 1);
      }
      tourProgress = THREE.MathUtils.damp(tourProgress, tourTarget, isSoftwareGl ? 14 : 6.0, clampedDt);
      applyTourPose(tourProgress);
      camera.getWorldDirection(_lookDir);
      return Math.atan2(-_lookDir.x, -_lookDir.z);
    }

    if (mode === 'orbit') {
      if (flight) {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, flight.pos.x, 5.5, clampedDt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, flight.pos.y, 5.5, clampedDt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, flight.pos.z, 5.5, clampedDt);
        orbit.target.x = THREE.MathUtils.damp(orbit.target.x, flight.target.x, 5.5, clampedDt);
        orbit.target.y = THREE.MathUtils.damp(orbit.target.y, flight.target.y, 5.5, clampedDt);
        orbit.target.z = THREE.MathUtils.damp(orbit.target.z, flight.target.z, 5.5, clampedDt);

        if (
          camera.position.distanceToSquared(flight.pos) < 0.01 &&
          orbit.target.distanceToSquared(flight.target) < 0.01
        ) {
          flight = null;
        }
      }
      orbit.update();
      camera.getWorldDirection(_lookDir);
      return Math.atan2(-_lookDir.x, -_lookDir.z);
    }

    // Walk mode movement
    const forwardInput =
      (keys.KeyW || keys.ArrowUp || touchMove.forward ? 1 : 0) -
      (keys.KeyS || keys.ArrowDown || touchMove.back ? 1 : 0);
    const strafeInput =
      (keys.KeyD || keys.ArrowRight || touchMove.right ? 1 : 0) -
      (keys.KeyA || keys.ArrowLeft || touchMove.left ? 1 : 0);

    if (forwardInput !== 0 || strafeInput !== 0) {
      const speed = keys.ShiftLeft || keys.ShiftRight ? 7.8 : 4.2;
      _forward.set(-Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
      _right.set(Math.cos(yaw), 0, -Math.sin(yaw)).normalize();

      _move.set(0, 0, 0);
      _move.addScaledVector(_forward, forwardInput);
      _move.addScaledVector(_right, strafeInput);
      if (_move.lengthSq() > 0) _move.normalize();

      const stepX = _move.x * speed * clampedDt;
      const stepZ = _move.z * speed * clampedDt;

      // Axis-separated collision sliding
      if (!collidesAt(camera.position.x + stepX, camera.position.z)) {
        camera.position.x += stepX;
      }
      if (!collidesAt(camera.position.x, camera.position.z + stepZ)) {
        camera.position.z += stepZ;
      }
    }

    // Smooth plinth eye height transition between outside and inside
    const insideBuilding =
      camera.position.x >= -18.2 &&
      camera.position.x <= 18.2 &&
      camera.position.z >= -13.2 &&
      camera.position.z <= 13.2;
    const targetEyeY = insideBuilding ? 1.88 : 1.72;
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetEyeY, 10, clampedDt);

    return yaw;
  }

  function dispose() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    domElement.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    domElement.removeEventListener('dblclick', onDoubleClick);
    domElement.removeEventListener('wheel', onWheel);
    domElement.removeEventListener('touchstart', onTouchStart);
    domElement.removeEventListener('touchmove', onTouchMove);
    domElement.removeEventListener('touchend', onTouchEnd);
    orbit.dispose();
  }

  return {
    getMode: () => mode,
    setMode,
    flyToPreset,
    teleportToPoint,
    setTouchDirection,
    setTourProgress,
    getTourProgress: () => tourProgress,
    stepTour,
    nudgeTour(deltaY) {
      if (mode !== 'tour') return;
      const delta = THREE.MathUtils.clamp(deltaY, -140, 140);
      tourTarget = THREE.MathUtils.clamp(tourTarget + delta * 0.00024, 0, 1);
    },
    update,
    dispose,
  };
}
