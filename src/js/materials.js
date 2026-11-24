import * as THREE from 'three';
import {
  createRaisedFloorTexture,
  createPerforatedTileTexture,
  createConcreteFacadeTexture,
  createAsphaltTexture,
  createGrassTexture,
  createNocFloorTexture,
} from './textures.js';

export function createMaterials(isSoftwareGl = false) {
  const raisedFloorTex = createRaisedFloorTexture();
  const perforatedTex = createPerforatedTileTexture();
  const concreteTex = createConcreteFacadeTexture();
  const asphaltTex = createAsphaltTexture();
  const grassTex = createGrassTexture();
  const nocFloorTex = createNocFloorTexture();

  const materials = {
    // Exterior surfaces
    grass: new THREE.MeshStandardMaterial({
      map: grassTex,
      roughness: 0.92,
      metalness: 0.0,
    }),
    asphalt: new THREE.MeshStandardMaterial({
      map: asphaltTex,
      roughness: 0.85,
      metalness: 0.05,
    }),
    sidewalk: new THREE.MeshStandardMaterial({
      color: 0x9aa3ad,
      roughness: 0.88,
      metalness: 0.04,
    }),
    plazaTile: new THREE.MeshStandardMaterial({
      color: 0xb6c0ca,
      roughness: 0.72,
      metalness: 0.08,
    }),
    roadLine: new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.6,
      metalness: 0.05,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
    yellowLine: new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.55,
      metalness: 0.08,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),

    // Building shell & interiors
    concreteExt: new THREE.MeshStandardMaterial({
      map: concreteTex,
      color: 0xdbe2ea,
      roughness: 0.82,
      metalness: 0.06,
    }),
    aluCladding: new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.34,
      metalness: 0.78,
    }),
    darkSteelTrim: new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.38,
      metalness: 0.82,
    }),
    interiorWall: new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.78,
      metalness: 0.04,
    }),
    interiorWallAccent: new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.62,
      metalness: 0.18,
    }),
    lobbyFloor: new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      roughness: 0.35,
      metalness: 0.12,
    }),
    raisedFloor: new THREE.MeshStandardMaterial({
      map: raisedFloorTex,
      roughness: 0.48,
      metalness: 0.15,
    }),
    perforatedFloor: new THREE.MeshStandardMaterial({
      map: perforatedTex,
      roughness: 0.45,
      metalness: 0.42,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
    mechFloor: new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.65,
      metalness: 0.12,
    }),
    nocFloor: new THREE.MeshStandardMaterial({
      map: nocFloorTex,
      roughness: 0.72,
      metalness: 0.08,
    }),

    // Crystal-clear architectural observation & curtain-wall glass (no blurry transmission pass)
    archGlass: isSoftwareGl
      ? new THREE.MeshStandardMaterial({
        color: 0xdbeafe,
        roughness: 0.08,
        metalness: 0.15,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      })
      : new THREE.MeshPhysicalMaterial({
        color: 0xdbeafe,
        roughness: 0.04,
        metalness: 0.06,
        reflectivity: 0.5,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        transparent: true,
        opacity: 0.14,
        depthWrite: false,
      }),

    containmentGlass: new THREE.MeshStandardMaterial({
      color: 0xa5f3fc,
      roughness: 0.06,
      metalness: 0.12,
      transparent: true,
      opacity: 0.16,
      depthWrite: false,
    }),

    // Equipment metals
    rackBody: new THREE.MeshStandardMaterial({
      color: 0x161d26,
      roughness: 0.44,
      metalness: 0.72,
    }),
    rackTrim: new THREE.MeshStandardMaterial({
      color: 0x3b4859,
      roughness: 0.3,
      metalness: 0.85,
    }),
    chrome: new THREE.MeshStandardMaterial({
      color: 0xdbe4ee,
      roughness: 0.16,
      metalness: 0.94,
    }),
    copperBus: new THREE.MeshStandardMaterial({
      color: 0xc87533,
      roughness: 0.26,
      metalness: 0.9,
    }),
    fiberTray: new THREE.MeshStandardMaterial({
      color: 0xeab308,
      roughness: 0.42,
      metalness: 0.22,
    }),
    powerTray: new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.38,
      metalness: 0.75,
    }),
    cracBody: new THREE.MeshStandardMaterial({
      color: 0xe5eaf0,
      roughness: 0.42,
      metalness: 0.3,
    }),
    pipeSupply: new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.38,
      metalness: 0.35,
    }),
    pipeReturn: new THREE.MeshStandardMaterial({
      color: 0xdc2626,
      roughness: 0.38,
      metalness: 0.35,
    }),
    generatorYellow: new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.42,
      metalness: 0.45,
    }),
    fireRed: new THREE.MeshStandardMaterial({
      color: 0xb91c1c,
      roughness: 0.32,
      metalness: 0.4,
    }),
    cableCat6Blue: new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      roughness: 0.55,
      metalness: 0.1,
    }),
    cableDataDark: new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.65,
      metalness: 0.12,
    }),

    // Emissive LEDs & Strips
    coldStrip: new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.5,
      roughness: 0.2,
    }),
    warmStrip: new THREE.MeshStandardMaterial({
      color: 0xfef3c7,
      emissive: 0xfde68a,
      emissiveIntensity: 1.1,
      roughness: 0.25,
    }),
    greenLed: new THREE.MeshStandardMaterial({
      color: 0x4ade80,
      emissive: 0x22c55e,
      emissiveIntensity: 1.8,
      roughness: 0.2,
    }),
    invisibleHitMat: new THREE.MeshBasicMaterial({
      visible: false,
    }),
    brassValve: new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.28,
      metalness: 0.88,
    }),
    hvCeramic: new THREE.MeshStandardMaterial({
      color: 0x7c2d12,
      roughness: 0.25,
      metalness: 0.12,
    }),
  };

  return materials;
}

export function createGeoPool() {
  const boxes = new Map();
  const cyls = new Map();
  const planes = new Map();
  const spheres = new Map();
  const cones = new Map();
  const toruses = new Map();

  return {
    box(w = 1, h = 1, d = 1, ws = 1, hs = 1, ds = 1) {
      const k = `${w}|${h}|${d}|${ws}|${hs}|${ds}`;
      let g = boxes.get(k);
      if (!g) {
        g = new THREE.BoxGeometry(w, h, d, ws, hs, ds);
        boxes.set(k, g);
      }
      return g;
    },
    cyl(rt = 1, rb = 1, h = 1, seg = 32, hSeg = 1, open = false, ts = 0, tl = Math.PI * 2) {
      const k = `${rt}|${rb}|${h}|${seg}|${hSeg}|${open ? 1 : 0}|${ts}|${tl}`;
      let g = cyls.get(k);
      if (!g) {
        g = new THREE.CylinderGeometry(rt, rb, h, seg, hSeg, open, ts, tl);
        cyls.set(k, g);
      }
      return g;
    },
    plane(w = 1, h = 1, ws = 1, hs = 1) {
      const k = `${w}|${h}|${ws}|${hs}`;
      let g = planes.get(k);
      if (!g) {
        g = new THREE.PlaneGeometry(w, h, ws, hs);
        planes.set(k, g);
      }
      return g;
    },
    sphere(r = 1, ws = 12, hs = 8, ps = 0, pl = Math.PI * 2, ts = 0, tl = Math.PI) {
      const k = `${r}|${ws}|${hs}|${ps}|${pl}|${ts}|${tl}`;
      let g = spheres.get(k);
      if (!g) {
        g = new THREE.SphereGeometry(r, ws, hs, ps, pl, ts, tl);
        spheres.set(k, g);
      }
      return g;
    },
    cone(r = 1, h = 1, seg = 10) {
      const k = `${r}|${h}|${seg}`;
      let g = cones.get(k);
      if (!g) {
        g = new THREE.ConeGeometry(r, h, seg);
        cones.set(k, g);
      }
      return g;
    },
    torus(r = 1, tube = 0.2, rs = 8, ts = 16, arc = Math.PI * 2) {
      const k = `${r}|${tube}|${rs}|${ts}|${arc}`;
      let g = toruses.get(k);
      if (!g) {
        g = new THREE.TorusGeometry(r, tube, rs, ts, arc);
        toruses.set(k, g);
      }
      return g;
    },
    clear() {
      boxes.clear();
      cyls.clear();
      planes.clear();
      spheres.clear();
      cones.clear();
      toruses.clear();
    },
  };
}

export const sharedGeoPool = createGeoPool();
