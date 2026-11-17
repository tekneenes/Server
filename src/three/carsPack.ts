/**
 * Atelier Otomotiv 3D — Taşınabilir Tek Dosya Araç Tasarım Paketi (carsPack.ts)
 *
 * Bu dosya 3 farklı detaylı 3D otomobil tasarımını (Apex V12 GT, 1967 Monza Spider,
 * Terra-X Overland 4x4), teknik verilerini, boya paletlerini, prosedürel dokularını,
 * PBR materyallerini ve jant/fren sistemlerini tek bir bağımsız modülde toplar.
 *
 * Tek bağımlılığı `three` paketidir. Başka bir projeye yalnızca bu dosyayı kopyalayıp:
 *   const pack = createCarsPack({ anisotropy: 8, isSoftwareGl: false });
 *   const carRig = pack.buildCar('supercar');
 *   scene.add(carRig.root);
 * şeklinde doğrudan kullanabilirsiniz.
 */

import * as THREE from 'three';

// ============================================================================
// 1. TİPLER VE VERİ ŞEMALARI
// ============================================================================

export type CarModelId = 'supercar' | 'classic' | 'offroad';

export interface PaintPreset {
  id: string;
  name: string;
  hex: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
}

export interface CarSpec {
  id: CarModelId;
  code: string;
  name: string;
  category: string;
  year: string;
  engine: string;
  power: string;
  acceleration: string;
  topSpeed: string;
  weight: string;
  defaultPaintId: string;
  summary: string;
}

export interface InspectablePartInfo {
  id: string;
  title: string;
  category: string;
  description: string;
}

export interface BuiltCarRig {
  id: CarModelId;
  spec: CarSpec;
  root: THREE.Group;
  paintMaterials: THREE.MeshPhysicalMaterial[];
  headlightMaterials: THREE.MeshStandardMaterial[];
  taillightMaterials: THREE.MeshStandardMaterial[];
  dashMaterials: THREE.MeshStandardMaterial[];
  headlightSpots: THREE.SpotLight[];
  wheelSpinGroups: THREE.Object3D[];
  explodedTargets: Array<{
    object: THREE.Object3D;
    basePos: THREE.Vector3;
    offset: THREE.Vector3;
  }>;
  inspectableObjects: THREE.Object3D[];
  contactShadow: THREE.Mesh;
  setPaint: (paintIdOrPreset: string | PaintPreset) => void;
  setHeadlights: (on: boolean) => void;
  setExplode: (factor: number) => void;
  spinWheels: (deltaAngle: number) => void;
}

export interface CarsPackOptions {
  anisotropy?: number;
  isSoftwareGl?: boolean;
}

export interface CarsPack {
  specs: Record<CarModelId, CarSpec>;
  order: CarModelId[];
  paints: PaintPreset[];
  buildCar: (id: CarModelId) => BuiltCarRig;
  buildAll: () => Record<CarModelId, BuiltCarRig>;
  dispose: () => void;
}

// ============================================================================
// 2. ARAÇ TEKNİK ÖZELLİKLERİ VE BOYA PALETİ
// ============================================================================

export const CAR_SPECS: Record<CarModelId, CarSpec> = {
  supercar: {
    id: 'supercar',
    code: '01',
    name: 'Apex V12 GT',
    category: 'Orta Motorlu Hiperspor Coupe',
    year: '2026',
    engine: '6.5L Atmosferik V12',
    power: '840 BG',
    acceleration: '2.6 sn',
    topSpeed: '355 km/s',
    weight: '1.290 kg',
    defaultPaintId: 'rossonero',
    summary:
      'Karbon monokok şasi, aktif kuğu boynu arka kanat, şeffaf motor kapağı altında V12 emme manifoldu ve seramik fren diskleri.',
  },
  classic: {
    id: 'classic',
    code: '02',
    name: '1967 Monza Spider',
    category: 'Klasik Grand Tourer Roadster',
    year: '1967',
    engine: '3.3L Çift Eksantrik V12',
    power: '320 BG',
    acceleration: '5.8 sn',
    topSpeed: '268 km/s',
    weight: '1.080 kg',
    defaultPaintId: 'emerald',
    summary:
      'El işçiliği alüminyum gövde hatları, krom tamponlar, tel jantlı beyaz yanak lastikler, ahşap direksiyon ve taba deri açık kokpit.',
  },
  offroad: {
    id: 'offroad',
    code: '03',
    name: 'Terra-X Overland',
    category: 'Ekspedisyon 4x4 Arazi Aracı',
    year: '2026',
    engine: '4.0L Çift Turbo V8',
    power: '610 BG',
    acceleration: '4.4 sn',
    topSpeed: '215 km/s',
    weight: '2.420 kg',
    defaultPaintId: 'sandstorm',
    summary:
      'Çelik vinçli ön koruma demiri, şnorkel hava girişi, tavan LED projektörlü keşif sepeti, kurtarma paletleri ve beadlock arazi jantları.',
  },
};

export const CAR_ORDER: CarModelId[] = ['supercar', 'classic', 'offroad'];

export const PAINT_PRESETS: PaintPreset[] = [
  {
    id: 'rossonero',
    name: 'Rosso Corsa Metalik',
    hex: '#b91c1c',
    metalness: 0.72,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  },
  {
    id: 'emerald',
    name: 'Yarış Zümrüt Yeşili',
    hex: '#0f4c3a',
    metalness: 0.65,
    roughness: 0.22,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
  },
  {
    id: 'sandstorm',
    name: 'Çöl Kum Beji',
    hex: '#b89f78',
    metalness: 0.35,
    roughness: 0.38,
    clearcoat: 0.65,
    clearcoatRoughness: 0.16,
  },
  {
    id: 'sapphire',
    name: 'Safir Gece Mavisi',
    hex: '#1e3a8a',
    metalness: 0.8,
    roughness: 0.18,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  },
  {
    id: 'titanium',
    name: 'Sıvı Titanyum Gümüş',
    hex: '#9ca3af',
    metalness: 0.92,
    roughness: 0.16,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  },
  {
    id: 'stealth',
    name: 'Mat Karbon Antrasit',
    hex: '#272a30',
    metalness: 0.48,
    roughness: 0.56,
    clearcoat: 0.22,
    clearcoatRoughness: 0.35,
  },
  {
    id: 'pearl',
    name: 'Sedefli İnci Beyazı',
    hex: '#e8e6e1',
    metalness: 0.32,
    roughness: 0.2,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
  },
];

// ============================================================================
// 3. PROSEDÜREL DOKU (CANVASTEXTURE) ÜRETİCİLERİ
// ============================================================================

interface CarTextureBundle {
  carbonMap: THREE.CanvasTexture;
  carbonBump: THREE.CanvasTexture;
  tireTreadMap: THREE.CanvasTexture;
  tireTreadBump: THREE.CanvasTexture;
  offroadTreadMap: THREE.CanvasTexture;
  offroadTreadBump: THREE.CanvasTexture;
  brakeDiscMap: THREE.CanvasTexture;
  brakeDiscRoughness: THREE.CanvasTexture;
  contactShadowMap: THREE.CanvasTexture;
  grilleMap: THREE.CanvasTexture;
  dashModernMap: THREE.CanvasTexture;
  dashClassicMap: THREE.CanvasTexture;
  dashOffroadMap: THREE.CanvasTexture;
  dispose: () => void;
}

function configureTex(
  tex: THREE.CanvasTexture,
  anisotropy: number,
  isColor: boolean,
  repeatX = 1,
  repeatY = 1,
): THREE.CanvasTexture {
  tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  tex.anisotropy = anisotropy;
  if (repeatX !== 1 || repeatY !== 1) {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
  }
  tex.needsUpdate = true;
  return tex;
}

function makeCarbonTextures(anisotropy: number) {
  const size = 128;
  const cColor = document.createElement('canvas');
  cColor.width = size;
  cColor.height = size;
  const ctx = cColor.getContext('2d')!;

  const cBump = document.createElement('canvas');
  cBump.width = size;
  cBump.height = size;
  const btx = cBump.getContext('2d')!;

  const step = 16;
  for (let y = 0; y < size; y += step) {
    for (let x = 0; x < size; x += step) {
      const cell = (x / step + y / step) % 2 === 0;
      const g = ctx.createLinearGradient(x, y, x + step, y + step);
      if (cell) {
        g.addColorStop(0, '#14171c');
        g.addColorStop(0.5, '#2b303a');
        g.addColorStop(1, '#121519');
      } else {
        g.addColorStop(0, '#22262e');
        g.addColorStop(0.5, '#0f1115');
        g.addColorStop(1, '#262b34');
      }
      ctx.fillStyle = g;
      ctx.fillRect(x, y, step, step);
      btx.fillStyle = cell ? '#b8b8b8' : '#585858';
      btx.fillRect(x + 1, y + 1, step - 2, step - 2);
    }
  }

  return {
    map: configureTex(new THREE.CanvasTexture(cColor), anisotropy, true, 12, 12),
    bump: configureTex(new THREE.CanvasTexture(cBump), anisotropy, false, 12, 12),
  };
}

function makeTireTreadTextures(anisotropy: number, chunky: boolean) {
  const w = 256;
  const h = 256;
  const cColor = document.createElement('canvas');
  cColor.width = w;
  cColor.height = h;
  const ctx = cColor.getContext('2d')!;

  const cBump = document.createElement('canvas');
  cBump.width = w;
  cBump.height = h;
  const btx = cBump.getContext('2d')!;

  ctx.fillStyle = '#1b1d21';
  ctx.fillRect(0, 0, w, h);
  btx.fillStyle = '#202020';
  btx.fillRect(0, 0, w, h);

  const rows = chunky ? 8 : 14;
  const rowH = h / rows;

  for (let i = 0; i < rows; i++) {
    const y = i * rowH;
    if (chunky) {
      const shift = i % 2 === 0 ? 0 : 28;
      ctx.fillStyle = '#262930';
      btx.fillStyle = '#f0f0f0';
      for (let x = -32; x < w + 32; x += 64) {
        ctx.fillRect(x + shift + 4, y + 4, 46, rowH - 8);
        btx.fillRect(x + shift + 4, y + 4, 46, rowH - 8);
      }
    } else {
      ctx.fillStyle = '#24272d';
      btx.fillStyle = '#d8d8d8';
      ctx.fillRect(8, y + 2, w - 16, rowH - 5);
      btx.fillRect(8, y + 2, w - 16, rowH - 5);

      ctx.strokeStyle = '#121316';
      ctx.lineWidth = 4;
      btx.strokeStyle = '#141414';
      btx.lineWidth = 5;

      ctx.beginPath();
      ctx.moveTo(0, y + rowH * 0.25);
      ctx.lineTo(w * 0.5, y + rowH * 0.8);
      ctx.lineTo(w, y + rowH * 0.25);
      ctx.stroke();

      btx.beginPath();
      btx.moveTo(0, y + rowH * 0.25);
      btx.lineTo(w * 0.5, y + rowH * 0.8);
      btx.lineTo(w, y + rowH * 0.25);
      btx.stroke();
    }
  }

  const ribPositions = chunky ? [w * 0.5] : [w * 0.34, w * 0.66];
  for (const rx of ribPositions) {
    ctx.fillStyle = '#121417';
    ctx.fillRect(rx - 5, 0, 10, h);
    btx.fillStyle = '#101010';
    btx.fillRect(rx - 5, 0, 10, h);
  }

  const repeatY = chunky ? 6 : 10;
  return {
    map: configureTex(new THREE.CanvasTexture(cColor), anisotropy, true, 1, repeatY),
    bump: configureTex(new THREE.CanvasTexture(cBump), anisotropy, false, 1, repeatY),
  };
}

function makeBrakeDiscTextures(anisotropy: number) {
  const size = 256;
  const cColor = document.createElement('canvas');
  cColor.width = size;
  cColor.height = size;
  const ctx = cColor.getContext('2d')!;

  const cRough = document.createElement('canvas');
  cRough.width = size;
  cRough.height = size;
  const rtx = cRough.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;

  ctx.fillStyle = '#8b939e';
  ctx.fillRect(0, 0, size, size);
  rtx.fillStyle = '#555555';
  rtx.fillRect(0, 0, size, size);

  for (let r = 38; r < 124; r += 2.5) {
    ctx.strokeStyle = r % 5 < 2.5 ? 'rgba(220,226,235,0.28)' : 'rgba(60,65,75,0.25)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let a = 0; a < 12; a++) {
    const baseAngle = (a / 12) * Math.PI * 2;
    for (let ring = 0; ring < 3; ring++) {
      const r = 58 + ring * 21;
      const ang = baseAngle + ring * 0.14;
      const hx = cx + Math.cos(ang) * r;
      const hy = cy + Math.sin(ang) * r;

      ctx.fillStyle = '#181a1f';
      ctx.beginPath();
      ctx.arc(hx, hy, 3.3, 0, Math.PI * 2);
      ctx.fill();

      rtx.fillStyle = '#ffffff';
      rtx.beginPath();
      rtx.arc(hx, hy, 3.3, 0, Math.PI * 2);
      rtx.fill();
    }
  }

  ctx.fillStyle = '#252930';
  ctx.beginPath();
  ctx.arc(cx, cy, 42, 0, Math.PI * 2);
  ctx.fill();

  return {
    map: configureTex(new THREE.CanvasTexture(cColor), anisotropy, true),
    roughness: configureTex(new THREE.CanvasTexture(cRough), anisotropy, false),
  };
}

function makeContactShadowTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const c = size / 2;
  const grad = ctx.createRadialGradient(c, c, 12, c, c, size * 0.48);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.92)');
  grad.addColorStop(0.45, 'rgba(0, 0, 0, 0.65)');
  grad.addColorStop(0.78, 'rgba(0, 0, 0, 0.22)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  return configureTex(new THREE.CanvasTexture(canvas), anisotropy, true);
}

function makeGrilleTexture(anisotropy: number): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#090a0d';
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#2d323c';
  ctx.lineWidth = 3;
  const step = 16;
  for (let y = -step; y < size + step; y += step) {
    for (let x = -step; x < size + step; x += step) {
      const ox = ((y / step) % 2) * (step * 0.5);
      ctx.beginPath();
      ctx.moveTo(x + ox, y);
      ctx.lineTo(x + ox + step * 0.5, y + step * 0.5);
      ctx.lineTo(x + ox, y + step);
      ctx.lineTo(x + ox - step * 0.5, y + step * 0.5);
      ctx.closePath();
      ctx.stroke();
    }
  }
  return configureTex(new THREE.CanvasTexture(canvas), anisotropy, true, 8, 4);
}

function makeDashboardTexture(
  anisotropy: number,
  style: 'modern' | 'classic' | 'offroad',
): THREE.CanvasTexture {
  const w = 512;
  const h = 128;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  if (style === 'classic') {
    ctx.fillStyle = '#5a321a';
    ctx.fillRect(0, 0, w, h);
    const positions = [110, 185, 256, 327, 402];
    const radii = [26, 20, 32, 20, 26];
    positions.forEach((px, idx) => {
      const r = radii[idx];
      ctx.fillStyle = '#d4d8df';
      ctx.beginPath();
      ctx.arc(px, 64, r + 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f3ebd9';
      ctx.beginPath();
      ctx.arc(px, 64, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#222';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, 64);
      ctx.lineTo(
        px + Math.cos(-0.6 + idx * 0.3) * (r - 5),
        64 + Math.sin(-0.6 + idx * 0.3) * (r - 5),
      );
      ctx.stroke();
    });
  } else if (style === 'modern') {
    ctx.fillStyle = '#0e1116';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#131c2b';
    ctx.fillRect(88, 22, 160, 84);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(168, 68, 30, Math.PI * 0.8, Math.PI * 2.1);
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('V12', 150, 74);

    ctx.fillStyle = '#101826';
    ctx.fillRect(284, 26, 118, 76);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.strokeRect(284, 26, 118, 76);
  } else {
    ctx.fillStyle = '#1c1f24';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#11161c';
    ctx.fillRect(92, 24, 148, 80);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(134, 64, 22, 0, Math.PI * 2);
    ctx.arc(198, 64, 22, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#12261e';
    ctx.fillRect(272, 20, 140, 88);
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(286, 86);
    ctx.lineTo(318, 56);
    ctx.lineTo(352, 68);
    ctx.lineTo(395, 34);
    ctx.stroke();
  }

  return configureTex(new THREE.CanvasTexture(canvas), anisotropy, true);
}

function createCarTextureBundle(anisotropy: number): CarTextureBundle {
  const carbon = makeCarbonTextures(anisotropy);
  const sportTire = makeTireTreadTextures(anisotropy, false);
  const offroadTire = makeTireTreadTextures(anisotropy, true);
  const brakeDisc = makeBrakeDiscTextures(anisotropy);
  const contactShadowMap = makeContactShadowTexture(anisotropy);
  const grilleMap = makeGrilleTexture(anisotropy);
  const dashModernMap = makeDashboardTexture(anisotropy, 'modern');
  const dashClassicMap = makeDashboardTexture(anisotropy, 'classic');
  const dashOffroadMap = makeDashboardTexture(anisotropy, 'offroad');

  const all: THREE.Texture[] = [
    carbon.map,
    carbon.bump,
    sportTire.map,
    sportTire.bump,
    offroadTire.map,
    offroadTire.bump,
    brakeDisc.map,
    brakeDisc.roughness,
    contactShadowMap,
    grilleMap,
    dashModernMap,
    dashClassicMap,
    dashOffroadMap,
  ];

  return {
    carbonMap: carbon.map,
    carbonBump: carbon.bump,
    tireTreadMap: sportTire.map,
    tireTreadBump: sportTire.bump,
    offroadTreadMap: offroadTire.map,
    offroadTreadBump: offroadTire.bump,
    brakeDiscMap: brakeDisc.map,
    brakeDiscRoughness: brakeDisc.roughness,
    contactShadowMap,
    grilleMap,
    dashModernMap,
    dashClassicMap,
    dashOffroadMap,
    dispose: () => {
      all.forEach((t) => t.dispose());
    },
  };
}

// ============================================================================
// 4. ORTAK PBR MATERYAL KİTİ
// ============================================================================

interface SharedCarMaterials {
  carbon: THREE.MeshPhysicalMaterial;
  matteTrim: THREE.MeshStandardMaterial;
  chassisSteel: THREE.MeshStandardMaterial;
  chrome: THREE.MeshStandardMaterial;
  brushedAlloy: THREE.MeshPhysicalMaterial;
  darkAlloy: THREE.MeshPhysicalMaterial;
  goldAlloy: THREE.MeshPhysicalMaterial;
  glass: THREE.MeshPhysicalMaterial;
  headlightGlass: THREE.MeshPhysicalMaterial;
  sportTireRubber: THREE.MeshStandardMaterial;
  offroadTireRubber: THREE.MeshStandardMaterial;
  whitewall: THREE.MeshStandardMaterial;
  brakeDisc: THREE.MeshStandardMaterial;
  caliperRed: THREE.MeshPhysicalMaterial;
  caliperAmber: THREE.MeshPhysicalMaterial;
  leatherDark: THREE.MeshStandardMaterial;
  leatherTan: THREE.MeshStandardMaterial;
  woodTrim: THREE.MeshPhysicalMaterial;
  grille: THREE.MeshStandardMaterial;
  exhaustTitanium: THREE.MeshStandardMaterial;
  amberLight: THREE.MeshStandardMaterial;
  orangeTraction: THREE.MeshStandardMaterial;
  dispose: () => void;
}

export function createPaintMaterial(preset: PaintPreset): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(preset.hex),
    metalness: preset.metalness,
    roughness: preset.roughness,
    clearcoat: preset.clearcoat,
    clearcoatRoughness: preset.clearcoatRoughness,
    envMapIntensity: 1.35,
  });
}

export function updatePaintMaterial(
  mat: THREE.MeshPhysicalMaterial,
  preset: PaintPreset,
): void {
  mat.color.set(preset.hex);
  mat.metalness = preset.metalness;
  mat.roughness = preset.roughness;
  mat.clearcoat = preset.clearcoat;
  mat.clearcoatRoughness = preset.clearcoatRoughness;
  mat.needsUpdate = true;
}

function createSharedMaterials(
  textures: CarTextureBundle,
  isSoftwareGl: boolean,
): SharedCarMaterials {
  const carbon = new THREE.MeshPhysicalMaterial({
    map: textures.carbonMap,
    bumpMap: textures.carbonBump,
    bumpScale: 0.008,
    roughness: 0.28,
    metalness: 0.25,
    clearcoat: 0.85,
    clearcoatRoughness: 0.14,
  });

  const matteTrim = new THREE.MeshStandardMaterial({
    color: 0x16181d,
    roughness: 0.78,
    metalness: 0.08,
  });

  const chassisSteel = new THREE.MeshStandardMaterial({
    color: 0x22262e,
    roughness: 0.55,
    metalness: 0.7,
  });

  const chrome = new THREE.MeshStandardMaterial({
    color: 0xf4f6f9,
    roughness: 0.06,
    metalness: 1.0,
    envMapIntensity: 1.65,
  });

  const brushedAlloy = new THREE.MeshPhysicalMaterial({
    color: 0xd1d6de,
    roughness: 0.22,
    metalness: 0.94,
    anisotropy: 0.75,
    envMapIntensity: 1.3,
  });

  const darkAlloy = new THREE.MeshPhysicalMaterial({
    color: 0x262b33,
    roughness: 0.28,
    metalness: 0.88,
    anisotropy: 0.5,
  });

  const goldAlloy = new THREE.MeshPhysicalMaterial({
    color: 0xc29b57,
    roughness: 0.25,
    metalness: 0.9,
    anisotropy: 0.6,
  });

  // Sleek smoked automotive glass (avoids milky gray refraction over studio floor)
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x18202c,
    metalness: 0.18,
    roughness: 0.05,
    transparent: true,
    opacity: isSoftwareGl ? 0.55 : 0.52,
    clearcoat: 1.0,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.8,
    depthWrite: false,
  });

  const headlightGlass = new THREE.MeshPhysicalMaterial({
    color: 0xdbeafe,
    metalness: 0.1,
    roughness: 0.04,
    transparent: true,
    opacity: 0.36,
    clearcoat: 1.0,
    envMapIntensity: 2.0,
    depthWrite: false,
  });

  const sportTireRubber = new THREE.MeshStandardMaterial({
    map: textures.tireTreadMap,
    bumpMap: textures.tireTreadBump,
    bumpScale: 0.015,
    color: 0x24272c,
    roughness: 0.88,
    metalness: 0.04,
  });

  const offroadTireRubber = new THREE.MeshStandardMaterial({
    map: textures.offroadTreadMap,
    bumpMap: textures.offroadTreadBump,
    bumpScale: 0.028,
    color: 0x222529,
    roughness: 0.92,
    metalness: 0.03,
  });

  const whitewall = new THREE.MeshStandardMaterial({
    color: 0xece8dc,
    roughness: 0.68,
    metalness: 0.02,
  });

  const brakeDisc = new THREE.MeshStandardMaterial({
    map: textures.brakeDiscMap,
    roughnessMap: textures.brakeDiscRoughness,
    metalness: 0.9,
    roughness: 0.34,
  });

  const caliperRed = new THREE.MeshPhysicalMaterial({
    color: 0xdc2626,
    roughness: 0.22,
    metalness: 0.55,
    clearcoat: 0.9,
  });

  const caliperAmber = new THREE.MeshPhysicalMaterial({
    color: 0xea580c,
    roughness: 0.25,
    metalness: 0.5,
    clearcoat: 0.85,
  });

  const leatherDark = new THREE.MeshStandardMaterial({
    color: 0x1b1d22,
    roughness: 0.72,
    metalness: 0.04,
  });

  const leatherTan = new THREE.MeshStandardMaterial({
    color: 0x8f562e,
    roughness: 0.65,
    metalness: 0.04,
  });

  const woodTrim = new THREE.MeshPhysicalMaterial({
    color: 0x6b3a1d,
    roughness: 0.22,
    metalness: 0.05,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
  });

  const grille = new THREE.MeshStandardMaterial({
    map: textures.grilleMap,
    color: 0x23262e,
    roughness: 0.6,
    metalness: 0.65,
  });

  const exhaustTitanium = new THREE.MeshStandardMaterial({
    color: 0x9aa4b5,
    roughness: 0.16,
    metalness: 0.96,
  });

  const amberLight = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 1.15,
    roughness: 0.2,
    metalness: 0.1,
  });

  const orangeTraction = new THREE.MeshStandardMaterial({
    color: 0xea580c,
    roughness: 0.65,
    metalness: 0.08,
  });

  const list: THREE.Material[] = [
    carbon,
    matteTrim,
    chassisSteel,
    chrome,
    brushedAlloy,
    darkAlloy,
    goldAlloy,
    glass,
    headlightGlass,
    sportTireRubber,
    offroadTireRubber,
    whitewall,
    brakeDisc,
    caliperRed,
    caliperAmber,
    leatherDark,
    leatherTan,
    woodTrim,
    grille,
    exhaustTitanium,
    amberLight,
    orangeTraction,
  ];

  return {
    carbon,
    matteTrim,
    chassisSteel,
    chrome,
    brushedAlloy,
    darkAlloy,
    goldAlloy,
    glass,
    headlightGlass,
    sportTireRubber,
    offroadTireRubber,
    whitewall,
    brakeDisc,
    caliperRed,
    caliperAmber,
    leatherDark,
    leatherTan,
    woodTrim,
    grille,
    exhaustTitanium,
    amberLight,
    orangeTraction,
    dispose: () => {
      list.forEach((m) => m.dispose());
    },
  };
}

// ============================================================================
// 5. GEOMETRİ VE PARÇA ETİKETLEME YARDIMCILARI
// ============================================================================

function registerExplodeTarget(
  rig: BuiltCarRig,
  object: THREE.Object3D,
  offset: [number, number, number],
): void {
  rig.explodedTargets.push({
    object,
    basePos: object.position.clone(),
    offset: new THREE.Vector3(offset[0], offset[1], offset[2]),
  });
}

function tagInspectable(
  rig: BuiltCarRig,
  object: THREE.Object3D,
  info: InspectablePartInfo,
): void {
  object.traverse((child) => {
    child.userData.partInfo = info;
    if ((child as THREE.Mesh).isMesh) {
      child.layers.enable(1);
    }
  });
  rig.inspectableObjects.push(object);
}

function enableShadows(obj: THREE.Object3D, cast = true, receive = true): void {
  obj.traverse((child) => {
    if ((child as THREE.Mesh).isMesh) {
      child.castShadow = cast;
      child.receiveShadow = receive;
    }
  });
}

function createCenteredExtrude(
  shape: THREE.Shape,
  options: THREE.ExtrudeGeometryOptions,
): THREE.ExtrudeGeometry {
  const geo = new THREE.ExtrudeGeometry(shape, {
    curveSegments: 28,
    ...options,
  });
  const depth = options.depth ?? 1;
  geo.translate(0, 0, -depth * 0.5);
  geo.computeVertexNormals();
  return geo;
}

function createContactShadow(
  texture: THREE.CanvasTexture,
  width: number,
  length: number,
): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(width, length);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.68,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0.008;
  mesh.renderOrder = 1;
  return mesh;
}

function attachRigControls(rig: BuiltCarRig): BuiltCarRig {
  const scratch = new THREE.Vector3();

  rig.setPaint = (paintIdOrPreset) => {
    const preset =
      typeof paintIdOrPreset === 'string'
        ? PAINT_PRESETS.find((p) => p.id === paintIdOrPreset)
        : paintIdOrPreset;
    if (!preset) return;
    rig.paintMaterials.forEach((m) => updatePaintMaterial(m, preset));
  };

  rig.setHeadlights = (on) => {
    rig.headlightMaterials.forEach((m) => {
      m.emissiveIntensity = on ? 3.4 : 0.75;
    });
    rig.taillightMaterials.forEach((m) => {
      m.emissiveIntensity = on ? 2.5 : 0.7;
    });
    rig.dashMaterials.forEach((m) => {
      m.emissiveIntensity = on ? 0.95 : 0.35;
    });
    rig.headlightSpots.forEach((s) => {
      s.intensity = on ? 16 : 0;
    });
  };

  rig.setExplode = (factor) => {
    const t = THREE.MathUtils.clamp(factor, 0, 1);
    rig.explodedTargets.forEach((item) => {
      scratch.copy(item.basePos).addScaledVector(item.offset, t);
      item.object.position.copy(scratch);
    });
  };

  rig.spinWheels = (deltaAngle) => {
    rig.wheelSpinGroups.forEach((wg) => {
      wg.rotation.x += deltaAngle;
    });
  };

  return rig;
}

// ============================================================================
// 6. DETAYLI JANT, LASTİK VE FREN SİSTEMİ ÜRETİCİSİ
// ============================================================================

type WheelStyle = 'supercar' | 'classic' | 'offroad';

function buildDetailedWheel(
  style: WheelStyle,
  radius: number,
  width: number,
  isRightSide: boolean,
  mats: SharedCarMaterials,
): { root: THREE.Group; spinGroup: THREE.Group } {
  const root = new THREE.Group();
  const spinGroup = new THREE.Group();
  root.add(spinGroup);

  const sideSign = isRightSide ? 1 : -1;
  const rimRadius =
    style === 'supercar'
      ? radius * 0.72
      : style === 'classic'
        ? radius * 0.6
        : radius * 0.54;

  const halfW = width * 0.5;
  const shoulderR = radius * 0.94;
  const beadR = rimRadius * 0.97;
  const profilePoints = [
    new THREE.Vector2(beadR, -halfW * 0.88),
    new THREE.Vector2(shoulderR, -halfW),
    new THREE.Vector2(radius, -halfW * 0.78),
    new THREE.Vector2(radius, halfW * 0.78),
    new THREE.Vector2(shoulderR, halfW),
    new THREE.Vector2(beadR, halfW * 0.88),
  ];
  const tireGeo = new THREE.LatheGeometry(profilePoints, 40);
  tireGeo.rotateZ(Math.PI / 2);
  const tireMat =
    style === 'offroad' ? mats.offroadTireRubber : mats.sportTireRubber;
  const tireMesh = new THREE.Mesh(tireGeo, tireMat);
  tireMesh.castShadow = true;
  tireMesh.receiveShadow = true;
  spinGroup.add(tireMesh);

  if (style === 'offroad') {
    const lugCount = 24;
    const lugGeo = new THREE.BoxGeometry(width * 0.86, 0.028, 0.058);
    const lugMesh = new THREE.InstancedMesh(lugGeo, mats.offroadTireRubber, lugCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < lugCount; i++) {
      const ang = (i / lugCount) * Math.PI * 2;
      const offsetX = i % 2 === 0 ? 0.015 : -0.015;
      dummy.position.set(
        offsetX,
        Math.cos(ang) * (radius - 0.004),
        Math.sin(ang) * (radius - 0.004),
      );
      dummy.rotation.set(-ang, 0, 0);
      dummy.updateMatrix();
      lugMesh.setMatrixAt(i, dummy.matrix);
    }
    lugMesh.instanceMatrix.needsUpdate = true;
    lugMesh.computeBoundingSphere();
    lugMesh.castShadow = true;
    spinGroup.add(lugMesh);
  }

  if (style === 'classic') {
    const wwGeo = new THREE.RingGeometry(rimRadius * 1.04, rimRadius * 1.24, 36);
    wwGeo.rotateY((sideSign * Math.PI) / 2);
    const wwMesh = new THREE.Mesh(wwGeo, mats.whitewall);
    wwMesh.position.x = sideSign * (halfW * 0.96);
    spinGroup.add(wwMesh);
  }

  const barrelGeo = new THREE.CylinderGeometry(
    rimRadius,
    rimRadius,
    width * 0.82,
    36,
    1,
    true,
  );
  barrelGeo.rotateZ(Math.PI / 2);
  const barrel = new THREE.Mesh(
    barrelGeo,
    style === 'classic' ? mats.chrome : mats.darkAlloy,
  );
  spinGroup.add(barrel);

  const lipGeo = new THREE.TorusGeometry(rimRadius * 0.985, 0.016, 12, 36);
  lipGeo.rotateY(Math.PI / 2);
  const lip = new THREE.Mesh(
    lipGeo,
    style === 'classic' ? mats.chrome : mats.brushedAlloy,
  );
  lip.position.x = sideSign * (halfW * 0.78);
  spinGroup.add(lip);

  if (style === 'supercar') {
    const hubGeo = new THREE.CylinderGeometry(0.065, 0.072, 0.07, 20);
    hubGeo.rotateZ(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, mats.brushedAlloy);
    hub.position.x = sideSign * (halfW * 0.62);
    spinGroup.add(hub);

    const lockGeo = new THREE.CylinderGeometry(0.036, 0.042, 0.03, 6);
    lockGeo.rotateZ(Math.PI / 2);
    const lock = new THREE.Mesh(lockGeo, mats.caliperRed);
    lock.position.x = sideSign * (halfW * 0.76);
    spinGroup.add(lock);

    const spokeLen = rimRadius * 0.86;
    const spokeGeo = new THREE.BoxGeometry(0.018, spokeLen, 0.014);
    for (let i = 0; i < 5; i++) {
      const baseAng = (i / 5) * Math.PI * 2;
      for (const delta of [-0.17, 0.17]) {
        const ang = baseAng + delta;
        const spoke = new THREE.Mesh(spokeGeo, mats.brushedAlloy);
        spoke.position.set(
          sideSign * (halfW * 0.68),
          Math.cos(ang) * (spokeLen * 0.48),
          Math.sin(ang) * (spokeLen * 0.48),
        );
        spoke.rotation.x = -ang;
        spoke.rotation.z = sideSign * -0.14;
        spinGroup.add(spoke);
      }
    }
  } else if (style === 'classic') {
    const hubGeo = new THREE.CylinderGeometry(0.055, 0.068, 0.1, 20);
    hubGeo.rotateZ(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, mats.chrome);
    hub.position.x = sideSign * (halfW * 0.56);
    spinGroup.add(hub);

    const ear = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.13, 0.022),
      mats.chrome,
    );
    ear.position.x = sideSign * (halfW * 0.78);
    spinGroup.add(ear);

    const wireGeo = new THREE.CylinderGeometry(0.0045, 0.0045, rimRadius * 0.94, 6);
    const wireCount = 20;
    for (let i = 0; i < wireCount; i++) {
      const ang = (i / wireCount) * Math.PI * 2;
      const wire = new THREE.Mesh(wireGeo, mats.chrome);
      wire.position.set(
        sideSign * (halfW * 0.62),
        Math.cos(ang) * (rimRadius * 0.48),
        Math.sin(ang) * (rimRadius * 0.48),
      );
      wire.rotation.x = -ang + (i % 2 === 0 ? 0.18 : -0.18);
      wire.rotation.z = sideSign * (i % 2 === 0 ? -0.15 : 0.12);
      spinGroup.add(wire);
    }
  } else {
    const hubGeo = new THREE.CylinderGeometry(0.072, 0.078, 0.08, 16);
    hubGeo.rotateZ(Math.PI / 2);
    const hub = new THREE.Mesh(hubGeo, mats.darkAlloy);
    hub.position.x = sideSign * (halfW * 0.62);
    spinGroup.add(hub);

    const spokeGeo = new THREE.BoxGeometry(0.026, rimRadius * 0.85, 0.042);
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2;
      const spoke = new THREE.Mesh(spokeGeo, mats.darkAlloy);
      spoke.position.set(
        sideSign * (halfW * 0.64),
        Math.cos(ang) * (rimRadius * 0.44),
        Math.sin(ang) * (rimRadius * 0.44),
      );
      spoke.rotation.x = -ang;
      spinGroup.add(spoke);
    }

    const boltGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.016, 6);
    boltGeo.rotateZ(Math.PI / 2);
    for (let i = 0; i < 16; i++) {
      const ang = (i / 16) * Math.PI * 2;
      const bolt = new THREE.Mesh(boltGeo, mats.brushedAlloy);
      bolt.position.set(
        sideSign * (halfW * 0.82),
        Math.cos(ang) * (rimRadius * 0.94),
        Math.sin(ang) * (rimRadius * 0.94),
      );
      spinGroup.add(bolt);
    }
  }

  const rotorRadius = rimRadius * 0.78;
  const rotorGeo = new THREE.CylinderGeometry(rotorRadius, rotorRadius, 0.024, 32);
  rotorGeo.rotateZ(Math.PI / 2);
  const rotor = new THREE.Mesh(rotorGeo, mats.brakeDisc);
  rotor.position.x = sideSign * (halfW * 0.25);
  spinGroup.add(rotor);

  const caliperGeo = new THREE.BoxGeometry(0.056, rotorRadius * 0.56, rotorRadius * 0.34);
  const caliperMat =
    style === 'supercar'
      ? mats.caliperRed
      : style === 'offroad'
        ? mats.caliperAmber
        : mats.brushedAlloy;
  const caliper = new THREE.Mesh(caliperGeo, caliperMat);
  caliper.position.set(
    sideSign * (halfW * 0.28),
    rotorRadius * 0.52,
    -rotorRadius * 0.42,
  );
  caliper.rotation.x = 0.48;
  root.add(caliper);

  return { root, spinGroup };
}

// ============================================================================
// 7. MODEL 01: APEX V12 GT (HİPERSPOR COUPE)
// ============================================================================

function buildSupercarInternal(
  mats: SharedCarMaterials,
  textures: CarTextureBundle,
): BuiltCarRig {
  const root = new THREE.Group();
  root.name = 'car-supercar';

  const defaultPaint =
    PAINT_PRESETS.find((p) => p.id === CAR_SPECS.supercar.defaultPaintId) ??
    PAINT_PRESETS[0];
  const paintMat = createPaintMaterial(defaultPaint);

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xe0f2fe,
    emissiveIntensity: 0.85,
    roughness: 0.08,
    metalness: 0.15,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 0.75,
    roughness: 0.15,
    metalness: 0.1,
  });

  const dashMat = new THREE.MeshStandardMaterial({
    map: textures.dashModernMap,
    emissiveMap: textures.dashModernMap,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.35,
    roughness: 0.4,
  });

  const contactShadow = createContactShadow(textures.contactShadowMap, 2.7, 5.2);
  root.add(contactShadow);

  const rig: BuiltCarRig = {
    id: 'supercar',
    spec: CAR_SPECS.supercar,
    root,
    paintMaterials: [paintMat],
    headlightMaterials: [headlightMat],
    taillightMaterials: [taillightMat],
    dashMaterials: [dashMat],
    headlightSpots: [],
    wheelSpinGroups: [],
    explodedTargets: [],
    inspectableObjects: [],
    contactShadow,
    setPaint: () => {},
    setHeadlights: () => {},
    setExplode: () => {},
    spinWheels: () => {},
  };

  // 1. Karbon Alt Şasi ve Aerodinamik Difüzör
  const chassisGroup = new THREE.Group();
  root.add(chassisGroup);

  const floorpan = new THREE.Mesh(
    new THREE.BoxGeometry(1.76, 0.055, 4.18),
    mats.carbon,
  );
  floorpan.position.set(0, 0.15, 0.02);
  chassisGroup.add(floorpan);

  const splitterShape = new THREE.Shape();
  splitterShape.moveTo(-0.95, -0.15);
  splitterShape.lineTo(0.95, -0.15);
  splitterShape.quadraticCurveTo(0.9, 0.3, 0.46, 0.4);
  splitterShape.lineTo(-0.46, 0.4);
  splitterShape.quadraticCurveTo(-0.9, 0.3, -0.95, -0.15);

  const splitterGeo = createCenteredExtrude(splitterShape, {
    depth: 0.032,
    bevelEnabled: true,
    bevelThickness: 0.01,
    bevelSize: 0.012,
    bevelSegments: 2,
  });
  splitterGeo.rotateX(-Math.PI / 2);
  const splitter = new THREE.Mesh(splitterGeo, mats.carbon);
  splitter.position.set(0, 0.125, 1.9);
  chassisGroup.add(splitter);

  for (const sx of [-1, 1]) {
    const canard = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.018, 0.28),
      mats.carbon,
    );
    canard.position.set(sx * 0.92, 0.24, 1.85);
    canard.rotation.z = sx * 0.28;
    canard.rotation.y = sx * -0.16;
    chassisGroup.add(canard);

    const skirt = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.04, 1.98),
      mats.carbon,
    );
    skirt.position.set(sx * 0.9, 0.14, 0.02);
    chassisGroup.add(skirt);

    const skirtFin = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.13, 0.28),
      mats.carbon,
    );
    skirtFin.position.set(sx * 0.96, 0.21, -0.78);
    chassisGroup.add(skirtFin);
  }

  const diffuserBase = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.12, 0.56),
    mats.carbon,
  );
  diffuserBase.position.set(0, 0.19, -1.96);
  diffuserBase.rotation.x = -0.22;
  chassisGroup.add(diffuserBase);

  for (let i = -2; i <= 2; i++) {
    const fin = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.18, 0.52),
      mats.carbon,
    );
    fin.position.set(i * 0.31, 0.19, -1.98);
    chassisGroup.add(fin);
  }

  const frontGrille = new THREE.Mesh(
    new THREE.BoxGeometry(1.34, 0.14, 0.06),
    mats.grille,
  );
  frontGrille.position.set(0, 0.22, 2.09);
  chassisGroup.add(frontGrille);

  registerExplodeTarget(rig, chassisGroup, [0, -0.32, 0]);
  tagInspectable(rig, chassisGroup, {
    id: 'supercar-aero',
    title: 'Aktif Karbon Alt Şasi ve Difüzör',
    category: 'Aerodinamik',
    description:
      'Ön karbon splitter, yan etek kanatçıkları ve 5 kanallı Venturi arka difüzör yüksek hızda yere basma kuvvetini artırır.',
  });

  // 2. Orta Konumlu V12 Motor ve Titanyum Egzoz
  const engineGroup = new THREE.Group();
  root.add(engineGroup);

  const block = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.26, 0.78),
    mats.brushedAlloy,
  );
  block.position.set(0, 0.42, -0.78);
  engineGroup.add(block);

  for (const sx of [-1, 1]) {
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.1, 0.74),
      mats.caliperRed,
    );
    head.position.set(sx * 0.21, 0.57, -0.78);
    head.rotation.z = sx * -0.36;
    engineGroup.add(head);

    const plenum = new THREE.Mesh(
      new THREE.CylinderGeometry(0.068, 0.075, 0.68, 16),
      mats.carbon,
    );
    plenum.rotation.x = Math.PI / 2;
    plenum.position.set(sx * 0.13, 0.65, -0.78);
    engineGroup.add(plenum);

    const brace = new THREE.Mesh(
      new THREE.CylinderGeometry(0.014, 0.014, 0.82, 8),
      mats.goldAlloy,
    );
    brace.position.set(0, 0.72, -0.78);
    brace.rotation.x = Math.PI / 2;
    brace.rotation.z = sx * 0.55;
    engineGroup.add(brace);
  }

  const tipProfile = [
    new THREE.Vector2(0.036, 0),
    new THREE.Vector2(0.044, 0),
    new THREE.Vector2(0.046, 0.14),
    new THREE.Vector2(0.038, 0.14),
    new THREE.Vector2(0.036, 0.02),
  ];
  const tipGeo = new THREE.LatheGeometry(tipProfile, 24);
  tipGeo.rotateX(-Math.PI / 2);

  for (const ex of [-0.28, -0.15, 0.15, 0.28]) {
    const tip = new THREE.Mesh(tipGeo, mats.exhaustTitanium);
    tip.position.set(ex, 0.38, -2.07);
    engineGroup.add(tip);
  }

  registerExplodeTarget(rig, engineGroup, [0, 0.55, -0.35]);
  tagInspectable(rig, engineGroup, {
    id: 'supercar-engine',
    title: '6.5L Atmosferik V12 ve Titanyum Egzoz',
    category: 'Güç Aktarma',
    description:
      'Orta konumlu 840 BG V12 motor bloğu, karbon emme manifoldları, altın X-gergi çubuğu ve dörtlü titanyum egzoz çıkışı.',
  });

  // 3. Kama Formlu Gövde, Çamurluklar ve Kuğu Boynu Arka Kanat
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const hullShape = new THREE.Shape();
  hullShape.moveTo(-2.06, 0.28);
  hullShape.lineTo(-2.12, 0.68);
  hullShape.lineTo(-1.56, 0.74);
  hullShape.lineTo(-0.42, 0.79);
  hullShape.lineTo(0.62, 0.73);
  hullShape.quadraticCurveTo(1.36, 0.64, 2.08, 0.32);
  hullShape.lineTo(2.04, 0.2);
  hullShape.lineTo(1.66, 0.2);
  hullShape.absarc(1.34, 0.32, 0.4, -0.25, Math.PI + 0.25, false);
  hullShape.lineTo(0.88, 0.2);
  hullShape.lineTo(-0.84, 0.2);
  hullShape.absarc(-1.3, 0.34, 0.42, -0.22, Math.PI + 0.22, false);
  hullShape.lineTo(-1.76, 0.22);
  hullShape.closePath();

  const hullGeo = createCenteredExtrude(hullShape, {
    depth: 1.54,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.055,
    bevelSegments: 5,
  });
  hullGeo.rotateY(-Math.PI / 2);
  bodyGroup.add(new THREE.Mesh(hullGeo, paintMat));

  const rearFenderShape = new THREE.Shape();
  rearFenderShape.moveTo(-2.04, 0.46);
  rearFenderShape.quadraticCurveTo(-1.45, 0.88, -0.92, 0.76);
  rearFenderShape.lineTo(-0.74, 0.58);
  rearFenderShape.lineTo(-0.74, 0.24);
  rearFenderShape.lineTo(-0.88, 0.24);
  rearFenderShape.absarc(-1.3, 0.34, 0.43, 0, Math.PI, false);
  rearFenderShape.lineTo(-1.82, 0.24);
  rearFenderShape.lineTo(-2.04, 0.3);
  rearFenderShape.closePath();

  const rearFenderGeo = createCenteredExtrude(rearFenderShape, {
    depth: 0.24,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.04,
    bevelSegments: 4,
  });
  rearFenderGeo.rotateY(-Math.PI / 2);

  const frontFenderShape = new THREE.Shape();
  frontFenderShape.moveTo(0.82, 0.24);
  frontFenderShape.lineTo(0.82, 0.66);
  frontFenderShape.quadraticCurveTo(1.36, 0.73, 1.94, 0.44);
  frontFenderShape.lineTo(2.04, 0.28);
  frontFenderShape.lineTo(1.78, 0.22);
  frontFenderShape.absarc(1.34, 0.32, 0.41, 0, Math.PI, false);
  frontFenderShape.closePath();

  const frontFenderGeo = createCenteredExtrude(frontFenderShape, {
    depth: 0.22,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.04,
    bevelSegments: 4,
  });
  frontFenderGeo.rotateY(-Math.PI / 2);

  for (const sx of [-1, 1]) {
    const rf = new THREE.Mesh(rearFenderGeo, paintMat);
    rf.position.x = sx * 0.84;
    bodyGroup.add(rf);

    const ff = new THREE.Mesh(frontFenderGeo, paintMat);
    ff.position.x = sx * 0.82;
    bodyGroup.add(ff);

    const intakePocket = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.32, 0.48),
      mats.carbon,
    );
    intakePocket.position.set(sx * 0.81, 0.47, -0.56);
    intakePocket.rotation.y = sx * 0.12;
    bodyGroup.add(intakePocket);

    const intakeBlade = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.032, 0.44),
      paintMat,
    );
    intakeBlade.position.set(sx * 0.84, 0.47, -0.54);
    intakeBlade.rotation.y = sx * 0.12;
    bodyGroup.add(intakeBlade);
  }

  const hoodVent = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.035, 0.42),
    mats.carbon,
  );
  hoodVent.position.set(0, 0.65, 1.25);
  hoodVent.rotation.x = 0.24;
  bodyGroup.add(hoodVent);

  const rearPanel = new THREE.Mesh(
    new THREE.BoxGeometry(1.62, 0.26, 0.08),
    mats.grille,
  );
  rearPanel.position.set(0, 0.48, -2.14);
  bodyGroup.add(rearPanel);

  // Kuğu Boynu Arka Kanat
  const wingGroup = new THREE.Group();
  const foilShape = new THREE.Shape();
  foilShape.moveTo(-0.18, 0.02);
  foilShape.quadraticCurveTo(0, 0.06, 0.18, 0.01);
  foilShape.lineTo(0.18, -0.015);
  foilShape.quadraticCurveTo(0, 0.015, -0.18, -0.01);
  foilShape.closePath();

  const wingGeo = createCenteredExtrude(foilShape, {
    depth: 1.76,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.01,
    bevelSegments: 2,
  });
  wingGeo.rotateY(-Math.PI / 2);
  const wingBlade = new THREE.Mesh(wingGeo, mats.carbon);
  wingBlade.position.set(0, 1.04, -2.02);
  wingBlade.rotation.x = -0.12;
  wingGroup.add(wingBlade);

  for (const sx of [-1, 1]) {
    const endplate = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.2, 0.44),
      paintMat,
    );
    endplate.position.set(sx * 0.9, 1.03, -2.01);
    wingGroup.add(endplate);

    const pylon = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.34, 0.14),
      mats.darkAlloy,
    );
    pylon.position.set(sx * 0.42, 0.89, -1.94);
    pylon.rotation.x = -0.24;
    wingGroup.add(pylon);
  }
  bodyGroup.add(wingGroup);

  registerExplodeTarget(rig, bodyGroup, [0, 0.4, 0]);
  tagInspectable(rig, bodyGroup, {
    id: 'supercar-body',
    title: 'Karbon Monokok Gövde ve Kuğu Boynu Kanat',
    category: 'Dış Tasarım',
    description:
      'Derin yan hava kanalları, genişletilmiş çamurluk omuzları ve CNC işlenmiş kuğu boynu GT arka kanadıyla kusursuz hava akışı.',
  });

  // 4. Füme Cam Kokpit Kanopisi, Tavan Hava Girişi ve Aynalar
  const glassGroup = new THREE.Group();
  root.add(glassGroup);

  const canopyShape = new THREE.Shape();
  canopyShape.moveTo(-1.12, 0.78);
  canopyShape.quadraticCurveTo(-0.56, 1.09, -0.05, 1.13);
  canopyShape.quadraticCurveTo(0.45, 1.11, 0.96, 0.71);
  canopyShape.lineTo(-1.12, 0.74);
  canopyShape.closePath();

  const canopyGeo = createCenteredExtrude(canopyShape, {
    depth: 1.18,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelSegments: 5,
  });
  canopyGeo.rotateY(-Math.PI / 2);
  const canopy = new THREE.Mesh(canopyGeo, mats.glass);
  canopy.renderOrder = 4;
  glassGroup.add(canopy);

  const roofCap = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.055, 0.88),
    mats.carbon,
  );
  roofCap.position.set(0, 1.135, -0.22);
  glassGroup.add(roofCap);

  const roofScoop = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.085, 0.54),
    paintMat,
  );
  roofScoop.position.set(0, 1.18, -0.32);
  glassGroup.add(roofScoop);

  const engineGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.86, 0.025, 0.78),
    mats.glass,
  );
  engineGlass.position.set(0, 0.84, -0.96);
  engineGlass.rotation.x = 0.14;
  engineGlass.renderOrder = 4;
  glassGroup.add(engineGlass);

  for (const sx of [-1, 1]) {
    const stalk = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.022, 0.045),
      mats.carbon,
    );
    stalk.position.set(sx * 0.79, 0.75, 0.52);
    stalk.rotation.z = sx * 0.24;
    glassGroup.add(stalk);

    const mirrorPod = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.06, 0.1),
      paintMat,
    );
    mirrorPod.position.set(sx * 0.88, 0.78, 0.49);
    mirrorPod.rotation.y = sx * -0.18;
    glassGroup.add(mirrorPod);
  }

  registerExplodeTarget(rig, glassGroup, [0, 0.92, 0]);

  // 5. İç Mekan Yarış Kokpiti
  const interiorGroup = new THREE.Group();
  root.add(interiorGroup);

  const tunnel = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.24, 1.2),
    mats.carbon,
  );
  tunnel.position.set(0, 0.34, 0.12);
  interiorGroup.add(tunnel);

  for (const sx of [-1, 1]) {
    const seatBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.1, 0.46),
      mats.leatherDark,
    );
    seatBase.position.set(sx * 0.34, 0.28, -0.02);
    interiorGroup.add(seatBase);

    const seatBack = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.56, 0.11),
      mats.leatherDark,
    );
    seatBack.position.set(sx * 0.34, 0.56, -0.24);
    seatBack.rotation.x = -0.24;
    interiorGroup.add(seatBack);

    const seatStripe = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.48, 0.12),
      mats.caliperRed,
    );
    seatStripe.position.set(sx * 0.34, 0.58, -0.235);
    seatStripe.rotation.x = -0.24;
    interiorGroup.add(seatStripe);
  }

  const dash = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.2, 0.32), dashMat);
  dash.position.set(0, 0.62, 0.56);
  interiorGroup.add(dash);

  const steerRim = new THREE.Mesh(
    new THREE.TorusGeometry(0.135, 0.018, 10, 24),
    mats.carbon,
  );
  steerRim.position.set(-0.34, 0.64, 0.36);
  steerRim.rotation.x = -0.28;
  interiorGroup.add(steerRim);

  registerExplodeTarget(rig, interiorGroup, [0, 0.25, 0.08]);
  tagInspectable(rig, interiorGroup, {
    id: 'supercar-cockpit',
    title: 'Karbon Yarış Kokpiti ve Dijital Telemetri',
    category: 'İç Mekan',
    description:
      'Çift karbon fiber yarış koltuğu, alt düzleştirilmiş direksiyon ve yüksek çözünürlüklü telemetri ekranı.',
  });

  // 6. DÜZELTİLMİŞ MATRİS LED FARLAR (Çamurluk yüzeyine tam oturan projektör + L-DRL bıçağı)
  const lightsGroup = new THREE.Group();
  root.add(lightsGroup);

  for (const sx of [-1, 1]) {
    const headlightPod = new THREE.Group();
    headlightPod.position.set(sx * 0.69, 0.535, 1.86);
    headlightPod.rotation.x = 0.26; // Burun eğimiyle hizalı
    headlightPod.rotation.y = sx * -0.16;
    lightsGroup.add(headlightPod);

    // Derin parlak siyah far yuvası (yüzeyin üzerinde net görünür)
    const bezel = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.085, 0.22),
      mats.matteTrim,
    );
    headlightPod.add(bezel);

    // Çift LED projektör lensi
    for (const px of [-0.065, 0.045]) {
      const proj = new THREE.Mesh(
        new THREE.CylinderGeometry(0.028, 0.028, 0.04, 16),
        headlightMat,
      );
      proj.rotation.x = Math.PI / 2;
      proj.position.set(px, 0.01, 0.105);
      headlightPod.add(proj);
    }

    // Keskin L-formlu gündüz sürüş LED bıçağı (DRL)
    const drlTop = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.022, 0.2),
      headlightMat,
    );
    drlTop.position.set(0, 0.042, 0.015);
    headlightPod.add(drlTop);

    const drlOuter = new THREE.Mesh(
      new THREE.BoxGeometry(0.024, 0.075, 0.18),
      headlightMat,
    );
    drlOuter.position.set(sx * 0.142, 0.01, 0.025);
    headlightPod.add(drlOuter);

    // Şeffaf polikarbonat far camı kapağı
    const cover = new THREE.Mesh(
      new THREE.BoxGeometry(0.325, 0.09, 0.225),
      mats.headlightGlass,
    );
    cover.position.set(0, 0.005, 0.01);
    cover.renderOrder = 5;
    headlightPod.add(cover);

    // Far açıldığında yola düşen spot ışık
    const spot = new THREE.SpotLight(0xe0f2fe, 0, 14, Math.PI / 6, 0.55, 1.6);
    spot.position.set(sx * 0.68, 0.52, 2.02);
    spot.target.position.set(sx * 0.68, 0.1, 7.5);
    lightsGroup.add(spot);
    lightsGroup.add(spot.target);
    rig.headlightSpots.push(spot);
  }

  const tailBar = new THREE.Mesh(
    new THREE.BoxGeometry(1.66, 0.036, 0.06),
    taillightMat,
  );
  tailBar.position.set(0, 0.64, -2.14);
  lightsGroup.add(tailBar);

  const rainLight = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.07, 0.04),
    taillightMat,
  );
  rainLight.position.set(0, 0.25, -2.16);
  lightsGroup.add(rainLight);

  registerExplodeTarget(rig, lightsGroup, [0, 0.15, 0.26]);
  tagInspectable(rig, lightsGroup, {
    id: 'supercar-lights',
    title: 'Matris LED Farlar ve Tam Boy OLED Stop',
    category: 'Aydınlatma',
    description:
      'Çift projektörlü matris LED far modülleri, bıçak formunda gündüz sürüş imzası ve arka tam boy OLED ışık şeridi.',
  });

  // 7. 20"/21" Dövme Jantlar ve Seramik Frenler
  const wheelCoords: Array<{
    pos: [number, number, number];
    r: number;
    w: number;
    isRight: boolean;
  }> = [
    { pos: [0.87, 0.34, 1.34], r: 0.34, w: 0.25, isRight: true },
    { pos: [-0.87, 0.34, 1.34], r: 0.34, w: 0.25, isRight: false },
    { pos: [0.91, 0.36, -1.3], r: 0.36, w: 0.31, isRight: true },
    { pos: [-0.91, 0.36, -1.3], r: 0.36, w: 0.31, isRight: false },
  ];

  wheelCoords.forEach((wc) => {
    const wheel = buildDetailedWheel('supercar', wc.r, wc.w, wc.isRight, mats);
    wheel.root.position.set(wc.pos[0], wc.pos[1], wc.pos[2]);
    root.add(wheel.root);
    rig.wheelSpinGroups.push(wheel.spinGroup);

    const sx = wc.isRight ? 0.45 : -0.45;
    registerExplodeTarget(rig, wheel.root, [sx, 0, 0]);
    tagInspectable(rig, wheel.root, {
      id: 'supercar-wheels',
      title: 'Dövme Y-Kollu Jantlar ve Karbon-Seramik Fren',
      category: 'Yürüyen Aksam',
      description:
        'Merkezi kilitli (center-lock) dövme alüminyum jantlar, delikli karbon-seramik diskler ve 6 pistonlu kırmızı Brembo kaliperler.',
    });
  });

  enableShadows(root, true, true);
  contactShadow.castShadow = false;
  contactShadow.receiveShadow = false;

  return attachRigControls(rig);
}

// ============================================================================
// 8. MODEL 02: 1967 MONZA SPIDER (KLASİK GRAND TOURER ROADSTER)
// ============================================================================

function buildClassicInternal(
  mats: SharedCarMaterials,
  textures: CarTextureBundle,
): BuiltCarRig {
  const root = new THREE.Group();
  root.name = 'car-classic';

  const defaultPaint =
    PAINT_PRESETS.find((p) => p.id === CAR_SPECS.classic.defaultPaintId) ??
    PAINT_PRESETS[1];
  const paintMat = createPaintMaterial(defaultPaint);

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xfff8e7,
    emissive: 0xfef0c7,
    emissiveIntensity: 0.8,
    roughness: 0.08,
    metalness: 0.1,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    emissive: 0xb91c1c,
    emissiveIntensity: 0.65,
    roughness: 0.18,
    metalness: 0.1,
  });

  const dashMat = new THREE.MeshStandardMaterial({
    map: textures.dashClassicMap,
    emissiveMap: textures.dashClassicMap,
    emissive: new THREE.Color(0xffe8c2),
    emissiveIntensity: 0.25,
    roughness: 0.35,
  });

  const contactShadow = createContactShadow(textures.contactShadowMap, 2.3, 4.7);
  root.add(contactShadow);

  const rig: BuiltCarRig = {
    id: 'classic',
    spec: CAR_SPECS.classic,
    root,
    paintMaterials: [paintMat],
    headlightMaterials: [headlightMat],
    taillightMaterials: [taillightMat],
    dashMaterials: [dashMat],
    headlightSpots: [],
    wheelSpinGroups: [],
    explodedTargets: [],
    inspectableObjects: [],
    contactShadow,
    setPaint: () => {},
    setHeadlights: () => {},
    setExplode: () => {},
    spinWheels: () => {},
  };

  // 1. Çelik Şasi ve Çift Krom Egzoz
  const chassisGroup = new THREE.Group();
  root.add(chassisGroup);

  const underpan = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.08, 3.65),
    mats.chassisSteel,
  );
  underpan.position.set(0, 0.21, 0.02);
  chassisGroup.add(underpan);

  const pipeGeo = new THREE.CylinderGeometry(0.032, 0.032, 1.35, 16);
  pipeGeo.rotateX(Math.PI / 2);
  for (const sx of [-1, 1]) {
    const pipe = new THREE.Mesh(pipeGeo, mats.chrome);
    pipe.position.set(sx * 0.42, 0.2, -1.42);
    chassisGroup.add(pipe);

    const tip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.036, 0.14, 16),
      mats.chrome,
    );
    tip.rotation.x = Math.PI / 2;
    tip.position.set(sx * 0.42, 0.2, -2.06);
    chassisGroup.add(tip);
  }

  registerExplodeTarget(rig, chassisGroup, [0, -0.34, 0]);

  // 2. El İşçiliği Alüminyum Gövde ve Ponton Çamurluklar
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-1.98, 0.28);
  bodyShape.lineTo(-2.02, 0.64);
  bodyShape.quadraticCurveTo(-1.45, 0.78, -0.78, 0.72);
  bodyShape.lineTo(-0.56, 0.52);
  bodyShape.lineTo(0.45, 0.52);
  bodyShape.lineTo(0.66, 0.78);
  bodyShape.quadraticCurveTo(1.38, 0.84, 1.92, 0.62);
  bodyShape.quadraticCurveTo(2.0, 0.46, 1.9, 0.26);
  bodyShape.lineTo(1.62, 0.23);
  bodyShape.absarc(1.3, 0.33, 0.37, -0.15, Math.PI + 0.15, false);
  bodyShape.lineTo(0.88, 0.23);
  bodyShape.lineTo(-0.82, 0.23);
  bodyShape.absarc(-1.24, 0.33, 0.38, -0.15, Math.PI + 0.15, false);
  bodyShape.lineTo(-1.66, 0.23);
  bodyShape.closePath();

  const bodyGeo = createCenteredExtrude(bodyShape, {
    depth: 1.32,
    bevelEnabled: true,
    bevelThickness: 0.11,
    bevelSize: 0.075,
    bevelSegments: 5,
  });
  bodyGeo.rotateY(-Math.PI / 2);
  bodyGroup.add(new THREE.Mesh(bodyGeo, paintMat));

  const fenderShape = new THREE.Shape();
  fenderShape.moveTo(-1.94, 0.32);
  fenderShape.quadraticCurveTo(-1.62, 0.82, -1.05, 0.8);
  fenderShape.quadraticCurveTo(-0.35, 0.68, 0.25, 0.68);
  fenderShape.quadraticCurveTo(0.95, 0.84, 1.54, 0.8);
  fenderShape.quadraticCurveTo(1.88, 0.72, 1.92, 0.42);
  fenderShape.lineTo(1.66, 0.26);
  fenderShape.absarc(1.3, 0.33, 0.38, 0, Math.PI, false);
  fenderShape.lineTo(0.86, 0.26);
  fenderShape.lineTo(-0.78, 0.26);
  fenderShape.absarc(-1.24, 0.33, 0.39, 0, Math.PI, false);
  fenderShape.lineTo(-1.72, 0.26);
  fenderShape.closePath();

  const fenderGeo = createCenteredExtrude(fenderShape, {
    depth: 0.24,
    bevelEnabled: true,
    bevelThickness: 0.075,
    bevelSize: 0.055,
    bevelSegments: 5,
  });
  fenderGeo.rotateY(-Math.PI / 2);

  for (const sx of [-1, 1]) {
    const fender = new THREE.Mesh(fenderGeo, paintMat);
    fender.position.x = sx * 0.69;
    bodyGroup.add(fender);

    for (let g = 0; g < 3; g++) {
      const gill = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.14, 0.024),
        mats.chrome,
      );
      gill.position.set(sx * 0.89, 0.56, 0.76 - g * 0.075);
      gill.rotation.x = 0.22;
      bodyGroup.add(gill);
    }

    const spear = new THREE.Mesh(
      new THREE.BoxGeometry(0.025, 0.02, 1.15),
      mats.chrome,
    );
    spear.position.set(sx * 0.83, 0.58, -0.05);
    bodyGroup.add(spear);

    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.025, 0.11),
      mats.chrome,
    );
    handle.position.set(sx * 0.84, 0.63, -0.25);
    bodyGroup.add(handle);
  }

  const bulge = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.07, 0.92),
    paintMat,
  );
  bulge.position.set(0, 0.83, 1.1);
  bulge.rotation.x = 0.09;
  bodyGroup.add(bulge);

  const scoopTrim = new THREE.Mesh(
    new THREE.BoxGeometry(0.32, 0.04, 0.08),
    mats.chrome,
  );
  scoopTrim.position.set(0, 0.84, 1.56);
  bodyGroup.add(scoopTrim);

  const trunkHandle = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.025, 0.03),
    mats.chrome,
  );
  trunkHandle.position.set(0, 0.68, -1.96);
  bodyGroup.add(trunkHandle);

  registerExplodeTarget(rig, bodyGroup, [0, 0.42, 0]);
  tagInspectable(rig, bodyGroup, {
    id: 'classic-coachwork',
    title: 'El İşçiliği Alüminyum Gövde ve Çamurluk Izgaraları',
    category: 'Dış Tasarım',
    description:
      '1960’ların ikonik yuvarlak hatları, kaput hava kabartması ve yan çamurluklardaki krom soğutma ızgaraları.',
  });

  // 3. DÜZELTİLMİŞ OVAL KROM ÖN IZGARA VE TAMPONLAR (Burundan tam belirgin)
  const chromeGroup = new THREE.Group();
  root.add(chromeGroup);

  const grilleBacking = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.34, 0.06, 28),
    mats.grille,
  );
  grilleBacking.rotation.x = Math.PI / 2;
  grilleBacking.scale.set(1.36, 1, 0.54);
  grilleBacking.position.set(0, 0.42, 2.06);
  chromeGroup.add(grilleBacking);

  const grilleRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.35, 0.028, 16, 40),
    mats.chrome,
  );
  grilleRing.scale.set(1.38, 0.56, 1);
  grilleRing.position.set(0, 0.42, 2.09);
  chromeGroup.add(grilleRing);

  for (let i = -3; i <= 3; i++) {
    const slat = new THREE.Mesh(
      new THREE.BoxGeometry(0.016, 0.34, 0.03),
      mats.chrome,
    );
    slat.position.set(i * 0.11, 0.42, 2.09);
    chromeGroup.add(slat);
  }

  // Ön tampon (burun önünde temiz açıklık) ve arka tampon
  for (const sz of [1, -1]) {
    const bumperZ = sz > 0 ? 2.21 : -2.1;
    const wrapZ = sz > 0 ? 2.09 : -1.98;
    const bumperBar = new THREE.Mesh(
      new THREE.BoxGeometry(1.52, 0.075, 0.08),
      mats.chrome,
    );
    bumperBar.position.set(0, 0.3, bumperZ);
    chromeGroup.add(bumperBar);

    for (const sx of [-1, 1]) {
      const cornerWrap = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.075, 0.24),
        mats.chrome,
      );
      cornerWrap.position.set(sx * 0.78, 0.3, wrapZ);
      chromeGroup.add(cornerWrap);

      const overrider = new THREE.Mesh(
        new THREE.BoxGeometry(0.055, 0.18, 0.09),
        mats.chrome,
      );
      overrider.position.set(sx * 0.38, 0.33, bumperZ + sz * 0.03);
      chromeGroup.add(overrider);
    }
  }

  const mirrorStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.016, 0.12, 8),
    mats.chrome,
  );
  mirrorStem.position.set(-0.76, 0.83, 0.88);
  chromeGroup.add(mirrorStem);

  const mirrorBullet = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048, 0.022, 0.13, 16),
    mats.chrome,
  );
  mirrorBullet.rotation.x = Math.PI / 2;
  mirrorBullet.position.set(-0.76, 0.9, 0.88);
  chromeGroup.add(mirrorBullet);

  registerExplodeTarget(rig, chromeGroup, [0, 0.08, 0.32]);
  tagInspectable(rig, chromeGroup, {
    id: 'classic-chrome',
    title: 'Krom Oval Ön Izgara ve Tamponlar',
    category: 'Krom Detaylar',
    description:
      '7 dikey çıtalı oval krom ön panjur, tampon koruyucu babalar ve çamurluk üzeri mermi tipi krom ayna.',
  });

  // 4. Krom Ön Cam Çerçevesi ve Taba Deri Açık Kokpit
  const cockpitGroup = new THREE.Group();
  root.add(cockpitGroup);

  const windshield = new THREE.Mesh(
    new THREE.BoxGeometry(1.26, 0.36, 0.024),
    mats.glass,
  );
  windshield.position.set(0, 0.95, 0.44);
  windshield.rotation.x = -0.78;
  windshield.renderOrder = 4;
  cockpitGroup.add(windshield);

  const topFrame = new THREE.Mesh(
    new THREE.BoxGeometry(1.3, 0.032, 0.038),
    mats.chrome,
  );
  topFrame.position.set(0, 1.075, 0.31);
  cockpitGroup.add(topFrame);

  for (const sx of [-1, 1]) {
    const aPillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.035, 0.38, 0.038),
      mats.chrome,
    );
    aPillar.position.set(sx * 0.64, 0.95, 0.44);
    aPillar.rotation.x = -0.78;
    cockpitGroup.add(aPillar);

    const wiper = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.012, 0.012),
      mats.chrome,
    );
    wiper.position.set(sx * 0.25, 0.83, 0.56);
    wiper.rotation.z = 0.14;
    cockpitGroup.add(wiper);
  }

  const cabinFloor = new THREE.Mesh(
    new THREE.BoxGeometry(1.22, 0.08, 1.1),
    mats.leatherTan,
  );
  cabinFloor.position.set(0, 0.32, -0.04);
  cockpitGroup.add(cabinFloor);

  const tunnel = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.2, 1.02),
    mats.leatherTan,
  );
  tunnel.position.set(0, 0.43, -0.02);
  cockpitGroup.add(tunnel);

  for (const sx of [-1, 1]) {
    const cushion = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.12, 0.44),
      mats.leatherTan,
    );
    cushion.position.set(sx * 0.34, 0.4, -0.06);
    cockpitGroup.add(cushion);

    const backrest = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.46, 0.11),
      mats.leatherTan,
    );
    backrest.position.set(sx * 0.34, 0.63, -0.28);
    backrest.rotation.x = -0.22;
    cockpitGroup.add(backrest);

    const headrest = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.09, 0.14, 16),
      mats.leatherTan,
    );
    headrest.position.set(sx * 0.34, 0.9, -0.35);
    cockpitGroup.add(headrest);

    const rollHoop = new THREE.Mesh(
      new THREE.TorusGeometry(0.13, 0.022, 10, 20, Math.PI),
      mats.chrome,
    );
    rollHoop.position.set(sx * 0.34, 0.84, -0.45);
    cockpitGroup.add(rollHoop);
  }

  const woodDash = new THREE.Mesh(
    new THREE.BoxGeometry(1.24, 0.22, 0.18),
    mats.woodTrim,
  );
  woodDash.position.set(0, 0.72, 0.46);
  cockpitGroup.add(woodDash);

  const gaugePanel = new THREE.Mesh(
    new THREE.PlaneGeometry(1.06, 0.2),
    dashMat,
  );
  gaugePanel.position.set(0, 0.72, 0.365);
  gaugePanel.rotation.y = Math.PI;
  cockpitGroup.add(gaugePanel);

  const steerWheel = new THREE.Group();
  steerWheel.position.set(-0.34, 0.75, 0.22);
  steerWheel.rotation.x = -0.38;
  steerWheel.add(
    new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.018, 12, 28), mats.woodTrim),
  );
  const steerHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16),
    mats.chrome,
  );
  steerHub.rotation.x = Math.PI / 2;
  steerWheel.add(steerHub);
  for (let s = 0; s < 3; s++) {
    const spoke = new THREE.Mesh(
      new THREE.BoxGeometry(0.022, 0.145, 0.008),
      mats.brushedAlloy,
    );
    const a = (s * Math.PI * 2) / 3 + Math.PI / 6;
    spoke.position.set(Math.cos(a) * 0.072, Math.sin(a) * 0.072, 0);
    spoke.rotation.z = a - Math.PI / 2;
    steerWheel.add(spoke);
  }
  cockpitGroup.add(steerWheel);

  const shiftStick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.009, 0.012, 0.18, 8),
    mats.chrome,
  );
  shiftStick.position.set(0, 0.58, 0.16);
  shiftStick.rotation.x = 0.2;
  cockpitGroup.add(shiftStick);

  const shiftKnob = new THREE.Mesh(
    new THREE.SphereGeometry(0.028, 12, 12),
    mats.woodTrim,
  );
  shiftKnob.position.set(0, 0.67, 0.18);
  cockpitGroup.add(shiftKnob);

  registerExplodeTarget(rig, cockpitGroup, [0, 0.72, 0]);
  tagInspectable(rig, cockpitGroup, {
    id: 'classic-cockpit',
    title: 'Taba Deri Açık Kokpit ve Ceviz Ön Konsol',
    category: 'İç Mekan',
    description:
      'El dikişli taba deri koltuklar, ceviz ahşap kaplama 5 göstergeli ön panel, 3 kollu ahşap direksiyon ve krom vites kolu.',
  });

  // 5. DÜZELTİLMİŞ KROM YUVARLAK PROJEKTÖR FARLAR (Çamurluk önüne tam oturan kovan & lens)
  const lightsGroup = new THREE.Group();
  root.add(lightsGroup);

  for (const sx of [-1, 1]) {
    const lampPod = new THREE.Group();
    lampPod.position.set(sx * 0.68, 0.615, 1.98);
    lampPod.rotation.x = -0.05;
    lightsGroup.add(lampPod);

    // Çamurluğa gömülü krom far kovası (fender yüzeyinden öne net taşar)
    const bucket = new THREE.Mesh(
      new THREE.CylinderGeometry(0.118, 0.128, 0.18, 28),
      mats.chrome,
    );
    bucket.rotation.x = Math.PI / 2;
    bucket.position.set(0, 0, -0.02);
    lampPod.add(bucket);

    // Parlak krom çerçeve halkası
    const bezel = new THREE.Mesh(
      new THREE.TorusGeometry(0.115, 0.02, 14, 28),
      mats.chrome,
    );
    bezel.position.set(0, 0, 0.072);
    lampPod.add(bezel);

    // Koyu reflektör çanağı
    const reflector = new THREE.Mesh(
      new THREE.CircleGeometry(0.105, 24),
      mats.brushedAlloy,
    );
    reflector.position.set(0, 0, 0.068);
    lampPod.add(reflector);

    // Yuvarlak kristal projektör camı
    const lens = new THREE.Mesh(
      new THREE.SphereGeometry(0.104, 22, 14, 0, Math.PI * 2, 0, Math.PI / 2),
      headlightMat,
    );
    lens.rotation.x = Math.PI / 2;
    lens.position.set(0, 0, 0.066);
    lampPod.add(lens);

    // Kehribar ön sinyal lambası (tampon üstü çamurlukta net görünür)
    const blinkerBezel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.036, 0.04, 0.045, 16),
      mats.chrome,
    );
    blinkerBezel.rotation.x = Math.PI / 2;
    blinkerBezel.position.set(sx * 0.68, 0.43, 2.02);
    lightsGroup.add(blinkerBezel);

    const blinker = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 14, 12),
      mats.amberLight,
    );
    blinker.position.set(sx * 0.68, 0.43, 2.045);
    lightsGroup.add(blinker);

    const spot = new THREE.SpotLight(0xfff1d6, 0, 14, Math.PI / 6, 0.55, 1.6);
    spot.position.set(sx * 0.68, 0.61, 2.06);
    spot.target.position.set(sx * 0.68, 0.12, 7.5);
    lightsGroup.add(spot);
    lightsGroup.add(spot.target);
    rig.headlightSpots.push(spot);

    // Arka yuvarlak yakut stop lambaları
    for (let t = 0; t < 2; t++) {
      const tx = sx * (0.56 + t * 0.14);
      const tBezel = new THREE.Mesh(
        new THREE.TorusGeometry(0.048, 0.011, 10, 20),
        mats.chrome,
      );
      tBezel.position.set(tx, 0.56, -2.04);
      lightsGroup.add(tBezel);

      const tLens = new THREE.Mesh(
        new THREE.CylinderGeometry(0.044, 0.044, 0.025, 16),
        taillightMat,
      );
      tLens.rotation.x = Math.PI / 2;
      tLens.position.set(tx, 0.56, -2.04);
      lightsGroup.add(tLens);
    }
  }

  registerExplodeTarget(rig, lightsGroup, [0, 0.18, 0.25]);
  tagInspectable(rig, lightsGroup, {
    id: 'classic-lights',
    title: 'Krom Yuvarlak Projektör Farlar ve Yakut Stoplar',
    category: 'Aydınlatma',
    description:
      'Krom kovanlı klasik yuvarlak kristal farlar, kehribar sinyaller ve krom çerçeveli çift yuvarlak yakut arka stoplar.',
  });

  // 6. Beyaz Yanaklı Krom Tel Jantlar
  const wheelCoords: Array<{
    pos: [number, number, number];
    isRight: boolean;
  }> = [
    { pos: [0.76, 0.33, 1.3], isRight: true },
    { pos: [-0.76, 0.33, 1.3], isRight: false },
    { pos: [0.78, 0.33, -1.24], isRight: true },
    { pos: [-0.78, 0.33, -1.24], isRight: false },
  ];

  wheelCoords.forEach((wc) => {
    const wheel = buildDetailedWheel('classic', 0.33, 0.21, wc.isRight, mats);
    wheel.root.position.set(wc.pos[0], wc.pos[1], wc.pos[2]);
    root.add(wheel.root);
    rig.wheelSpinGroups.push(wheel.spinGroup);

    const sx = wc.isRight ? 0.42 : -0.42;
    registerExplodeTarget(rig, wheel.root, [sx, 0, 0]);
    tagInspectable(rig, wheel.root, {
      id: 'classic-wheels',
      title: 'Krom Tel Jantlar ve Beyaz Yanak Lastikler',
      category: 'Yürüyen Aksam',
      description:
        'Kelebek somunlu (knock-off) klasik krom tel jantlar ve nostaljik beyaz yanaklı grand tourer lastikleri.',
    });
  });

  enableShadows(root, true, true);
  contactShadow.castShadow = false;
  contactShadow.receiveShadow = false;

  return attachRigControls(rig);
}

// ============================================================================
// 9. MODEL 03: TERRA-X OVERLAND (EKSPEDİSYON 4X4 ARAZİ ARACI)
// ============================================================================

function buildOffroadInternal(
  mats: SharedCarMaterials,
  textures: CarTextureBundle,
): BuiltCarRig {
  const root = new THREE.Group();
  root.name = 'car-offroad';

  const defaultPaint =
    PAINT_PRESETS.find((p) => p.id === CAR_SPECS.offroad.defaultPaintId) ??
    PAINT_PRESETS[2];
  const paintMat = createPaintMaterial(defaultPaint);

  const headlightMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xf8fafc,
    emissiveIntensity: 0.85,
    roughness: 0.1,
    metalness: 0.15,
  });

  const taillightMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    emissive: 0xdc2626,
    emissiveIntensity: 0.7,
    roughness: 0.2,
    metalness: 0.1,
  });

  const dashMat = new THREE.MeshStandardMaterial({
    map: textures.dashOffroadMap,
    emissiveMap: textures.dashOffroadMap,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.35,
    roughness: 0.45,
  });

  const contactShadow = createContactShadow(textures.contactShadowMap, 2.75, 5.15);
  root.add(contactShadow);

  const rig: BuiltCarRig = {
    id: 'offroad',
    spec: CAR_SPECS.offroad,
    root,
    paintMaterials: [paintMat],
    headlightMaterials: [headlightMat],
    taillightMaterials: [taillightMat],
    dashMaterials: [dashMat],
    headlightSpots: [],
    wheelSpinGroups: [],
    explodedTargets: [],
    inspectableObjects: [],
    contactShadow,
    setPaint: () => {},
    setHeadlights: () => {},
    setExplode: () => {},
    spinWheels: () => {},
  };

  // 1. Merdiven Şasi, Süspansiyon ve Kaya Kaydırıcılar
  const chassisGroup = new THREE.Group();
  root.add(chassisGroup);

  for (const sx of [-1, 1]) {
    const rail = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.14, 4.1),
      mats.chassisSteel,
    );
    rail.position.set(sx * 0.48, 0.42, 0.02);
    chassisGroup.add(rail);

    const slider = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.06, 1.78),
      mats.matteTrim,
    );
    slider.position.set(sx * 0.94, 0.42, 0.02);
    chassisGroup.add(slider);
  }

  for (const az of [1.42, -1.36]) {
    const axle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 1.72, 12),
      mats.chassisSteel,
    );
    axle.rotation.z = Math.PI / 2;
    axle.position.set(0, 0.43, az);
    chassisGroup.add(axle);

    const diff = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 14, 12),
      mats.chassisSteel,
    );
    diff.position.set(0.08, 0.43, az);
    chassisGroup.add(diff);

    for (const sx of [-1, 1]) {
      const coil = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.36, 12),
        mats.caliperAmber,
      );
      coil.position.set(sx * 0.62, 0.62, az);
      coil.rotation.z = sx * 0.14;
      chassisGroup.add(coil);
    }
  }

  const skidPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.96, 0.04, 0.68),
    mats.brushedAlloy,
  );
  skidPlate.position.set(0, 0.36, 1.88);
  skidPlate.rotation.x = -0.45;
  chassisGroup.add(skidPlate);

  for (const sx of [-1, 1]) {
    const tip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.042, 0.22, 14),
      mats.exhaustTitanium,
    );
    tip.rotation.x = Math.PI / 2;
    tip.position.set(sx * 0.62, 0.4, -2.14);
    chassisGroup.add(tip);
  }

  const hitch = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.12, 0.18),
    mats.chassisSteel,
  );
  hitch.position.set(0, 0.44, -2.16);
  chassisGroup.add(hitch);

  registerExplodeTarget(rig, chassisGroup, [0, -0.35, 0]);
  tagInspectable(rig, chassisGroup, {
    id: 'offroad-suspension',
    title: 'Merdiven Şasi, Süspansiyon ve Koruma Plakası',
    category: 'Altyapı',
    description:
      'Yüksek yerden açıklıklı merdiven şasi, dört köşe coilover amortisörler, alüminyum karter koruma ve kaya kaydırıcı basamaklar.',
  });

  // 2. Kaslı Ekspedisyon Gövdesi, Çamurluk Korumaları ve Şnorkel
  const bodyGroup = new THREE.Group();
  root.add(bodyGroup);

  const bodyShape = new THREE.Shape();
  bodyShape.moveTo(-2.06, 0.48);
  bodyShape.lineTo(-2.06, 1.24);
  bodyShape.lineTo(-0.56, 1.26);
  bodyShape.lineTo(0.68, 1.24);
  bodyShape.lineTo(1.96, 1.18);
  bodyShape.lineTo(2.08, 0.94);
  bodyShape.lineTo(2.06, 0.56);
  bodyShape.lineTo(1.88, 0.52);
  bodyShape.absarc(1.42, 0.48, 0.52, -0.05, Math.PI + 0.05, false);
  bodyShape.lineTo(0.84, 0.48);
  bodyShape.lineTo(-0.78, 0.48);
  bodyShape.absarc(-1.36, 0.48, 0.52, -0.05, Math.PI + 0.05, false);
  bodyShape.lineTo(-1.92, 0.48);
  bodyShape.closePath();

  const bodyGeo = createCenteredExtrude(bodyShape, {
    depth: 1.72,
    bevelEnabled: true,
    bevelThickness: 0.07,
    bevelSize: 0.05,
    bevelSegments: 3,
  });
  bodyGeo.rotateY(-Math.PI / 2);
  bodyGroup.add(new THREE.Mesh(bodyGeo, paintMat));

  const roofFrameShape = new THREE.Shape();
  roofFrameShape.moveTo(-1.94, 1.22);
  roofFrameShape.lineTo(-1.86, 1.82);
  roofFrameShape.lineTo(0.36, 1.82);
  roofFrameShape.lineTo(0.76, 1.22);
  roofFrameShape.lineTo(0.58, 1.22);
  roofFrameShape.lineTo(0.24, 1.7);
  roofFrameShape.lineTo(-1.72, 1.7);
  roofFrameShape.lineTo(-1.78, 1.22);
  roofFrameShape.closePath();

  const roofFrameGeo = createCenteredExtrude(roofFrameShape, {
    depth: 1.62,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.03,
    bevelSegments: 2,
  });
  roofFrameGeo.rotateY(-Math.PI / 2);
  bodyGroup.add(new THREE.Mesh(roofFrameGeo, paintMat));

  const hoodPad = new THREE.Mesh(
    new THREE.BoxGeometry(0.92, 0.035, 0.96),
    mats.matteTrim,
  );
  hoodPad.position.set(0, 1.27, 1.34);
  hoodPad.rotation.x = 0.04;
  bodyGroup.add(hoodPad);

  const flareShape = new THREE.Shape();
  flareShape.moveTo(-0.58, 0);
  flareShape.lineTo(-0.42, 0.48);
  flareShape.lineTo(0.42, 0.48);
  flareShape.lineTo(0.58, 0);
  flareShape.lineTo(0.47, 0);
  flareShape.lineTo(0.35, 0.37);
  flareShape.lineTo(-0.35, 0.37);
  flareShape.lineTo(-0.47, 0);
  flareShape.closePath();

  const flareGeo = createCenteredExtrude(flareShape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
  });
  flareGeo.rotateY(-Math.PI / 2);

  for (const sx of [-1, 1]) {
    for (const az of [1.42, -1.36]) {
      const flare = new THREE.Mesh(flareGeo, mats.matteTrim);
      flare.position.set(sx * 0.95, 0.54, az);
      bodyGroup.add(flare);
    }

    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.04, 0.05),
      mats.matteTrim,
    );
    arm.position.set(sx * 0.92, 1.28, 0.66);
    bodyGroup.add(arm);

    const mirror = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.16, 0.11),
      mats.matteTrim,
    );
    mirror.position.set(sx * 1.0, 1.32, 0.65);
    bodyGroup.add(mirror);

    for (const dz of [0.22, -0.58]) {
      const handle = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.035, 0.13),
        mats.matteTrim,
      );
      handle.position.set(sx * 0.93, 1.04, dz);
      bodyGroup.add(handle);
    }
  }

  const snorkelCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.91, 1.05, 1.18),
    new THREE.Vector3(0.92, 1.25, 0.72),
    new THREE.Vector3(0.89, 1.72, 0.42),
    new THREE.Vector3(0.88, 1.84, 0.36),
  ]);
  const snorkel = new THREE.Mesh(
    new THREE.TubeGeometry(snorkelCurve, 20, 0.048, 10, false),
    mats.matteTrim,
  );
  bodyGroup.add(snorkel);

  const snorkelHead = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.11, 0.16),
    mats.matteTrim,
  );
  snorkelHead.position.set(0.88, 1.88, 0.36);
  bodyGroup.add(snorkelHead);

  const grilleBox = new THREE.Mesh(
    new THREE.BoxGeometry(1.16, 0.34, 0.08),
    mats.grille,
  );
  grilleBox.position.set(0, 0.94, 2.11);
  bodyGroup.add(grilleBox);

  registerExplodeTarget(rig, bodyGroup, [0, 0.42, 0]);
  tagInspectable(rig, bodyGroup, {
    id: 'offroad-body',
    title: 'Safari Şnorkel ve Çamurluk Korumaları',
    category: 'Dış Tasarım',
    description:
      'A-sütunu boyunca uzanan Safari şnorkel hava girişi, mat siyah yansıma önleyici kaput ve geniş çamurluk davlumbazları.',
  });

  // 3. Vinçli Çelik Tampon ve Tam Boy Stepne
  const armorGroup = new THREE.Group();
  root.add(armorGroup);

  const frontBumper = new THREE.Mesh(
    new THREE.BoxGeometry(1.86, 0.22, 0.24),
    mats.matteTrim,
  );
  frontBumper.position.set(0, 0.62, 2.18);
  armorGroup.add(frontBumper);

  const bullCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.56, 0.72, 2.24),
    new THREE.Vector3(-0.46, 1.08, 2.26),
    new THREE.Vector3(0.46, 1.08, 2.26),
    new THREE.Vector3(0.56, 0.72, 2.24),
  ]);
  armorGroup.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(bullCurve, 24, 0.028, 10, false),
      mats.matteTrim,
    ),
  );

  const winchDrum = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.065, 0.34, 16),
    mats.brushedAlloy,
  );
  winchDrum.rotation.z = Math.PI / 2;
  winchDrum.position.set(0, 0.71, 2.24);
  armorGroup.add(winchDrum);

  for (const sx of [-1, 1]) {
    const shackle = new THREE.Mesh(
      new THREE.TorusGeometry(0.045, 0.015, 8, 16),
      mats.caliperRed,
    );
    shackle.position.set(sx * 0.44, 0.58, 2.31);
    armorGroup.add(shackle);
  }

  const rearBumper = new THREE.Mesh(
    new THREE.BoxGeometry(1.88, 0.2, 0.2),
    mats.matteTrim,
  );
  rearBumper.position.set(0, 0.6, -2.16);
  armorGroup.add(rearBumper);

  const spare = buildDetailedWheel('offroad', 0.41, 0.28, false, mats);
  spare.root.rotation.y = Math.PI / 2;
  spare.root.position.set(0, 1.06, -2.26);
  armorGroup.add(spare.root);

  registerExplodeTarget(rig, armorGroup, [0, 0.06, 0.35]);
  tagInspectable(rig, armorGroup, {
    id: 'offroad-armor',
    title: 'Vinçli Çelik Tampon ve Tam Boy Stepne',
    category: 'Kurtarma Ekipmanı',
    description:
      'Ön boru koruma demiri, entegre elektrikli vinç tamburu, kırmızı çeki kancaları ve bagaj kapağına monteli tam boy yedek tekerlek.',
  });

  // 4. Ekspedisyon Tavan Sepeti, LED Bar ve Kurtarma Paletleri
  const rackGroup = new THREE.Group();
  root.add(rackGroup);

  for (const sx of [-1, 1]) {
    const sideRail = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.08, 2.15),
      mats.matteTrim,
    );
    sideRail.position.set(sx * 0.68, 1.9, -0.74);
    rackGroup.add(sideRail);
  }
  for (let z = -1.72; z <= 0.22; z += 0.39) {
    const crossbar = new THREE.Mesh(
      new THREE.BoxGeometry(1.38, 0.035, 0.055),
      mats.matteTrim,
    );
    crossbar.position.set(0, 1.88, z);
    rackGroup.add(crossbar);
  }

  const lightBarHousing = new THREE.Mesh(
    new THREE.BoxGeometry(1.22, 0.075, 0.09),
    mats.matteTrim,
  );
  lightBarHousing.position.set(0, 1.92, 0.38);
  rackGroup.add(lightBarHousing);

  const lightBarLens = new THREE.Mesh(
    new THREE.BoxGeometry(1.14, 0.048, 0.03),
    headlightMat,
  );
  lightBarLens.position.set(0, 1.92, 0.428);
  rackGroup.add(lightBarLens);

  for (let b = 0; b < 2; b++) {
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(0.038, 0.26, 0.94),
      mats.orangeTraction,
    );
    board.position.set(-0.75 - b * 0.035, 1.92, -0.92);
    rackGroup.add(board);
  }

  const awning = new THREE.Mesh(
    new THREE.BoxGeometry(0.11, 0.12, 1.95),
    mats.chassisSteel,
  );
  awning.position.set(0.76, 1.91, -0.76);
  rackGroup.add(awning);

  registerExplodeTarget(rig, rackGroup, [0, 0.95, 0]);
  tagInspectable(rig, rackGroup, {
    id: 'offroad-rack',
    title: 'Ekspedisyon Tavan Sepeti ve Kurtarma Paletleri',
    category: 'Keşif Donanımı',
    description:
      'Çelik tavan sepeti, yüksek güçlü tavan LED ışık barı, yan tente tüpü ve çamur/kum kurtarma paletleri.',
  });

  // 5. Füme Cam Kabin ve Arazi İç Mekanı
  const cabinGroup = new THREE.Group();
  root.add(cabinGroup);

  const windshield = new THREE.Mesh(
    new THREE.BoxGeometry(1.48, 0.58, 0.03),
    mats.glass,
  );
  windshield.position.set(0, 1.5, 0.56);
  windshield.rotation.x = -0.58;
  windshield.renderOrder = 4;
  cabinGroup.add(windshield);

  const sideWindows = new THREE.Mesh(
    new THREE.BoxGeometry(1.56, 0.46, 2.04),
    mats.glass,
  );
  sideWindows.position.set(0, 1.48, -0.74);
  sideWindows.renderOrder = 4;
  cabinGroup.add(sideWindows);

  for (const sx of [-1, 1]) {
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(0.46, 0.14, 0.48),
      mats.leatherDark,
    );
    base.position.set(sx * 0.4, 0.92, -0.05);
    cabinGroup.add(base);

    const back = new THREE.Mesh(
      new THREE.BoxGeometry(0.44, 0.58, 0.13),
      mats.leatherDark,
    );
    back.position.set(sx * 0.4, 1.24, -0.27);
    back.rotation.x = -0.15;
    cabinGroup.add(back);
  }

  const dash = new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.28, 0.36), dashMat);
  dash.position.set(0, 1.12, 0.56);
  cabinGroup.add(dash);

  const steer = new THREE.Mesh(
    new THREE.TorusGeometry(0.15, 0.02, 10, 22),
    mats.leatherDark,
  );
  steer.position.set(-0.4, 1.18, 0.32);
  steer.rotation.x = -0.32;
  cabinGroup.add(steer);

  registerExplodeTarget(rig, cabinGroup, [0, 0.58, 0.05]);

  // 6. Kare Halo LED Farlar, Izgara İşaretleri ve Stoplar
  const lightsGroup = new THREE.Group();
  root.add(lightsGroup);

  for (const sx of [-1, 1]) {
    const hlHousing = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.2, 0.09),
      mats.matteTrim,
    );
    hlHousing.position.set(sx * 0.72, 0.95, 2.1);
    lightsGroup.add(hlHousing);

    const hlRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.068, 0.015, 8, 20),
      headlightMat,
    );
    hlRing.position.set(sx * 0.72, 0.95, 2.15);
    lightsGroup.add(hlRing);

    const spot = new THREE.SpotLight(0xf8fafc, 0, 15, Math.PI / 5.5, 0.5, 1.5);
    spot.position.set(sx * 0.72, 0.95, 2.2);
    spot.target.position.set(sx * 0.72, 0.15, 8.0);
    lightsGroup.add(spot);
    lightsGroup.add(spot.target);
    rig.headlightSpots.push(spot);

    const tail = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.34, 0.06),
      taillightMat,
    );
    tail.position.set(sx * 0.78, 0.96, -2.12);
    lightsGroup.add(tail);
  }

  for (let i = -1; i <= 1; i++) {
    const marker = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, 0.025, 0.03),
      mats.amberLight,
    );
    marker.position.set(i * 0.22, 1.08, 2.15);
    lightsGroup.add(marker);
  }

  registerExplodeTarget(rig, lightsGroup, [0, 0.14, 0.28]);

  // 7. 35" Mud-Terrain Beadlock Jantlar
  const wheelCoords: Array<{
    pos: [number, number, number];
    isRight: boolean;
  }> = [
    { pos: [0.92, 0.43, 1.42], isRight: true },
    { pos: [-0.92, 0.43, 1.42], isRight: false },
    { pos: [0.92, 0.43, -1.36], isRight: true },
    { pos: [-0.92, 0.43, -1.36], isRight: false },
  ];

  wheelCoords.forEach((wc) => {
    const wheel = buildDetailedWheel('offroad', 0.43, 0.3, wc.isRight, mats);
    wheel.root.position.set(wc.pos[0], wc.pos[1], wc.pos[2]);
    root.add(wheel.root);
    rig.wheelSpinGroups.push(wheel.spinGroup);

    const sx = wc.isRight ? 0.48 : -0.48;
    registerExplodeTarget(rig, wheel.root, [sx, 0, 0]);
    tagInspectable(rig, wheel.root, {
      id: 'offroad-wheels',
      title: '35 İnç Mud-Terrain Lastikler ve Beadlock Jant',
      category: 'Yürüyen Aksam',
      description:
        'Derin omuz dişli çamur/arazi lastikleri, 16 cıvatalı beadlock jant çemberi ve turuncu kaliperli disk frenler.',
    });
  });

  enableShadows(root, true, true);
  contactShadow.castShadow = false;
  contactShadow.receiveShadow = false;

  return attachRigControls(rig);
}

// ============================================================================
// 10. ANA FABRİKA FONKSİYONU (TEK YERDEN TÜM ARAÇLARA ERİŞİM)
// ============================================================================

export function createCarsPack(options: CarsPackOptions = {}): CarsPack {
  const anisotropy = options.anisotropy ?? 8;
  const isSoftwareGl = options.isSoftwareGl ?? false;

  const textures = createCarTextureBundle(anisotropy);
  const mats = createSharedMaterials(textures, isSoftwareGl);

  const buildCar = (id: CarModelId): BuiltCarRig => {
    if (id === 'supercar') return buildSupercarInternal(mats, textures);
    if (id === 'classic') return buildClassicInternal(mats, textures);
    return buildOffroadInternal(mats, textures);
  };

  const buildAll = (): Record<CarModelId, BuiltCarRig> => ({
    supercar: buildCar('supercar'),
    classic: buildCar('classic'),
    offroad: buildCar('offroad'),
  });

  return {
    specs: CAR_SPECS,
    order: CAR_ORDER,
    paints: PAINT_PRESETS,
    buildCar,
    buildAll,
    dispose: () => {
      mats.dispose();
      textures.dispose();
    },
  };
}
