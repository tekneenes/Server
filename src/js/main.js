import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { setMaxAnisotropy } from './textures.js';
import { createMaterials } from './materials.js';
import { buildExteriorCity } from './exterior.js';
import { buildDataCenter } from './building.js';
import { createNavigationController } from './controls.js';
import { createBlueprintController, getZoneNameAt } from './blueprint.js';

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
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.setSize(mount.clientWidth || window.innerWidth, mount.clientHeight || window.innerHeight);
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
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
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
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

  // Interior Architectural Lighting (non-shadow-casting for smooth 60fps)
  const interiorLights = [
    { color: 0xf8fafc, intensity: 22, dist: 16, pos: [-11.5, 4.2, 9.0] }, // Lobby
    { color: 0xbae6fd, intensity: 18, dist: 15, pos: [-12.2, 4.2, 0.0] }, // NOC
    { color: 0xe0f2fe, intensity: 24, dist: 18, pos: [0.5, 4.2, -7.9] }, // Cold Aisle A
    { color: 0xe0f2fe, intensity: 24, dist: 18, pos: [0.5, 4.2, -0.9] }, // Cold Aisle B
    { color: 0xf1f5f9, intensity: 18, dist: 16, pos: [6.0, 4.2, -4.0] }, // Server East
    { color: 0xfef3c7, intensity: 18, dist: 16, pos: [13.5, 4.2, -4.0] }, // Power North
    { color: 0xfef3c7, intensity: 16, dist: 16, pos: [13.5, 4.2, 6.0] }, // Power South
    { color: 0xe2e8f0, intensity: 16, dist: 14, pos: [-12.5, 4.2, -9.0] }, // Mechanical
  ];
  interiorLights.forEach((cfg) => {
    const pl = new THREE.PointLight(cfg.color, cfg.intensity, cfg.dist, 1.8);
    pl.position.set(...cfg.pos);
    scene.add(pl);
  });

  // Build World & Data Center
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
  const { roofGroup, nocWallManager, updateLeds } = buildDataCenter(
    scene,
    materials,
    colliders,
    inspectables,
    doors
  );

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  // DOM HUD References
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

  const btnModeOrbit = document.getElementById('btn-mode-orbit');
  const btnModeWalk = document.getElementById('btn-mode-walk');
  const presetBtns = Array.from(document.querySelectorAll('.preset-btn'));
  const btnToggleRoof = document.getElementById('btn-toggle-roof');
  const btnToggleBlueprint = document.getElementById('btn-toggle-blueprint');
  const btnCollapseDock = document.getElementById('btn-collapse-dock');
  const dockWrapper = document.getElementById('dock-wrapper');
  const btnToggleKroki = document.getElementById('btn-toggle-kroki');
  const krokiBody = document.getElementById('kroki-body');
  const krokiCanvas = document.getElementById('kroki-canvas');

  let roofRemoved = false;
  let blueprintViewActive = false;

  function setRoofRemoved(removed) {
    roofRemoved = removed;
    roofGroup.visible = !roofRemoved;
    btnToggleRoof.setAttribute('aria-pressed', String(roofRemoved));
  }

  function showInspector(info) {
    inspectorCatEl.textContent = info.category;
    inspectorNameEl.textContent = info.name;
    inspectorSpecsEl.textContent = info.specs;
    inspectorBarEl.hidden = false;
  }

  btnCloseInspector.addEventListener('click', () => {
    inspectorBarEl.hidden = true;
  });

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
    onModeChange: (nextMode) => {
      const isWalk = nextMode === 'walk';
      btnModeOrbit.classList.toggle('active', !isWalk);
      btnModeWalk.classList.toggle('active', isWalk);
      modeReadoutEl.textContent = isWalk ? 'Yürüyüş Modu (FPS)' : 'Serbest İnceleme';
      walkReticleEl.hidden = !isWalk;
      walkHintEl.hidden = !isWalk;
      touchDpadEl.hidden = !isWalk;
      if (isWalk && roofRemoved) {
        setRoofRemoved(false);
      }
      if (isWalk) {
        blueprintViewActive = false;
        btnToggleBlueprint.setAttribute('aria-pressed', 'false');
      }
    },
  });

  // Interactive 2D Kroki Controller
  const blueprint = createBlueprintController(krokiCanvas, (wx, wz, roomId) => {
    nav.teleportToPoint(wx, wz);
    if (nav.getMode() === 'orbit' && roomId !== 'campus' && !roofRemoved) {
      setRoofRemoved(true);
    }
    presetBtns.forEach((b) => b.classList.toggle('active', b.dataset.preset === roomId));
  });

  // UI Event Handlers
  btnModeOrbit.addEventListener('click', () => nav.setMode('orbit'));
  btnModeWalk.addEventListener('click', () => nav.setMode('walk'));

  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.preset;
      presetBtns.forEach((b) => b.classList.toggle('active', b === btn));
      blueprintViewActive = false;
      btnToggleBlueprint.setAttribute('aria-pressed', 'false');

      // When inspecting interior rooms in Orbit mode, auto-lift roof for clear cutaway view
      if (nav.getMode() === 'orbit') {
        setRoofRemoved(key !== 'campus');
      }
      nav.flyToPreset(key);
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

  // Keyboard shortcuts (R: Roof Cutaway, K: Top-down Kroki, H: Hide Dock, M: Minimap)
  window.addEventListener('keydown', (e) => {
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
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  };
  window.addEventListener('resize', onResize);

  // Frame Loop with Software-WebGL afterDraw Pacing
  const clock = new THREE.Clock();
  let frameId = 0;
  let nocRedrawAccum = 0;
  let lastZoneText = '';

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

    // Spin exterior chiller condenser fans smoothly
    const fanSpin = dt * 6.5;
    for (let i = 0; i < animatedFans.length; i++) {
      animatedFans[i].rotation.y += fanSpin;
    }

    // Blink switch ports & server activity LEDs
    updateLeds(elapsed);

    // Refresh NOC video wall telemetry twice per second
    nocRedrawAccum += dt;
    if (nocRedrawAccum >= 0.5) {
      nocRedrawAccum = 0;
      nocWallManager.update(elapsed);
    }

    // Update live zone indicator & 2D Kroki minimap
    const currentZone = getZoneNameAt(camera.position.x, camera.position.z);
    if (currentZone !== lastZoneText) {
      lastZoneText = currentZone;
      zoneLabelEl.textContent = currentZone;
    }
    if (!krokiBody.classList.contains('collapsed')) {
      blueprint.render(camera.position.x, camera.position.z, yawRad);
    }

    renderer.render(scene, camera);

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }
  }

  tick();

  window.addEventListener('beforeunload', () => {
    cancelAnimationFrame(frameId);
    clearTimeout(frameId);
    nav.dispose();
    exterior?.dispose?.();
    renderer.dispose();
  });
}

init();
