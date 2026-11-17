import * as THREE from 'three';
import {
  createRaisedFloorTexture,
  createPerforatedTileTexture,
  createConcreteFacadeTexture,
  createAsphaltTexture,
  createGrassTexture,
  createUpsPanelTexture,
  createNocFloorTexture,
} from './textures.js';

export function createMaterials(isSoftwareGl = false) {
  const raisedFloorTex = createRaisedFloorTexture();
  const perforatedTex = createPerforatedTileTexture();
  const concreteTex = createConcreteFacadeTexture();
  const asphaltTex = createAsphaltTexture();
  const grassTex = createGrassTexture();
  const upsTex = createUpsPanelTexture('UPS · N+1');
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

    // Glass (software-safe transparency fallback)
    archGlass: isSoftwareGl
      ? new THREE.MeshStandardMaterial({
          color: 0x93c5fd,
          roughness: 0.1,
          metalness: 0.25,
          transparent: true,
          opacity: 0.35,
          depthWrite: false,
        })
      : new THREE.MeshPhysicalMaterial({
          color: 0xbae6fd,
          roughness: 0.06,
          metalness: 0.05,
          transmission: 0.78,
          transparent: true,
          opacity: 1,
          ior: 1.5,
          thickness: 0.18,
          depthWrite: false,
        }),

    containmentGlass: new THREE.MeshStandardMaterial({
      color: 0x7dd3fc,
      roughness: 0.12,
      metalness: 0.15,
      transparent: true,
      opacity: 0.32,
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
    upsCabinet: new THREE.MeshStandardMaterial({
      map: upsTex,
      roughness: 0.4,
      metalness: 0.55,
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
  };

  return materials;
}
