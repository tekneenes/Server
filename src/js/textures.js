import * as THREE from 'three';

let maxAnisotropy = 4;
const textureCache = new Map();

export function setMaxAnisotropy(value) {
  maxAnisotropy = Math.min(4, Math.max(1, value || 1));
}

function getCachedTexture(key, builder) {
  const cached = textureCache.get(key);
  if (cached) return cached;
  const tex = builder();
  textureCache.set(key, tex);
  return tex;
}

export function clearTextureCache() {
  textureCache.forEach((tex) => tex.dispose());
  textureCache.clear();
}

function finalizeTexture(canvas, { srgb = true, repeatX = 1, repeatY = 1 } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAnisotropy;
  if (srgb) {
    tex.colorSpace = THREE.SRGBColorSpace;
  }
  tex.needsUpdate = true;
  return tex;
}

export function createRaisedFloorTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(0, 0, size, size);

  const cells = 4;
  const step = size / cells;

  for (let gx = 0; gx < cells; gx++) {
    for (let gy = 0; gy < cells; gy++) {
      const x = gx * step;
      const y = gy * step;
      const shade = (gx + gy) % 2 === 0 ? '#cfd8e3' : '#c6d0dc';
      ctx.fillStyle = shade;
      ctx.fillRect(x + 2, y + 2, step - 4, step - 4);

      // Anti-static micro-speckle
      ctx.fillStyle = 'rgba(71, 85, 105, 0.16)';
      for (let s = 0; s < 18; s++) {
        const sx = x + 6 + ((s * 37 + gx * 19) % (step - 12));
        const sy = y + 6 + ((s * 53 + gy * 23) % (step - 12));
        ctx.fillRect(sx, sy, 2, 2);
      }

      // Corner screw fasteners
      ctx.fillStyle = '#64748b';
      ctx.fillRect(x + 5, y + 5, 3, 3);
      ctx.fillRect(x + step - 8, y + 5, 3, 3);
      ctx.fillRect(x + 5, y + step - 8, 3, 3);
      ctx.fillRect(x + step - 8, y + step - 8, 3, 3);
    }
  }

  // Tile seams
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  for (let i = 0; i <= cells; i++) {
    const p = i * step;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  return finalizeTexture(canvas, { srgb: true, repeatX: 7, repeatY: 8 });
}

export function createPerforatedTileTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(0, 0, size, size);

  const cells = 2;
  const step = size / cells;

  for (let gx = 0; gx < cells; gx++) {
    for (let gy = 0; gy < cells; gy++) {
      const ox = gx * step;
      const oy = gy * step;
      ctx.fillStyle = '#b0bec5';
      ctx.fillRect(ox + 3, oy + 3, step - 6, step - 6);

      // Airflow perforations
      ctx.fillStyle = '#1e293b';
      for (let px = 14; px < step - 12; px += 10) {
        for (let py = 14; py < step - 12; py += 10) {
          ctx.fillRect(ox + px, oy + py, 5, 5);
        }
      }
    }
  }

  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, size, size);
  ctx.beginPath();
  ctx.moveTo(step, 0);
  ctx.lineTo(step, size);
  ctx.moveTo(0, step);
  ctx.lineTo(size, step);
  ctx.stroke();

  return finalizeTexture(canvas, { srgb: true, repeatX: 7, repeatY: 2 });
}

export function createConcreteFacadeTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#b9c2cc';
  ctx.fillRect(0, 0, size, size);

  // Subtle architectural concrete grain
  for (let i = 0; i < 1600; i++) {
    const x = (i * 73) % size;
    const y = (i * 139) % size;
    const v = 175 + ((i * 29) % 24);
    ctx.fillStyle = `rgba(${v}, ${v + 3}, ${v + 6}, 0.25)`;
    ctx.fillRect(x, y, 3, 2);
  }

  // Precast panel seams
  ctx.strokeStyle = '#7c8794';
  ctx.lineWidth = 3;
  for (let y = 0; y <= size; y += 128) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }
  for (let x = 0; x <= size; x += 256) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }

  return finalizeTexture(canvas, { srgb: true, repeatX: 4, repeatY: 2 });
}

export function createAsphaltTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#2a313b';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 3200; i++) {
    const x = (i * 97) % size;
    const y = (i * 53) % size;
    const lum = 32 + ((i * 17) % 28);
    ctx.fillStyle = `rgb(${lum}, ${lum + 3}, ${lum + 7})`;
    ctx.fillRect(x, y, 2, 2);
  }

  return finalizeTexture(canvas, { srgb: true, repeatX: 12, repeatY: 12 });
}

export function createGrassTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#3b5741';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 2400; i++) {
    const x = (i * 89) % size;
    const y = (i * 149) % size;
    const g = 75 + ((i * 19) % 30);
    ctx.fillStyle = `rgba(${g - 24}, ${g + 12}, ${g - 22}, 0.45)`;
    ctx.fillRect(x, y, 3, 4);
  }

  return finalizeTexture(canvas, { srgb: true, repeatX: 28, repeatY: 28 });
}

export function createServerRackFrontTexture(rackNumber = 1, variant = 0) {
  const w = 256;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  // Dark anodized cabinet frame
  ctx.fillStyle = '#11161d';
  ctx.fillRect(0, 0, w, h);

  // Outer frame bezel
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, w - 8, h - 8);

  // Top rack ID header plate
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(14, 14, w - 28, 28);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`RACK-${String(rackNumber).padStart(2, '0')} · 42U`, 22, 33);

  // Server blade bays (1U / 2U / switch units)
  let y = 52;
  let slot = 0;
  while (y < h - 22) {
    const isSwitch = slot === 1 || slot === 14;
    const unitH = isSwitch ? 18 : slot % 4 === 0 ? 28 : 20;
    if (y + unitH > h - 14) break;

    // Server chassis body
    ctx.fillStyle = isSwitch ? '#1e293b' : '#18202c';
    ctx.fillRect(16, y, w - 32, unitH - 3);
    ctx.strokeStyle = '#293548';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, y, w - 32, unitH - 3);

    // Perforated drive bays / cooling grill
    ctx.fillStyle = '#0c1118';
    for (let bx = 22; bx < w - 74; bx += 14) {
      ctx.fillRect(bx, y + 4, 10, unitH - 11);
    }

    // Status LEDs (cool cyan/green + occasional amber activity)
    const seed = (rackNumber * 13 + slot * 7 + variant * 5) % 11;
    ctx.fillStyle = isSwitch ? '#38bdf8' : '#22c55e';
    ctx.fillRect(w - 58, y + 6, 6, 4);

    ctx.fillStyle = seed === 0 ? '#f59e0b' : '#38bdf8';
    ctx.fillRect(w - 46, y + 6, 12, 4);

    if (isSwitch) {
      // Patch port row
      ctx.fillStyle = '#eab308';
      for (let px = 24; px < w - 70; px += 8) {
        ctx.fillRect(px, y + 5, 4, 6);
      }
    }

    y += unitH;
    slot++;
  }

  return finalizeTexture(canvas, { srgb: true });
}

export function createCityFacadeTexture(tintHex = '#64748b', windowGlow = '#93c5fd') {
  return getCachedTexture(`city:${tintHex}:${windowGlow}`, () => {
    const w = 256;
    const h = 512;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = tintHex;
    ctx.fillRect(0, 0, w, h);

    const cols = 6;
    const rows = 14;
    const padX = 10;
    const padY = 12;
    const cellW = (w - padX * 2) / cols;
    const cellH = (h - padY * 2) / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = padX + c * cellW + 4;
        const wy = padY + r * cellH + 5;
        const lit = (r * 7 + c * 11) % 5 === 0;
        ctx.fillStyle = lit ? windowGlow : '#1e293b';
        ctx.fillRect(wx, wy, cellW - 8, cellH - 10);

        // Mullion highlight
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(wx, wy, cellW - 8, 2);
      }
    }

    return finalizeTexture(canvas, { srgb: true, repeatX: 1, repeatY: 1 });
  });
}

export function createSignTexture(title, subtitle, accentColor = '#38bdf8') {
  return getCachedTexture(`sign:${title}|${subtitle}|${accentColor}`, () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 128);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 504, 120);

    ctx.fillStyle = accentColor;
    ctx.fillRect(18, 22, 8, 84);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(title, 42, 60);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px monospace';
    ctx.fillText(subtitle, 42, 95);

    return finalizeTexture(canvas, { srgb: true });
  });
}

export function createUpsPanelTexture(label = 'UPS-01 · 500 kVA') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#2b3647';
  ctx.fillRect(0, 0, 512, 512);

  // Double door perimeter & center seam
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 496, 496);
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(256, 8);
  ctx.lineTo(256, 504);
  ctx.stroke();

  // Top Header Nameplate
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(26, 24, 460, 48);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(26, 24, 12, 48);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 26px monospace';
  ctx.fillText(label, 52, 57);

  // Left Door: LCD Touchscreen + Power Flow Mimic Diagram
  ctx.fillStyle = '#082f49';
  ctx.fillRect(36, 94, 200, 146);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 94, 200, 146);

  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('ONLINE ÇİFT ÇEVRİM', 46, 122);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('GİRİŞ: 400V / 50Hz', 46, 152);
  ctx.fillText('YÜK  : %64 (320 kW)', 46, 178);
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('DC BARA: 480V %100', 46, 204);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(46, 218, 176, 10);

  // Right Door: Rotary Maintenance Bypass & Breakers
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(276, 94, 200, 146);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('BAKIM BYPASS ŞALTER', 292, 122);
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(298, 144, 52, 24);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('NORMAL', 302, 160);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(374, 144, 72, 24);
  ctx.fillStyle = '#f8fafc';
  ctx.fillText('ACİL KES', 382, 160);

  // Modular Rectifier / Inverter Cooling Louvers
  ctx.fillStyle = '#141c26';
  for (let y = 264; y < 448; y += 18) {
    ctx.fillRect(36, y, 198, 9);
    ctx.fillRect(278, y, 198, 9);
  }

  // Bottom Yellow 400V Hazard Strip
  ctx.fillStyle = '#eab308';
  ctx.fillRect(36, 466, 440, 20);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('⚡ DİKKAT: 400V AC / 480V DC YÜKSEK GERİLİM', 72, 481);

  return finalizeTexture(canvas, { srgb: true });
}

export function createNocWallScreenManager() {
  const canvas = document.createElement('canvas');
  canvas.width = 1536;
  canvas.height = 448;
  const ctx = canvas.getContext('2d');

  // Pre-render all static frames, titles, labels & CCTV boxes once to avoid full-canvas redraws every 0.5s
  const staticCanvas = document.createElement('canvas');
  staticCanvas.width = 1536;
  staticCanvas.height = 448;
  const sctx = staticCanvas.getContext('2d');

  const panels = [
    { x: 14, w: 364, title: 'SOĞUTMA & PUE İZLEME', accent: '#38bdf8' },
    { x: 394, w: 374, title: 'SUNUCU SALONU TOPOLOJİ', accent: '#10b981' },
    { x: 784, w: 364, title: 'GÜÇ DAĞILIM & UPS', accent: '#4ade80' },
    { x: 1164, w: 358, title: 'GÜVENLİK · CCTV · VESDA', accent: '#f59e0b' },
  ];

  sctx.fillStyle = '#060c15';
  sctx.fillRect(0, 0, 1536, 448);

  panels.forEach((p, idx) => {
    sctx.fillStyle = '#0d1626';
    sctx.fillRect(p.x, 14, p.w, 420);
    sctx.strokeStyle = '#1e293b';
    sctx.lineWidth = 2;
    sctx.strokeRect(p.x, 14, p.w, 420);

    sctx.fillStyle = '#162235';
    sctx.fillRect(p.x, 14, p.w, 38);
    sctx.fillStyle = p.accent;
    sctx.fillRect(p.x, 14, 6, 38);
    sctx.fillStyle = '#f1f5f9';
    sctx.font = 'bold 16px monospace';
    sctx.fillText(p.title, p.x + 16, 39);

    if (idx === 0) {
      sctx.fillStyle = '#94a3b8';
      sctx.font = '15px monospace';
      sctx.fillText('SOĞUK KORİDOR A : 20.4°C', p.x + 20, 150);
      sctx.fillText('SOĞUK KORİDOR B : 20.8°C', p.x + 20, 178);
      sctx.fillText('SICAK KORİDOR   : 33.2°C', p.x + 20, 206);
      sctx.fillText('CHILLER #1-#3   : AKTİF (%68)', p.x + 20, 234);

      sctx.fillStyle = '#09111e';
      sctx.fillRect(p.x + 18, 258, 326, 154);
      sctx.strokeStyle = '#1e293b';
      sctx.strokeRect(p.x + 18, 258, 326, 154);
    } else if (idx === 1) {
      sctx.fillStyle = '#94a3b8';
      sctx.font = '14px monospace';
      sctx.fillText('24 KABİN + NOC-IDF-01 · ÇEVRİMİÇİ', p.x + 18, 82);
    } else if (idx === 2) {
      sctx.fillStyle = '#4ade80';
      sctx.font = 'bold 38px monospace';
      sctx.fillText('1.42 MW', p.x + 20, 106);
      sctx.fillStyle = '#94a3b8';
      sctx.font = '15px monospace';
      sctx.fillText('UPS-01..03 : NORMAL (N+1)', p.x + 20, 146);
      sctx.fillText('AKÜ OTONOMİ: 15 DK · %100', p.x + 20, 174);
      sctx.fillText('JENERATÖR  : HAZIR BEKLEME', p.x + 20, 202);

      const barLabels = ['FEED A', 'FEED B', 'CHILLER', 'UPS BUS'];
      barLabels.forEach((label, bi) => {
        const by = 236 + bi * 44;
        sctx.fillStyle = '#cbd5e1';
        sctx.font = '12px monospace';
        sctx.fillText(label, p.x + 20, by + 16);
      });
    } else {
      sctx.fillStyle = '#4ade80';
      sctx.font = 'bold 18px monospace';
      sctx.fillText('VESDA ERKEN ALGILAMA: TEMİZ', p.x + 18, 86);
      sctx.fillStyle = '#38bdf8';
      sctx.font = '14px monospace';
      sctx.fillText('FM-200: 42 BAR · MANTRAP KİLİTLİ', p.x + 18, 114);

      const cams = ['CAM-01 GİRİŞ', 'CAM-02 KORİDOR A', 'CAM-03 KORİDOR B', 'CAM-04 UPS'];
      cams.forEach((cam, ci) => {
        const cx = p.x + 18 + (ci % 2) * 164;
        const cy = 136 + Math.floor(ci / 2) * 116;
        sctx.fillStyle = '#09111d';
        sctx.fillRect(cx, cy, 154, 102);
        sctx.strokeStyle = '#334155';
        sctx.strokeRect(cx, cy, 154, 102);
        sctx.strokeStyle = '#1e3a5f';
        sctx.strokeRect(cx + 18, cy + 28, 118, 56);
        sctx.fillStyle = '#22c55e';
        sctx.fillRect(cx + 8, cy + 10, 7, 7);
        sctx.fillStyle = '#cbd5e1';
        sctx.font = '11px monospace';
        sctx.fillText(cam, cx + 20, cy + 18);
      });

      sctx.fillStyle = '#0f172a';
      sctx.fillRect(p.x + 18, 378, 320, 40);
      sctx.fillStyle = '#4ade80';
      sctx.font = 'bold 14px monospace';
      sctx.fillText('AKTİF KRİTİK ALARM: 0  ·  SLA %99.995', p.x + 28, 403);
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const dynBars = [
    { val: 0.68, col: '#ef4444' },
    { val: 0.72, col: '#3b82f6' },
    { val: 0.61, col: '#38bdf8' },
    { val: 0.66, col: '#22c55e' },
  ];

  function draw(phase = 0) {
    ctx.drawImage(staticCanvas, 0, 0);

    // Panel 0 dynamic PUE readout + live airflow trend
    const p0x = panels[0].x;
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 42px monospace';
    const pue = (1.23 + Math.sin(phase * 0.4) * 0.01).toFixed(2);
    ctx.fillText(`PUE ${pue}`, p0x + 20, 108);

    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let gx = 0; gx < 310; gx += 6) {
      const gy = 336 + Math.sin(gx * 0.04 + phase * 1.5) * 32 + Math.cos(gx * 0.09) * 12;
      if (gx === 0) ctx.moveTo(p0x + 26 + gx, gy);
      else ctx.lineTo(p0x + 26 + gx, gy);
    }
    ctx.stroke();

    // Panel 1 dynamic rack load grid
    const p1x = panels[1].x;
    ctx.font = 'bold 11px monospace';
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        const rx = p1x + 22 + col * 56;
        const ry = 104 + row * 74;
        const load = 0.55 + 0.35 * Math.sin(phase * 0.8 + row * 1.7 + col * 0.9);
        ctx.fillStyle = col === 0 ? '#0284c7' : col === 5 ? '#d97706' : load > 0.84 ? '#0ea5e9' : '#10b981';
        ctx.fillRect(rx, ry, 46, 56);
        ctx.fillStyle = '#0b1120';
        ctx.fillRect(rx + 5, ry + 7, 36, 14);
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(`R${row * 6 + col + 1}`, rx + 10, ry + 42);
      }
    }

    // Panel 2 dynamic load bars
    const p2x = panels[2].x;
    for (let bi = 0; bi < dynBars.length; bi++) {
      const b = dynBars[bi];
      const by = 236 + bi * 44;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(p2x + 88, by, 254, 22);
      ctx.fillStyle = b.col;
      const jitter = Math.sin(phase + bi) * 0.03;
      ctx.fillRect(p2x + 88, by, Math.round(254 * (b.val + jitter)), 22);
    }

    texture.needsUpdate = true;
  }

  draw(0);
  return { texture, update: draw };
}

export function createCracPanelTexture(index = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Powder-coated industrial cabinet shell
  ctx.fillStyle = '#dde4ec';
  ctx.fillRect(0, 0, 512, 512);

  // Outer door perimeter seam & split double door center seam
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 4;
  ctx.strokeRect(14, 14, 484, 484);
  ctx.beginPath();
  ctx.moveTo(256, 14);
  ctx.lineTo(256, 498);
  ctx.stroke();

  // Top Header Nameplate
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(28, 28, 456, 44);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(28, 28, 10, 44);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 24px monospace';
  ctx.fillText(`CRAH-0${index} · HASSAS KLİMA`, 48, 58);

  // Return air upper louvers
  ctx.fillStyle = '#334155';
  for (let y = 94; y < 178; y += 14) {
    ctx.fillRect(36, y, 200, 7);
    ctx.fillRect(276, y, 200, 7);
  }

  // Left door HMI Touchscreen Display
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(46, 206, 176, 130);
  ctx.fillStyle = '#082f49';
  ctx.fillRect(54, 214, 160, 114);
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 3;
  ctx.strokeRect(54, 214, 160, 114);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 17px monospace';
  ctx.fillText('ÜFLEME: 18.5°C', 64, 242);
  ctx.fillStyle = '#4ade80';
  ctx.fillText('DÖNÜŞ : 31.4°C', 64, 268);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '14px monospace';
  ctx.fillText('EC FAN: %68 AKTİF', 64, 294);
  ctx.fillText('VANA  : %74 AÇIK', 64, 316);

  // Right door airflow schematic & emergency disconnect dial
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(290, 214, 170, 114);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('SOĞUK HAVA', 318, 246);
  ctx.fillText('YÜKSELTİLMİŞ', 312, 272);
  ctx.fillText('DÖŞEME ALTI', 314, 296);

  // Bottom discharge louver grille
  ctx.fillStyle = '#1e293b';
  for (let y = 370; y < 462; y += 14) {
    ctx.fillRect(36, y, 440, 8);
  }

  return finalizeTexture(canvas, { srgb: true });
}

export function createFireCylinderLabelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(0, 0, 256, 256);

  // White/yellow hazard technical placard wrapped around cylinder
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(20, 68, 216, 116);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(20, 68, 216, 24);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('FM-200 / NOVEC 1230', 34, 86);

  ctx.font = 'bold 20px monospace';
  ctx.fillText('GAZLI SÖNDÜRME', 34, 118);
  ctx.font = 'bold 15px monospace';
  ctx.fillText('BASINÇ: 42 BAR', 34, 144);
  ctx.fillStyle = '#b91c1c';
  ctx.fillText('OTOMATİK AKTİF', 34, 168);

  return finalizeTexture(canvas, { srgb: true });
}

export function createFireControlPanelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#991b1b';
  ctx.fillRect(0, 0, 256, 320);
  ctx.strokeStyle = '#fca5a5';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, 240, 304);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('YANGIN KONTROL', 34, 46);
  ctx.font = '14px monospace';
  ctx.fillText('VESDA + FM-200', 54, 70);

  ctx.fillStyle = '#090d14';
  ctx.fillRect(28, 92, 200, 90);
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('SİSTEM HAZIR', 56, 126);
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('OTOMATİK MOD', 56, 156);

  ctx.fillStyle = '#eab308';
  ctx.fillRect(46, 214, 164, 54);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('MANUEL BOŞALTMA', 52, 246);

  return finalizeTexture(canvas, { srgb: true });
}

export function createHazardStripeTexture() {
  return getCachedTexture('hazardStripe', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 22;
    for (let i = -256; i < 512; i += 52) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 256, 256);
      ctx.stroke();
    }

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(24, 24, 208, 208);

    return finalizeTexture(canvas, { srgb: true });
  });
}

export function createNocFloorTexture() {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1b2432';
  ctx.fillRect(0, 0, size, size);

  const cells = 4;
  const step = size / cells;
  for (let gx = 0; gx < cells; gx++) {
    for (let gy = 0; gy < cells; gy++) {
      const x = gx * step;
      const y = gy * step;
      ctx.fillStyle = (gx + gy) % 2 === 0 ? '#1f2937' : '#192230';
      ctx.fillRect(x + 2, y + 2, step - 4, step - 4);

      // Anti-static acoustic carpet weave micro-lines
      ctx.fillStyle = 'rgba(148, 163, 184, 0.08)';
      for (let i = 6; i < step - 6; i += 8) {
        ctx.fillRect(x + 6, y + i, step - 12, 1);
      }
    }
  }

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  for (let i = 0; i <= cells; i++) {
    const p = i * step;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  return finalizeTexture(canvas, { srgb: true, repeatX: 5, repeatY: 5 });
}

export function createOperatorMonitorTexture(variant = 0) {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#08101c';
  ctx.fillRect(0, 0, 320, 192);

  // Top title bar
  ctx.fillStyle = '#0f1c2e';
  ctx.fillRect(0, 0, 320, 24);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(0, 0, 5, 24);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 11px monospace';

  if (variant === 0) {
    // Grafana-style Network & Latency Graph
    ctx.fillText('GRAFANA · OMURGA TRAFİK 400GbE', 12, 16);

    ctx.fillStyle = '#0c1829';
    ctx.fillRect(10, 32, 300, 90);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x < 290; x += 10) {
      const y = 78 + Math.sin(x * 0.07) * 20 + Math.cos(x * 0.14) * 9;
      if (x === 0) ctx.moveTo(15 + x, y);
      else ctx.lineTo(15 + x, y);
    }
    ctx.stroke();

    ctx.strokeStyle = '#22c55e';
    ctx.beginPath();
    for (let x = 0; x < 290; x += 10) {
      const y = 96 + Math.cos(x * 0.05) * 14;
      if (x === 0) ctx.moveTo(15 + x, y);
      else ctx.lineTo(15 + x, y);
    }
    ctx.stroke();

    // Mini metric tiles
    const kpis = ['GECİKME: 0.4ms', 'KAYIP: %0.00', 'BGP: KURULU'];
    kpis.forEach((k, i) => {
      ctx.fillStyle = '#111f33';
      ctx.fillRect(10 + i * 101, 132, 96, 48);
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(k, 16 + i * 101, 160);
    });
  } else if (variant === 1) {
    // SSH Terminal / Syslog Stream
    ctx.fillText('SSH · NOC-IDF-01 CORE SHELL', 12, 16);
    const lines = [
      ['# show bgp evpn summary', '#38bdf8'],
      ['Neighbor   AS    MsgRcvd  State', '#94a3b8'],
      ['10.10.0.1  65101 894120   Estab', '#4ade80'],
      ['10.10.0.2  65102 901204   Estab', '#4ade80'],
      ['# show environment temp', '#38bdf8'],
      ['POD-A INLET : 20.4 C [OK]', '#e2e8f0'],
      ['POD-B INLET : 20.8 C [OK]', '#e2e8f0'],
      ['UPS-LOAD    : 64%    [N+1]', '#fbbf24'],
    ];
    ctx.font = '11px monospace';
    lines.forEach(([txt, col], li) => {
      ctx.fillStyle = col;
      ctx.fillText(txt, 14, 46 + li * 17);
    });
  } else {
    // DCIM Alerts & Rack Ticket Queue
    ctx.fillText('DCIM · KABİN & ALARM KUYRUĞU', 12, 16);
    const rows = [
      ['NET-SW-01', '384 PORT AKTİF', '#38bdf8'],
      ['SRV-01..16', 'CPU %62 · NORMAL', '#22c55e'],
      ['STR-01..04', 'IOPS 1.8M · NORMAL', '#fbbf24'],
      ['NOC-IDF-01', 'UPLINK 100G TAM', '#38bdf8'],
      ['CRAH-01..04', 'SU AKIŞI NORMAL', '#4ade80'],
    ];
    rows.forEach(([id, st, col], ri) => {
      const ry = 34 + ri * 30;
      ctx.fillStyle = '#111d2f';
      ctx.fillRect(10, ry, 300, 24);
      ctx.fillStyle = col;
      ctx.fillRect(10, ry, 4, 24);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(id, 22, ry + 16);
      ctx.fillStyle = col;
      ctx.fillText(st, 118, ry + 16);
    });
  }

  return finalizeTexture(canvas, { srgb: true });
}

export function createKeyboardTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 256, 96);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, 252, 92);

  // Subtle cyan backlit mechanical keys grid
  for (let row = 0; row < 5; row++) {
    const ky = 10 + row * 16;
    for (let col = 0; col < 15; col++) {
      if (row === 4 && col >= 4 && col <= 9) continue;
      const kx = 10 + col * 16;
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(kx, ky, 13, 12);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(kx + 2, ky + 10, 9, 1.5);
    }
  }
  // Spacebar
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(74, 74, 92, 12);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(82, 84, 76, 1.5);

  return finalizeTexture(canvas, { srgb: true });
}

export function createFileCabinetTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, 256, 512);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 250, 506);

  const labels = ['AĞ TOPOLOJİ', 'PROSEDÜRLER', 'UPS & YANGIN', 'KABLO HARİTA'];
  for (let i = 0; i < 4; i++) {
    const dy = 14 + i * 122;
    ctx.fillStyle = '#475569';
    ctx.fillRect(14, dy, 228, 112);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.strokeRect(14, dy, 228, 112);

    // Label card holder
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(78, dy + 22, 100, 24);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(labels[i], 84, dy + 38);

    // Recessed brushed aluminum pull handle
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(58, dy + 62, 140, 14);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(64, dy + 66, 128, 6);
  }

  // Top key lock
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(218, 28, 7, 0, Math.PI * 2);
  ctx.fill();

  return finalizeTexture(canvas, { srgb: true });
}

export function createSafetyLockerTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#293548';
  ctx.fillRect(0, 0, 256, 384);
  ctx.strokeStyle = '#111827';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 250, 378);

  // Double door center seam
  ctx.beginPath();
  ctx.moveTo(128, 6);
  ctx.lineTo(128, 378);
  ctx.stroke();

  // Top & bottom ventilation louvers
  ctx.fillStyle = '#0f172a';
  for (const baseY of [28, 300]) {
    for (let y = 0; y < 48; y += 12) {
      ctx.fillRect(26, baseY + y, 78, 6);
      ctx.fillRect(152, baseY + y, 78, 6);
    }
  }

  // Door handles
  ctx.fillStyle = '#cbd5e1';
  ctx.fillRect(104, 168, 12, 46);
  ctx.fillRect(140, 168, 12, 46);

  // Asset tag
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(28, 108, 74, 24);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('NOC DEPO', 36, 124);

  return finalizeTexture(canvas, { srgb: true });
}

export function createPrinterPanelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = '#082f49';
  ctx.fillRect(14, 14, 140, 100);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(14, 14, 140, 100);

  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('NOC-PRT-01', 24, 42);
  ctx.fillStyle = '#38bdf8';
  ctx.font = '12px monospace';
  ctx.fillText('AĞ YAZICI HAZIR', 24, 68);
  ctx.fillText('TONER: %92  A3/A4', 24, 92);

  // Keypad buttons
  ctx.fillStyle = '#334155';
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      ctx.fillRect(168 + c * 24, 20 + r * 26, 18, 18);
    }
  }
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(168, 98, 66, 16);

  return finalizeTexture(canvas, { srgb: true });
}

export function createCredenzaDoorsTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 128);

  // 4 Credenza cabinet doors with recessed handles & lock dots
  for (let i = 0; i < 4; i++) {
    const x = 8 + i * 125;
    ctx.fillStyle = '#283548';
    ctx.fillRect(x, 8, 118, 112);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, 8, 118, 112);

    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(i % 2 === 0 ? x + 98 : x + 12, 34, 7, 56);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x + 12, 14, 22, 4);
  }

  return finalizeTexture(canvas, { srgb: true });
}

export function createSwitchgearPanelTexture(code = 'AG-PANO', role = 'ANA DAĞITIM') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1e2633';
  ctx.fillRect(0, 0, 256, 512);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 248, 504);

  // Header
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(16, 18, 224, 52);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(16, 18, 8, 52);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 20px monospace';
  ctx.fillText(code, 34, 42);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px monospace';
  ctx.fillText(role, 34, 60);

  // 3-Phase Digital Power Analyzer Display
  ctx.fillStyle = '#082f49';
  ctx.fillRect(24, 88, 208, 96);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 88, 208, 96);
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('L1:400V  L2:401V', 34, 118);
  ctx.fillText('L3:399V  50.00Hz', 34, 144);
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('AKIM: 2140 A [OK]', 34, 170);

  // Breaker MCCB compartments
  for (let i = 0; i < 3; i++) {
    const y = 206 + i * 82;
    ctx.fillStyle = '#293548';
    ctx.fillRect(22, y, 212, 68);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.strokeRect(22, y, 212, 68);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(36, y + 18, 24, 30);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`ŞALTER CB-0${i + 1}`, 76, y + 38);
  }

  // Danger arc flash label
  ctx.fillStyle = '#eab308';
  ctx.fillRect(24, 464, 208, 24);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('⚡ ARK FLAŞ TEHLİKESİ · 400V', 32, 481);

  return finalizeTexture(canvas, { srgb: true });
}

export function createBatteryModuleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#141a24';
  ctx.fillRect(0, 0, 256, 512);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 248, 504);

  // 7 Stacked Lithium-Ion Rack Drawers
  for (let i = 0; i < 7; i++) {
    const y = 20 + i * 68;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(16, y, 224, 58);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(16, y, 224, 58);

    // Orange HV DC Bus terminal cap on left
    ctx.fillStyle = '#f97316';
    ctx.fillRect(24, y + 12, 18, 34);

    // Cell vent slits
    ctx.fillStyle = '#090d14';
    for (let x = 56; x < 178; x += 14) {
      ctx.fillRect(x, y + 14, 9, 30);
    }

    // BMS LEDs
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(192, y + 18, 12, 8);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(210, y + 18, 12, 8);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 10px monospace';
    ctx.fillText(`MOD-${i + 1}`, 190, y + 44);
  }

  return finalizeTexture(canvas, { srgb: true });
}

export function createPowerScadaTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#08101c';
  ctx.fillRect(0, 0, 512, 320);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 504, 312);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(10, 10, 492, 40);
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('TEK HAT ŞEMASI · GÜÇ & UPS SCADA', 22, 36);

  // Single-Line Electrical Diagram (Grid/Gen -> ATS -> UPS -> Server Hall)
  const nodes = [
    { x: 26, label: 'ŞEBEKE/JEN', sub: '2× 2.5 MVA', col: '#f59e0b' },
    { x: 146, label: 'ATS-01 & AG', sub: '400V 2140A', col: '#38bdf8' },
    { x: 266, label: 'UPS-01..03', sub: 'N+1 ONLINE', col: '#22c55e' },
    { x: 386, label: 'SUNUCU BUS', sub: '1.42 MW', col: '#10b981' },
  ];
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(80, 118);
  ctx.lineTo(430, 118);
  ctx.stroke();

  nodes.forEach((n) => {
    ctx.fillStyle = '#0f1c2e';
    ctx.fillRect(n.x, 84, 100, 72);
    ctx.strokeStyle = n.col;
    ctx.lineWidth = 2;
    ctx.strokeRect(n.x, 84, 100, 72);
    ctx.fillStyle = n.col;
    ctx.font = 'bold 12px monospace';
    ctx.fillText(n.label, n.x + 8, 112);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px monospace';
    ctx.fillText(n.sub, n.x + 8, 136);
  });

  // Battery bank feed box below UPS
  ctx.strokeStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(316, 156);
  ctx.lineTo(316, 200);
  ctx.stroke();
  ctx.fillStyle = '#1e1b18';
  ctx.fillRect(216, 200, 200, 56);
  ctx.strokeStyle = '#f97316';
  ctx.strokeRect(216, 200, 200, 56);
  ctx.fillStyle = '#fb923c';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('AKÜ BAT-A & BAT-B: 480V DC', 226, 224);
  ctx.fillStyle = '#4ade80';
  ctx.fillText('OTONOMİ: 15 DK (%100)', 236, 244);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px monospace';
  ctx.fillText('BESLEME A (KIRMIZI) + BESLEME B (MAVİ) AKTİF', 24, 292);

  return finalizeTexture(canvas, { srgb: true });
}

export function createStagingScreenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#07111e';
  ctx.fillRect(0, 0, 512, 320);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 504, 312);

  ctx.fillStyle = '#0f253c';
  ctx.fillRect(10, 10, 492, 40);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('STAGING KVM · BURN-IN & ÖN KURULUM', 20, 36);

  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('> TST-01 UPLINK   : 100G QSFP28 [BAĞLI]', 24, 86);
  ctx.fillText('> NODE-01 BIOS    : PXE KURULUM %100 [OK]', 24, 114);
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('> STRES TESTİ     : CPU 62°C · RAM ECC TEMİZ', 24, 142);
  ctx.fillText('> GÜÇ BESLEME A+B : 230V / 4.2A STABİL', 24, 170);

  // Progress bars for burn-in test
  const tasks = [
    { name: 'FIRMWARE DOĞRULAMA', pct: 1.0, col: '#22c55e' },
    { name: 'OPTİK LİNK TESTİ  ', pct: 0.86, col: '#38bdf8' },
    { name: 'TERMAL BURN-IN 24H', pct: 0.72, col: '#f59e0b' },
  ];
  tasks.forEach((t, idx) => {
    const y = 202 + idx * 34;
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px monospace';
    ctx.fillText(t.name, 24, y + 15);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(184, y, 296, 18);
    ctx.fillStyle = t.col;
    ctx.fillRect(184, y, Math.round(296 * t.pct), 18);
  });

  return finalizeTexture(canvas, { srgb: true });
}

export function createSecurityControlTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#090f1a';
  ctx.fillRect(0, 0, 512, 320);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 504, 312);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(10, 10, 492, 40);
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('FİZİKSEL GÜVENLİK · MANTRAP & NVR', 20, 36);

  // 4 mini CCTV quadrants
  const cams = ['CAM-01 MANTRAP', 'CAM-02 STAGING', 'CAM-03 X-RAY', 'CAM-04 KAPI'];
  cams.forEach((c, i) => {
    const cx = 20 + (i % 2) * 140;
    const cy = 68 + Math.floor(i / 2) * 100;
    ctx.fillStyle = '#0f1c2e';
    ctx.fillRect(cx, cy, 130, 88);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(cx, cy, 130, 88);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(cx + 8, cy + 8, 7, 7);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '10px monospace';
    ctx.fillText(c, cx + 20, cy + 16);
    ctx.strokeStyle = '#1e3a5f';
    ctx.strokeRect(cx + 16, cy + 28, 98, 46);
  });

  // Right status panel
  ctx.fillStyle = '#111c2d';
  ctx.fillRect(306, 68, 186, 188);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(306, 68, 186, 188);
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('BİYOMETRİK: AKTİF', 318, 98);
  ctx.fillText('MANTRAP KİLİT: OK', 318, 126);
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('X-RAY TARAMA: TEMİZ', 318, 154);
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('KAYIT: 30 GÜN NVR', 318, 182);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '11px monospace';
  ctx.fillText('SON GEÇİŞ: YETKİLİ #04', 318, 224);

  ctx.fillStyle = '#14532d';
  ctx.fillRect(20, 272, 472, 30);
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('YETKİSİZ GİRİŞ İHLALİ: 0  ·  TÜM SENSÖRLER ÇEVRİMİÇİ', 34, 292);

  return finalizeTexture(canvas, { srgb: true });
}

export function createXrayScanTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  // Deep diagnostic slate frame
  ctx.fillStyle = '#050b14';
  ctx.fillRect(0, 0, 512, 320);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 504, 312);

  // Header bar
  ctx.fillStyle = '#0f1c2e';
  ctx.fillRect(10, 10, 492, 36);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(10, 10, 8, 36);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('X-RAY TARAMA · ÇİFT ENERJİ (140 kV)', 26, 33);

  // Main X-Ray viewport (false-color material penetration scan)
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(16, 56, 336, 210);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;
  ctx.strokeRect(16, 56, 336, 210);

  // Faint calibration grid inside X-Ray viewport
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.lineWidth = 1;
  for (let gx = 48; gx < 350; gx += 32) {
    ctx.beginPath();
    ctx.moveTo(gx, 56);
    ctx.lineTo(gx, 266);
    ctx.stroke();
  }
  for (let gy = 88; gy < 264; gy += 32) {
    ctx.beginPath();
    ctx.moveTo(16, gy);
    ctx.lineTo(352, gy);
    ctx.stroke();
  }

  // Case silhouette (Orange = organic/polymer shell, Blue = high-density metal, Green = alloy/PCB)
  ctx.fillStyle = 'rgba(249, 115, 22, 0.55)';
  ctx.fillRect(46, 86, 276, 152);
  ctx.strokeStyle = '#ea580c';
  ctx.lineWidth = 3;
  ctx.strokeRect(46, 86, 276, 152);

  // Laptop / Server Chassis metallic components (deep blue & green X-ray tones)
  ctx.fillStyle = 'rgba(37, 99, 235, 0.78)';
  ctx.fillRect(68, 106, 128, 110);
  ctx.fillStyle = 'rgba(22, 163, 74, 0.75)';
  ctx.fillRect(84, 118, 96, 58);
  // CPU Heatsink fins (dense dark blue)
  ctx.fillStyle = '#1e3a8a';
  for (let fx = 90; fx < 174; fx += 10) {
    ctx.fillRect(fx, 124, 5, 42);
  }
  // Power brick & braided cables (blue & orange)
  ctx.fillStyle = 'rgba(30, 58, 138, 0.85)';
  ctx.fillRect(218, 112, 74, 48);
  ctx.strokeStyle = '#1d4ed8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(196, 196);
  ctx.bezierCurveTo(228, 220, 260, 170, 294, 192);
  ctx.stroke();
  ctx.fillStyle = 'rgba(22, 163, 74, 0.8)';
  ctx.fillRect(222, 174, 68, 42);

  // Right Diagnostic Telemetry Column
  ctx.fillStyle = '#0c1626';
  ctx.fillRect(362, 56, 134, 210);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(362, 56, 134, 210);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('MOD: OTO-TEHDİT', 372, 82);
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '11px monospace';
  ctx.fillText('ORGANİK : TURUNCU', 372, 112);
  ctx.fillStyle = '#4ade80';
  ctx.fillText('ALAŞIM  : YEŞİL', 372, 134);
  ctx.fillStyle = '#60a5fa';
  ctx.fillText('METAL   : MAVİ', 372, 156);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(372, 178, 114, 72);
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('NESNE: KASA', 380, 204);
  ctx.fillText('TEHDİT: YOK', 380, 228);

  // Bottom Safe Clearance Status Strip
  ctx.fillStyle = '#14532d';
  ctx.fillRect(16, 276, 480, 28);
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('TARAMA TAMAMLANDI · GEÇİŞ ONAYLI (0 ALARM)', 62, 295);

  return finalizeTexture(canvas, { srgb: true });
}

export function createLogisticsBoxTexture(title = 'SUNUCU DONANIM', code = '2U CHASSIS') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#8b6f47';
  ctx.fillRect(0, 0, 256, 192);
  ctx.strokeStyle = '#5c4628';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 250, 186);

  // Packing tape strip across top
  ctx.fillStyle = '#b49464';
  ctx.fillRect(0, 22, 256, 18);

  // White shipping / asset barcode placard
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(24, 56, 208, 108);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(24, 56, 208, 28);
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(title, 34, 75);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(code, 34, 108);

  // Barcode stripes
  for (let bx = 34; bx < 210; bx += 7) {
    ctx.fillRect(bx, 122, bx % 14 === 0 ? 4 : 2, 26);
  }

  return finalizeTexture(canvas, { srgb: true });
}

export function createExtinguisherSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(0, 0, 256, 384);
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 8;
  ctx.strokeRect(10, 10, 236, 364);

  // Top White Header Band
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(22, 22, 212, 72);
  ctx.fillStyle = '#b91c1c';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('YANGIN TÜPÜ', 44, 54);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('CO2 · 5 KG', 74, 80);

  // Extinguisher Silhouette Icon in lower-center behind cylinder
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(96, 120, 64, 14);
  ctx.fillRect(108, 134, 40, 20);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(28, 304, 200, 48);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('ELEKTRİK & SUNUCU', 46, 326);
  ctx.font = 'bold 13px monospace';
  ctx.fillText('PANO YANGINLARI', 58, 344);

  return finalizeTexture(canvas, { srgb: true });
}

export function createExtinguisherBodyTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, 0, 256, 256);

  // Technical Operating Label wrapped on cylinder front
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(36, 56, 184, 142);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(36, 56, 184, 28);
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('CO2 · 5 KG B/E', 52, 76);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('1. EMNİYET PİMİNİ ÇEK', 46, 108);
  ctx.fillText('2. NOZULU ALEV TABANINA', 46, 132);
  ctx.fillText('   DOĞRU YÖNELT', 46, 150);
  ctx.fillText('3. MANDALA TAM BAS', 46, 174);

  ctx.fillStyle = '#16a34a';
  ctx.fillRect(46, 182, 164, 8);

  return finalizeTexture(canvas, { srgb: true });
}

export function createCleanAgentDepotTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');

  // Industrial Clean-Agent Suppression Rack Sign & Cylinder Status Board
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 384);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 504, 376);

  ctx.fillStyle = '#991b1b';
  ctx.fillRect(14, 14, 484, 58);
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 21px sans-serif';
  ctx.fillText('⚡ ELEKTRİK YANGINI · GAZLI SÖNDÜRME MERKEZİ', 24, 42);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('FK-5-1-12 (NOVEC 1230) / FM-200 · İLETKEN OLMAYAN TEMİZ GAZ', 26, 62);

  // 6 Cylinder Pressure Indicators
  for (let i = 0; i < 6; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 22 + col * 160;
    const y = 90 + row * 94;
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y, 148, 82);
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, 148, 82);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 15px monospace';
    ctx.fillText(`TÜP-0${i + 1} · 140L`, x + 12, y + 26);
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 16px monospace';
    ctx.fillText('42.0 BAR [OK]', x + 12, y + 52);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px monospace';
    ctx.fillText('SOLENOİD HAZIR', x + 12, y + 70);
  }

  ctx.fillStyle = '#14532d';
  ctx.fillRect(22, 286, 468, 78);
  ctx.strokeStyle = '#22c55e';
  ctx.strokeRect(22, 286, 468, 78);
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('NFPA 2001 · SU İÇERMEZ · ELEKTRİK EKİPMANINA ZARARSIZ', 32, 316);
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('2× N2 PİLOT SİLİNDİR + 2× 50KG CO2/TOZLU YEDEK ÜNİTE HAZIR', 32, 344);

  return finalizeTexture(canvas, { srgb: true });
}

export function createVfdPanelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 512, 384);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, 504, 376);

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(16, 16, 480, 44);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(16, 16, 10, 44);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('VFD POMPA SÜRÜCÜ & BMS PANOSU', 38, 45);

  // 3 VFD Inverter Bays (P-01, P-02, P-03)
  const bays = [
    { name: 'VFD P-01', hz: '44.2 Hz', st: 'AKTİF', col: '#22c55e' },
    { name: 'VFD P-02', hz: '44.5 Hz', st: 'AKTİF', col: '#22c55e' },
    { name: 'VFD P-03', hz: '00.0 Hz', st: 'N+1 YEDEK', col: '#38bdf8' },
  ];
  bays.forEach((b, i) => {
    const x = 18 + i * 162;
    ctx.fillStyle = '#293548';
    ctx.fillRect(x, 76, 152, 288);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.strokeRect(x, 76, 152, 288);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px monospace';
    ctx.fillText(b.name, x + 28, 106);

    // Digital VFD keypad screen
    ctx.fillStyle = '#082f49';
    ctx.fillRect(x + 16, 122, 120, 82);
    ctx.strokeStyle = b.col;
    ctx.strokeRect(x + 16, 122, 120, 82);
    ctx.fillStyle = b.col;
    ctx.font = 'bold 19px monospace';
    ctx.fillText(b.hz, x + 32, 156);
    ctx.font = 'bold 13px monospace';
    ctx.fillText(b.st, x + 32, 184);

    // Cooling louvers
    ctx.fillStyle = '#0f172a';
    for (let ly = 232; ly < 336; ly += 14) {
      ctx.fillRect(x + 22, ly, 108, 7);
    }
  });

  return finalizeTexture(canvas, { srgb: true });
}

export function createCoolingScadaTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#07131f';
  ctx.fillRect(0, 0, 512, 320);
  ctx.strokeStyle = '#0ea5e9';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 504, 312);

  ctx.fillStyle = '#0f253a';
  ctx.fillRect(10, 10, 492, 40);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('SOĞUTMA TESİSİ · CHILLED WATER SCADA', 20, 36);

  // Flow pipes (blue supply / red return)
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(40, 118);
  ctx.lineTo(470, 118);
  ctx.stroke();

  ctx.strokeStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(470, 178);
  ctx.lineTo(40, 178);
  ctx.stroke();

  const stages = [
    { x: 24, t: 'CH-01..03', s: '7.0°C', c: '#38bdf8' },
    { x: 144, t: 'PHE-01', s: 'EŞANJÖR', c: '#22c55e' },
    { x: 264, t: 'BUFFER', s: '3000 L', c: '#38bdf8' },
    { x: 384, t: 'P-01..03', s: '4.2 BAR', c: '#4ade80' },
  ];
  stages.forEach((st) => {
    ctx.fillStyle = '#0f1c2e';
    ctx.fillRect(st.x, 82, 104, 118);
    ctx.strokeStyle = st.c;
    ctx.lineWidth = 2;
    ctx.strokeRect(st.x, 82, 104, 118);
    ctx.fillStyle = st.c;
    ctx.font = 'bold 13px monospace';
    ctx.fillText(st.t, st.x + 12, 114);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px monospace';
    ctx.fillText(st.s, st.x + 12, 146);
    ctx.fillText('NORMAL', st.x + 12, 174);
  });

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(24, 224, 464, 72);
  ctx.strokeStyle = '#1e3a5f';
  ctx.strokeRect(24, 224, 464, 72);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('GİDİŞ: 7.1°C  ·  DÖNÜŞ: 12.6°C  ·  DEBİ: 84 L/SN', 40, 254);
  ctx.fillStyle = '#4ade80';
  ctx.fillText('FREE-COOLING HAZIR · NOVEC 1230 SÖNDÜRME: 6×140L', 34, 282);

  return finalizeTexture(canvas, { srgb: true });
}

export function createBufferTankLabelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0284c7';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(24, 74, 208, 108);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.strokeRect(24, 74, 208, 108);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('TERMAL TAMPON', 48, 108);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('BUFFER · 3000 L', 36, 138);
  ctx.fillStyle = '#4ade80';
  ctx.font = '13px monospace';
  ctx.fillText('7.0°C · 6 BAR İZOLELİ', 42, 166);

  return finalizeTexture(canvas, { srgb: true });
}

export function createLobbyBrandSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');

  // Matte brushed slate architectural fascia
  const grad = ctx.createLinearGradient(0, 0, 768, 192);
  grad.addColorStop(0, '#091322');
  grad.addColorStop(0.5, '#0f2036');
  grad.addColorStop(1, '#091322');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 768, 192);

  // Illuminated top & bottom cyan accent rails
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(16, 12, 736, 4);
  ctx.fillRect(16, 176, 736, 4);

  // Geometric hexagonal NEXA emblem on left
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 5;
  ctx.beginPath();
  const cx = 104;
  const cy = 96;
  const r = 44;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 - Math.PI / 6;
    const vx = cx + Math.cos(a) * r;
    const vy = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(vx, vy);
    else ctx.lineTo(vx, vy);
  }
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(cx, cy, 12, 0, Math.PI * 2);
  ctx.fill();

  // Brand title & corporate subtitle
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 54px sans-serif';
  ctx.fillText('NEXA', 176, 100);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('DATA CENTER', 348, 98);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 18px monospace';
  ctx.fillText('TIER-III KRİTİK ALTYAPI · KARŞILAMA & GÜVENLİK', 178, 142);

  return finalizeTexture(canvas, { srgb: true });
}

export function createLobbyDirectoryTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#07111e';
  ctx.fillRect(0, 0, 512, 320);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, 504, 312);

  ctx.fillStyle = '#0f253c';
  ctx.fillRect(10, 10, 492, 42);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 18px monospace';
  ctx.fillText('NEXA · TESİS REHBERİ & ZİYARETÇİ BİLGİ', 22, 37);

  const zones = [
    ['01  GENEL KONTROL (NOC)', 'KUZEY KAPI · KARTLI YETKİ', '#38bdf8'],
    ['02  GÜVENLİK & MANTRAP', 'DOĞU TURNİKE · İRİS + KART', '#f59e0b'],
    ['03  ANA SUNUCU SALONU', 'POD A & B · SOĞUK KORİDOR', '#22c55e'],
    ['04  GÜÇ & UPS / SOĞUTMA', 'N+1 YEDEKLİ · TEKNİK PERSONEL', '#94a3b8'],
  ];
  zones.forEach(([title, sub, col], i) => {
    const y = 70 + i * 48;
    ctx.fillStyle = '#0f1c2e';
    ctx.fillRect(20, y, 472, 38);
    ctx.fillStyle = col;
    ctx.fillRect(20, y, 6, 38);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 13px monospace';
    ctx.fillText(title, 36, y + 24);
    ctx.fillStyle = col;
    ctx.font = '12px monospace';
    ctx.fillText(sub, 272, y + 24);
  });

  ctx.fillStyle = '#14532d';
  ctx.fillRect(20, 268, 472, 32);
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('ISO/IEC 27001 · UPTIME TIER-III · PUE 1.24 · 7/24 GÜVENLİK', 34, 289);

  return finalizeTexture(canvas, { srgb: true });
}

export function createEntranceMatTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Heavy-duty charcoal ribbed carpet base
  ctx.fillStyle = '#1e2530';
  ctx.fillRect(0, 0, 512, 256);

  // Ribbed industrial carpet texture horizontal striations
  for (let y = 8; y < 250; y += 8) {
    ctx.fillStyle = y % 16 === 0 ? '#141a22' : '#26303d';
    ctx.fillRect(10, y, 492, 4);
  }

  // Subtle woven outer border inset
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, 480, 224);

  // Center woven dark badge plate
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(128, 78, 256, 100);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.strokeRect(128, 78, 256, 100);

  ctx.fillStyle = '#e2e8f0';
  ctx.font = 'bold 34px sans-serif';
  ctx.fillText('NEXA', 206, 124);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('VERİ MERKEZİ · HOŞ GELDİNİZ', 148, 156);

  return finalizeTexture(canvas, { srgb: true });
}

export function createReceptionMonitorTexture(variant = 0) {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 192;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#08111e';
  ctx.fillRect(0, 0, 320, 192);
  ctx.fillStyle = '#0f2238';
  ctx.fillRect(0, 0, 320, 26);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(0, 0, 5, 26);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 11px monospace';

  if (variant === 0) {
    ctx.fillText('NEXA · ZİYARETÇİ KAYIT & KART YETKİ', 12, 17);
    const rows = [
      ['KART #408', 'ZİYARETÇİ ONAYLI', '#22c55e'],
      ['KART #409', 'BAKIM EKİBİ · POD A', '#38bdf8'],
      ['KART #410', 'KİMLİK DOĞRULAMA OK', '#4ade80'],
      ['RFID YAZICI', 'HAZIR · 42 KART', '#fbbf24'],
    ];
    rows.forEach(([id, st, col], i) => {
      const y = 36 + i * 36;
      ctx.fillStyle = '#111d2f';
      ctx.fillRect(12, y, 296, 28);
      ctx.fillStyle = col;
      ctx.fillRect(12, y, 4, 28);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(id, 24, y + 18);
      ctx.fillStyle = col;
      ctx.fillText(st, 128, y + 18);
    });
  } else {
    ctx.fillText('TURNİKE KORİDOR & LOBİ KONTROL', 12, 17);
    ['HAT 1 (KUZEY)', 'HAT 2 (GÜNEY)'].forEach((lane, i) => {
      const lx = 14 + i * 150;
      ctx.fillStyle = '#0f1c2e';
      ctx.fillRect(lx, 38, 142, 92);
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2;
      ctx.strokeRect(lx, 38, 142, 92);
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(lane, lx + 12, 62);
      ctx.fillStyle = '#4ade80';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('AÇIK · YETKİLİ', lx + 12, 90);
      ctx.fillStyle = '#38bdf8';
      ctx.font = '10px monospace';
      ctx.fillText('OPTİK SENSÖR: OK', lx + 12, 114);
    });
    ctx.fillStyle = '#14532d';
    ctx.fillRect(14, 144, 292, 34);
    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('ANA KAPI & MANTRAP SENKRON AKTİF', 34, 165);
  }

  return finalizeTexture(canvas, { srgb: true });
}


export function createOdfPanelTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 768;
  const ctx = canvas.getContext('2d');

  // Matte powder-coated industrial steel door surface
  ctx.fillStyle = '#18202c';
  ctx.fillRect(0, 0, 512, 768);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 6;
  ctx.strokeRect(5, 5, 502, 758);

  // Subtle recessed door bevel frame
  ctx.strokeStyle = '#0b111a';
  ctx.lineWidth = 3;
  ctx.strokeRect(18, 18, 476, 732);

  // Upper Identification Placard
  ctx.fillStyle = '#0b1320';
  ctx.fillRect(32, 36, 448, 114);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.strokeRect(32, 36, 448, 114);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(32, 36, 10, 114);

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText('FİBER OMURGA PANOSU', 56, 84);
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 17px monospace';
  ctx.fillText('MMR-ODF-01 · MEET-ME GİRİŞİ', 56, 122);

  // Upper Louver Slits
  for (let i = 0; i < 6; i++) {
    const ly = 178 + i * 20;
    ctx.fillStyle = '#090d14';
    ctx.fillRect(46, ly, 420, 10);
    ctx.fillStyle = '#293548';
    ctx.fillRect(46, ly + 10, 420, 2);
  }

  // Central Closed-Door Specification & Carrier Status Plate
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(36, 326, 440, 206);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.strokeRect(36, 326, 440, 206);

  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 16px monospace';
  ctx.fillText('ÇİFT YEDEKLİ TAŞIYICI OMURGA', 56, 362);

  // Path A & Path B Carrier Badges
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(56, 384, 192, 74);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(56, 384, 8, 74);
  ctx.font = 'bold 17px monospace';
  ctx.fillText('ISP-A HATTI', 76, 414);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '14px monospace';
  ctx.fillText('OS2 · 144 CORE', 76, 442);

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(264, 384, 192, 74);
  ctx.fillStyle = '#22d3ee';
  ctx.fillRect(264, 384, 8, 74);
  ctx.font = 'bold 17px monospace';
  ctx.fillText('ISP-B HATTI', 284, 414);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '14px monospace';
  ctx.fillText('OM4/OS2 · 144C', 284, 442);

  // Closed Status Bar
  ctx.fillStyle = '#14532d';
  ctx.fillRect(56, 476, 400, 36);
  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 15px monospace';
  ctx.fillText('DURUM: AKTİF · YERALTI MENHOL BAĞLI', 74, 500);

  // Lower Louver Area (visual match under 3D louver slats)
  for (let i = 0; i < 6; i++) {
    const ly = 560 + i * 20;
    ctx.fillStyle = '#090d14';
    ctx.fillRect(46, ly, 420, 10);
    ctx.fillStyle = '#293548';
    ctx.fillRect(46, ly + 10, 420, 2);
  }

  // Bottom Safety Warning Stripe
  ctx.fillStyle = '#eab308';
  ctx.fillRect(32, 694, 448, 38);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('DİKKAT · OPTİK FİBER HATTI · YETKİSİZ AÇMAYIN', 48, 719);

  return finalizeTexture(canvas, { srgb: true });
}


export function createExitSignTexture(arrow = 'none') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  // ISO 7010 Emergency Exit Green Background
  ctx.fillStyle = '#15803d';
  ctx.fillRect(0, 0, 512, 160);
  ctx.strokeStyle = '#dcfce7';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 500, 148);

  // White running-man / door pictogram block on left
  ctx.fillStyle = '#f0fdf4';
  ctx.fillRect(24, 24, 96, 112);
  ctx.fillStyle = '#15803d';
  // Door frame silhouette
  ctx.fillRect(48, 34, 48, 88);
  ctx.fillStyle = '#f0fdf4';
  // Running person simplified silhouette
  ctx.beginPath();
  ctx.arc(62, 54, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(54, 65, 16, 28);
  ctx.fillRect(42, 74, 38, 9);
  ctx.fillRect(48, 90, 10, 24);
  ctx.fillRect(66, 90, 10, 24);

  // Text "ACİL ÇIKIŞ"
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText('ACİL ÇIKIŞ', 142, 82);
  ctx.fillStyle = '#bbf7d0';
  ctx.font = 'bold 20px monospace';
  ctx.fillText('EMERGENCY EXIT', 144, 118);

  if (arrow === 'right' || arrow === 'left' || arrow === 'down') {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 54px sans-serif';
    const sym = arrow === 'right' ? '→' : arrow === 'left' ? '←' : '↓';
    ctx.fillText(sym, 434, 98);
  }

  return finalizeTexture(canvas, { srgb: true });
}


export function createCracHmiEmissiveTexture() {
  return getCachedTexture('cracHmiEmissive', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Black everywhere else so only the HMI screen and status indicator glow in the dark
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 512, 512);

    // Header status bar accent
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(28, 28, 10, 44);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(452, 42, 16, 16);

    // Left door HMI Touchscreen Display (matches createCracPanelTexture coordinates)
    ctx.fillStyle = '#082f49';
    ctx.fillRect(54, 214, 160, 114);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.strokeRect(54, 214, 160, 114);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 17px monospace';
    ctx.fillText('ÜFLEME: 18.5°C', 64, 242);
    ctx.fillStyle = '#4ade80';
    ctx.fillText('DÖNÜŞ : 31.4°C', 64, 268);
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '14px monospace';
    ctx.fillText('EC FAN: %68 AKTİF', 64, 294);
    ctx.fillText('VANA  : %74 AÇIK', 64, 316);

    return finalizeTexture(canvas, { srgb: true });
  });
}
