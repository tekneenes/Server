import * as THREE from 'three';

const _ledColor = new THREE.Color();
const _tempPos = new THREE.Vector3();
const _tempQuat = new THREE.Quaternion();
const _tempScale = new THREE.Vector3(1, 1, 1);
const _tempMat = new THREE.Matrix4();

function createCanvasTex(w, h, drawFn, { srgb = true } = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  drawFn(ctx, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function createPerforatedMeshTexture() {
  return createCanvasTex(128, 128, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#151c26';
    ctx.fillRect(0, 0, w, h);

    // Cut out dense honeycomb/grid perforations (alpha = 0) so interiors & LEDs shine through
    ctx.globalCompositeOperation = 'destination-out';
    const stepX = 16;
    const stepY = 14;
    for (let row = 0; row < Math.ceil(h / stepY) + 1; row++) {
      for (let col = 0; col < Math.ceil(w / stepX) + 1; col++) {
        const cx = col * stepX + (row % 2 === 0 ? 0 : stepX / 2);
        const cy = row * stepY;
        ctx.beginPath();
        ctx.arc(cx, cy, 4.9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  });
}

function createHeaderBadgeTexture(code, roleText, accentHex) {
  return createCanvasTex(512, 96, (ctx, w, h) => {
    ctx.fillStyle = '#0b121c';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, h - 4);

    ctx.fillStyle = accentHex;
    ctx.fillRect(10, 12, 12, h - 24);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 34px monospace';
    ctx.fillText(code, 36, 48);

    ctx.fillStyle = accentHex;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(roleText, 36, 78);
  });
}

function createSwitchFaceplateTexture(variant = 0) {
  return createCanvasTex(512, 64, (ctx, w, h) => {
    ctx.fillStyle = '#141e2b';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    // Left management LCD & console port
    ctx.fillStyle = '#082f49';
    ctx.fillRect(12, 12, 54, 40);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(variant === 0 ? '48P-25G' : '100G-QS', 15, 36);

    // 2x16 dense SFP+ / RJ45 port cages
    for (let col = 0; col < 18; col++) {
      const px = 82 + col * 21;
      for (let row = 0; row < 2; row++) {
        const py = 12 + row * 22;
        ctx.fillStyle = '#090d14';
        ctx.fillRect(px, py, 16, 16);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, 16, 16);
      }
    }

    // Right status & uplink label
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(w - 46, 10, 34, 44);
  });
}

function createCoreChassisTexture() {
  return createCanvasTex(512, 256, (ctx, w, h) => {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, h - 4);

    // 6 Line cards stacked horizontally
    for (let card = 0; card < 6; card++) {
      const y = 14 + card * 38;
      ctx.fillStyle = card === 2 || card === 3 ? '#1e293b' : '#162030';
      ctx.fillRect(18, y, w - 36, 32);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(18, y, w - 36, 32);

      // Ejector handles
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(22, y + 5, 10, 22);
      ctx.fillRect(w - 32, y + 5, 10, 22);

      // Dense QSFP28 optical cages
      for (let p = 0; p < 14; p++) {
        const px = 48 + p * 28;
        ctx.fillStyle = '#070b12';
        ctx.fillRect(px, y + 7, 20, 18);
        ctx.strokeStyle = '#64748b';
        ctx.strokeRect(px, y + 7, 20, 18);
      }
    }
  });
}

function createComputeServerTexture(is2U = false) {
  return createCanvasTex(512, is2U ? 96 : 64, (ctx, w, h) => {
    ctx.fillStyle = '#1c2430';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    // Rack ears
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(4, 4, 18, h - 8);
    ctx.fillRect(w - 22, 4, 18, h - 8);

    // NVMe Drive Caddies (8 or 12 bays)
    const bays = is2U ? 12 : 8;
    const bayW = 34;
    for (let b = 0; b < bays; b++) {
      const bx = 34 + b * (bayW + 4);
      const bh = is2U ? 34 : 42;
      const by = is2U ? 10 : 11;
      ctx.fillStyle = '#0d131c';
      ctx.fillRect(bx, by, bayW, bh);
      // Blue quick-release latch
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(bx + 3, by + 5, 6, bh - 10);

      if (is2U) {
        const by2 = 52;
        ctx.fillStyle = '#0d131c';
        ctx.fillRect(bx, by2, bayW, bh);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(bx + 3, by2 + 5, 6, bh - 10);
      }
    }

    // Right-side power button & asset pull-tab
    ctx.fillStyle = '#334155';
    ctx.fillRect(w - 58, 12, 26, h - 24);
  });
}

function createStorageArrayTexture() {
  return createCanvasTex(512, 160, (ctx, w, h) => {
    ctx.fillStyle = '#19212c';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, w - 4, h - 4);

    // 3x12 High-Density NVMe/SAS disk grid with amber latches
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 12; c++) {
        const bx = 28 + c * 38;
        const by = 14 + r * 46;
        ctx.fillStyle = '#0b1017';
        ctx.fillRect(bx, by, 32, 38);
        ctx.fillStyle = '#d97706';
        ctx.fillRect(bx + 3, by + 4, 26, 6);
      }
    }
  });
}

function createRearHardwareTexture() {
  return createCanvasTex(512, 128, (ctx, w, h) => {
    ctx.fillStyle = '#1a222d';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    // Left & Right Hot-Swap PSU modules
    for (const px of [16, w - 98]) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(px, 14, 82, h - 28);
      ctx.fillStyle = '#16a34a'; // PSU release handle
      ctx.fillRect(px + 8, 28, 14, h - 56);
      // C14 power inlet
      ctx.fillStyle = '#020617';
      ctx.fillRect(px + 34, 44, 34, 40);
    }

    // Center exhaust fans + management NICs
    for (let f = 0; f < 4; f++) {
      const fx = 124 + f * 66;
      ctx.fillStyle = '#0b1118';
      ctx.beginPath();
      ctx.arc(fx + 26, h / 2, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.stroke();
    }
  });
}

function createVerticalPduTexture(isFeedA) {
  return createCanvasTex(64, 512, (ctx, w, h) => {
    ctx.fillStyle = isFeedA ? '#7f1d1d' : '#1e3a8a';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = isFeedA ? '#ef4444' : '#3b82f6';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, w - 4, h - 4);

    // Digital amperage LCD
    ctx.fillStyle = '#020617';
    ctx.fillRect(10, 26, w - 20, 44);
    ctx.fillStyle = isFeedA ? '#fca5a5' : '#93c5fd';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(isFeedA ? '24A' : '23A', 16, 54);

    // C13/C19 power outlets down the strip
    for (let y = 92; y < h - 24; y += 22) {
      ctx.fillStyle = '#090d14';
      ctx.fillRect(14, y, w - 28, 14);
    }
  });
}

export class CabinetAssetFactory {
  constructor() {
    const perfTex = createPerforatedMeshTexture();
    const switch1Tex = createSwitchFaceplateTexture(0);
    const switch2Tex = createSwitchFaceplateTexture(1);
    const coreTex = createCoreChassisTexture();
    const srv1UTex = createComputeServerTexture(false);
    const srv2UTex = createComputeServerTexture(true);
    const storageTex = createStorageArrayTexture();
    const rearTex = createRearHardwareTexture();
    const pduATex = createVerticalPduTexture(true);
    const pduBTex = createVerticalPduTexture(false);

    this.mats = {
      frame: new THREE.MeshStandardMaterial({ color: 0x151c26, roughness: 0.44, metalness: 0.78 }),
      rail: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.32, metalness: 0.88 }),
      perfDoor: new THREE.MeshStandardMaterial({
        map: perfTex,
        alphaTest: 0.45,
        side: THREE.DoubleSide,
        roughness: 0.48,
        metalness: 0.72,
      }),
      sidePanel: new THREE.MeshStandardMaterial({ color: 0x1e2633, roughness: 0.48, metalness: 0.68 }),
      glassCenter: new THREE.MeshStandardMaterial({
        color: 0x7dd3fc,
        transparent: true,
        opacity: 0.22,
        roughness: 0.08,
        metalness: 0.15,
        depthWrite: false,
      }),
      switch1U: new THREE.MeshStandardMaterial({ map: switch1Tex, roughness: 0.42, metalness: 0.48 }),
      switch2U: new THREE.MeshStandardMaterial({ map: switch2Tex, roughness: 0.42, metalness: 0.48 }),
      coreChassis: new THREE.MeshStandardMaterial({ map: coreTex, roughness: 0.4, metalness: 0.52 }),
      srv1U: new THREE.MeshStandardMaterial({ map: srv1UTex, roughness: 0.45, metalness: 0.5 }),
      srv2U: new THREE.MeshStandardMaterial({ map: srv2UTex, roughness: 0.45, metalness: 0.5 }),
      storage4U: new THREE.MeshStandardMaterial({ map: storageTex, roughness: 0.45, metalness: 0.5 }),
      blanking: new THREE.MeshStandardMaterial({ color: 0x0f151e, roughness: 0.65, metalness: 0.35 }),
      rearPanel: new THREE.MeshStandardMaterial({ map: rearTex, roughness: 0.45, metalness: 0.55 }),
      pduA: new THREE.MeshStandardMaterial({ map: pduATex, roughness: 0.38, metalness: 0.45 }),
      pduB: new THREE.MeshStandardMaterial({ map: pduBTex, roughness: 0.38, metalness: 0.45 }),
      fiberYellow: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35, metalness: 0.1 }),
      fiberAqua: new THREE.MeshStandardMaterial({ color: 0x22d3ee, roughness: 0.35, metalness: 0.1 }),
      fiberOrange: new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.35, metalness: 0.1 }),
      powerCordRed: new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.65, metalness: 0.08 }),
      powerCordBlue: new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.65, metalness: 0.08 }),
      beaconSwitch: new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0ea5e9,
        emissiveIntensity: 1.8,
        roughness: 0.2,
      }),
      beaconServer: new THREE.MeshStandardMaterial({
        color: 0x34d399,
        emissive: 0x10b981,
        emissiveIntensity: 1.3,
        roughness: 0.2,
      }),
      beaconStorage: new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.5,
        roughness: 0.2,
      }),
    };

    // Shared curved cable geometries (reused across racks to keep memory & draw calls low!)
    this.geos = {
      post: new THREE.BoxGeometry(0.055, 2.22, 0.055),
      rail: new THREE.BoxGeometry(0.04, 2.08, 0.04),
      topBottomPlate: new THREE.BoxGeometry(0.9, 0.05, 1.1),
      doorMeshFront: new THREE.PlaneGeometry(0.76, 2.06),
      doorMeshSplit: new THREE.PlaneGeometry(0.37, 2.06),
      sidePanel: new THREE.BoxGeometry(0.03, 2.16, 1.04),
      latch: new THREE.BoxGeometry(0.03, 0.22, 0.04),
      chassis1U: new THREE.BoxGeometry(0.74, 0.082, 0.78),
      chassis2U: new THREE.BoxGeometry(0.74, 0.165, 0.8),
      chassis4U: new THREE.BoxGeometry(0.74, 0.34, 0.82),
      chassis8U: new THREE.BoxGeometry(0.74, 0.62, 0.82),
      pduBar: new THREE.BoxGeometry(0.065, 1.94, 0.065),
      waterfallPipe: this._buildFiberDropTube(),
      nocFiberDrop: new THREE.CylinderGeometry(0.016, 0.016, 0.28, 7),
      nocPowerDrop: new THREE.CylinderGeometry(0.016, 0.016, 0.36, 7),
      powerWhipLeft: this._buildPowerDropTube(-1),
      powerWhipRight: this._buildPowerDropTube(1),
      patchLoopLeft: this._buildPatchLoop(-1),
      patchLoopRight: this._buildPatchLoop(1),
      rearCordA: this._buildRearCord(-1),
      rearCordB: this._buildRearCord(1),
      vertTrunk: new THREE.CylinderGeometry(0.024, 0.024, 2.05, 8),
      chimney: new THREE.BoxGeometry(0.54, 0.1, 0.28),
    };

    // Registry of LED emitters collected during cabinet construction
    this.ledDefs = [];
  }

  _buildFiberDropTube() {
    // Rises from Front Fiber Chimney (z = +0.26) straight up into Fiber Tray center (y = 2.50, z = +0.26)
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 2.24, 0.26),
      new THREE.Vector3(0, 2.41, 0.26),
      new THREE.Vector3(0.07, 2.48, 0.26),
      new THREE.Vector3(0.18, 2.5, 0.26),
    ]);
    return new THREE.TubeGeometry(curve, 12, 0.019, 7, false);
  }

  _buildPowerDropTube(sideSign) {
    // Rises from Rear Power Chimney (z = -0.26) straight up into Power Tray center (y = 2.68, z = -0.26)
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sideSign * 0.14, 2.24, -0.26),
      new THREE.Vector3(sideSign * 0.14, 2.5, -0.26),
      new THREE.Vector3(sideSign * 0.08, 2.65, -0.26),
      new THREE.Vector3(sideSign * 0.18, 2.68, -0.26),
    ]);
    return new THREE.TubeGeometry(curve, 12, 0.017, 7, false);
  }

  _buildPatchLoop(sideSign) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sideSign * 0.12, 0, 0.42),
      new THREE.Vector3(sideSign * 0.28, -0.04, 0.46),
      new THREE.Vector3(sideSign * 0.37, -0.14, 0.41),
      new THREE.Vector3(sideSign * 0.37, -0.28, 0.37),
    ]);
    return new THREE.TubeGeometry(curve, 10, 0.009, 6, false);
  }

  _buildRearCord(sideSign) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(sideSign * 0.26, 0, -0.4),
      new THREE.Vector3(sideSign * 0.33, -0.04, -0.44),
      new THREE.Vector3(sideSign * 0.37, -0.1, -0.4),
    ]);
    return new THREE.TubeGeometry(curve, 8, 0.011, 6, false);
  }

  /**
   * Builds a 42U detailed cabinet:
   * type: 'switch' | 'server' | 'storage' | 'staging'
   */
  createCabinet({ type = 'server', code = 'SRV-01', podName = 'Pod A', showLeftSide = false, showRightSide = false, inspectables }) {
    const group = new THREE.Group();
    const pendingLeds = [];

    // 1. Structural 4-Post Frame + Top/Bottom Plinths (flush at y = 0)
    const bottomPlate = new THREE.Mesh(this.geos.topBottomPlate, this.mats.frame);
    bottomPlate.position.y = 0.035;
    bottomPlate.castShadow = true;
    bottomPlate.receiveShadow = true;
    const topPlate = new THREE.Mesh(this.geos.topBottomPlate, this.mats.frame);
    topPlate.position.y = 2.24;
    topPlate.castShadow = true;
    group.add(bottomPlate, topPlate);

    for (const px of [-0.42, 0.42]) {
      for (const pz of [-0.52, 0.52]) {
        const post = new THREE.Mesh(this.geos.post, this.mats.frame);
        post.position.set(px, 1.135, pz);
        post.castShadow = true;
        group.add(post);
      }
      // Internal 19-inch mounting rails
      for (const rz of [-0.41, 0.41]) {
        const rail = new THREE.Mesh(this.geos.rail, this.mats.rail);
        rail.position.set(px * 0.89, 1.14, rz);
        group.add(rail);
      }
    }

    // Optional outer end-of-row side panels
    if (showLeftSide) {
      const spL = new THREE.Mesh(this.geos.sidePanel, this.mats.sidePanel);
      spL.position.set(-0.445, 1.14, 0);
      spL.castShadow = true;
      group.add(spL);
    }
    if (showRightSide) {
      const spR = new THREE.Mesh(this.geos.sidePanel, this.mats.sidePanel);
      spR.position.set(0.445, 1.14, 0);
      spR.castShadow = true;
      group.add(spR);
    }

    // Dual Top Brush Chimneys: Front Fiber Chimney (+0.26 Z) & Rear Power Chimney (-0.26 Z)
    const chimneyFiber = new THREE.Mesh(this.geos.chimney, this.mats.rail);
    chimneyFiber.position.set(0, 2.29, 0.26);
    const chimneyPower = new THREE.Mesh(this.geos.chimney, this.mats.rail);
    chimneyPower.position.set(0, 2.29, -0.26);
    group.add(chimneyFiber, chimneyPower);

    if (podName === 'NOC Kontrol' || podName === 'Staging' || podName === 'Güvenlik') {
      // Straight vertical fiber bundles rising directly into overhead fiber tray (no sideways overhang)
      for (const fx of [-0.08, 0.0, 0.08]) {
        const nf = new THREE.Mesh(
          this.geos.nocFiberDrop,
          fx === 0 ? this.mats.fiberAqua : this.mats.fiberYellow
        );
        nf.position.set(fx, 2.38, 0.26);
        group.add(nf);
      }
      // Vertical Feed A/B power conduits rising cleanly into overhead power tray
      const npA = new THREE.Mesh(this.geos.nocPowerDrop, this.mats.powerCordRed);
      npA.position.set(-0.08, 2.42, -0.26);
      const npB = new THREE.Mesh(this.geos.nocPowerDrop, this.mats.powerCordBlue);
      npB.position.set(0.08, 2.42, -0.26);
      group.add(npA, npB);
    } else {
      const fiberColor = type === 'switch' ? this.mats.fiberYellow : this.mats.fiberAqua;
      for (const fx of [-0.14, 0.0, 0.14]) {
        const wf = new THREE.Mesh(
          this.geos.waterfallPipe,
          fx === 0 && type === 'switch' ? this.mats.fiberAqua : fiberColor
        );
        wf.position.x = fx;
        group.add(wf);
      }
      // Red (Feed A) & Blue (Feed B) Rear Power Whips rising cleanly into Overhead Power Tray
      const whipA = new THREE.Mesh(this.geos.powerWhipLeft, this.mats.powerCordRed);
      const whipB = new THREE.Mesh(this.geos.powerWhipRight, this.mats.powerCordBlue);
      group.add(whipA, whipB);
    }

    // 2. Vertical 0U Rear Redundant PDUs (Red Feed A & Blue Feed B)
    const pduA = new THREE.Mesh(this.geos.pduBar, this.mats.pduA);
    pduA.position.set(-0.36, 1.14, -0.38);
    const pduB = new THREE.Mesh(this.geos.pduBar, this.mats.pduB);
    pduB.position.set(0.36, 1.14, -0.38);
    group.add(pduA, pduB);

    // Front vertical fiber cable management trunks inside side rails
    const trunkL = new THREE.Mesh(
      this.geos.vertTrunk,
      type === 'switch' ? this.mats.fiberYellow : this.mats.fiberAqua
    );
    trunkL.position.set(-0.38, 1.14, 0.36);
    const trunkR = new THREE.Mesh(
      this.geos.vertTrunk,
      type === 'storage' ? this.mats.fiberOrange : this.mats.fiberAqua
    );
    trunkR.position.set(0.38, 1.14, 0.36);
    group.add(trunkL, trunkR);

    // 3. Populate Internal 3D Hardware Stack + Patch Cables + LED Coordinates
    const roleMeta = {
      switch: { label: 'AĞ & CORE SWITCH', accent: '#38bdf8', beacon: this.mats.beaconSwitch },
      server: { label: 'HESAPLAMA SUNUCU', accent: '#34d399', beacon: this.mats.beaconServer },
      storage: { label: 'DEPOLAMA & SAN', accent: '#fbbf24', beacon: this.mats.beaconStorage },
      staging: { label: 'TEST & ÖN KURULUM', accent: '#38bdf8', beacon: this.mats.beaconSwitch },
      security: { label: 'GÜVENLİK & NVR', accent: '#f59e0b', beacon: this.mats.beaconStorage },
    }[type];

    if (type === 'switch') {
      // Top 4 x 1U Access/Leaf Switches
      for (let s = 0; s < 4; s++) {
        const sy = 2.11 - s * 0.11;
        this._addHardwareUnit(group, this.geos.chassis1U, this.mats.switch1U, sy);
        this._addPatchCables(group, sy, s % 2 === 0 ? this.mats.fiberYellow : this.mats.fiberAqua);
        this._addRearPowerCords(group, sy);
        this._registerPortLedRow(pendingLeds, sy, 14, 'switch');
      }

      // Middle 8U Modular Spine / Core Switch Chassis (unmistakable centerpiece!)
      const coreY = 1.32;
      this._addHardwareUnit(group, this.geos.chassis8U, this.mats.coreChassis, coreY);
      this._addRearPowerCords(group, coreY + 0.14);
      this._addRearPowerCords(group, coreY - 0.14);
      for (let lineCard = 0; lineCard < 6; lineCard++) {
        const ly = coreY + 0.23 - lineCard * 0.092;
        this._registerPortLedRow(pendingLeds, ly, 12, 'switch');
        if (lineCard % 2 === 0) {
          this._addPatchCables(group, ly, this.mats.fiberAqua);
        }
      }

      // Lower 3 x 2U Distribution / Spine Uplinks
      for (let d = 0; d < 3; d++) {
        const dy = 0.82 - d * 0.2;
        this._addHardwareUnit(group, this.geos.chassis2U, this.mats.switch2U, dy);
        this._addPatchCables(group, dy, this.mats.fiberYellow);
        this._addRearPowerCords(group, dy);
        this._registerPortLedRow(pendingLeds, dy + 0.03, 12, 'switch');
      }
    } else if (type === 'storage' || type === 'security') {
      // Top 2 x 2U Fibre-Channel SAN Switches
      for (let s = 0; s < 2; s++) {
        const sy = 2.08 - s * 0.2;
        this._addHardwareUnit(group, this.geos.chassis2U, this.mats.switch2U, sy);
        this._addPatchCables(group, sy, this.mats.fiberOrange);
        this._addRearPowerCords(group, sy);
        this._registerPortLedRow(pendingLeds, sy + 0.02, 12, 'switch');
      }
      // 4 x 4U High-Density Storage Shelves
      for (let j = 0; j < 4; j++) {
        const jy = 1.54 - j * 0.37;
        this._addHardwareUnit(group, this.geos.chassis4U, this.mats.storage4U, jy);
        this._addRearPowerCords(group, jy);
        this._registerPortLedRow(pendingLeds, jy + 0.08, 8, 'storage');
        this._registerPortLedRow(pendingLeds, jy - 0.06, 8, 'storage');
      }
    } else {
      // Compute Server Rack (and Staging Rack): Top-of-Rack Switch + Compute Nodes
      const torY = 2.11;
      this._addHardwareUnit(group, this.geos.chassis1U, this.mats.switch1U, torY);
      this._addPatchCables(group, torY, this.mats.fiberAqua);
      this._addRearPowerCords(group, torY);
      this._registerPortLedRow(pendingLeds, torY, 14, 'switch');

      const mgmtY = 2.0;
      this._addHardwareUnit(group, this.geos.chassis1U, this.mats.switch2U, mgmtY);
      this._addPatchCables(group, mgmtY, this.mats.fiberYellow);
      this._registerPortLedRow(pendingLeds, mgmtY, 10, 'switch');

      // 8 x 1U + 3 x 2U Compute Servers with airflow blanking gaps
      let cy = 1.82;
      for (let i = 0; i < 10; i++) {
        const is2U = i === 2 || i === 6 || i === 8;
        const unitH = is2U ? 0.18 : 0.1;
        this._addHardwareUnit(
          group,
          is2U ? this.geos.chassis2U : this.geos.chassis1U,
          is2U ? this.mats.srv2U : this.mats.srv1U,
          cy
        );
        if (i % 2 === 0) this._addRearPowerCords(group, cy);
        this._registerPortLedRow(pendingLeds, cy, is2U ? 8 : 6, 'server');
        cy -= unitH + 0.025;
        if (cy < 0.24) break;
      }
    }

    // 4. Front & Rear Doors (Perforated Mesh + Distinct Header Nameplate + Top Beacon)
    // Top Header Nameplate (visibly distinguishes Switch vs Server vs Storage at a glance!)
    const badgeTex = createHeaderBadgeTexture(code, roleMeta.label, roleMeta.accent);
    const badgePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.76, 0.14),
      new THREE.MeshBasicMaterial({ map: badgeTex })
    );
    badgePlane.position.set(0, 2.24, 0.56);
    group.add(badgePlane);

    // Top status beacon bar
    const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.035, 0.03), roleMeta.beacon);
    beacon.position.set(0, 2.33, 0.53);
    group.add(beacon);

    // Front Perforated Door (with clear glass window center for Switch cabinets so lights/cables shine vividly!)
    if (type === 'switch') {
      const glassDoor = new THREE.Mesh(this.geos.doorMeshFront, this.mats.glassCenter);
      glassDoor.position.set(0, 1.13, 0.525);
      group.add(glassDoor);
    } else {
      const meshDoor = new THREE.Mesh(this.geos.doorMeshFront, this.mats.perfDoor);
      meshDoor.position.set(0, 1.13, 0.525);
      group.add(meshDoor);
    }
    const frontLatch = new THREE.Mesh(this.geos.latch, this.mats.rail);
    frontLatch.position.set(0.36, 1.12, 0.545);
    group.add(frontLatch);

    // Rear Split Perforated Doors (Hot Aisle side)
    const rearL = new THREE.Mesh(this.geos.doorMeshSplit, this.mats.perfDoor);
    rearL.position.set(-0.19, 1.13, -0.525);
    const rearR = new THREE.Mesh(this.geos.doorMeshSplit, this.mats.perfDoor);
    rearR.position.set(0.19, 1.13, -0.525);
    const rearLatch = new THREE.Mesh(this.geos.latch, this.mats.rail);
    rearLatch.position.set(0.02, 1.12, -0.545);
    group.add(rearL, rearR, rearLatch);

    // Invisible simplified raycast hit box for effortless inspection clicking
    const hitBox = new THREE.Mesh(
      new THREE.BoxGeometry(0.88, 2.28, 1.1),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitBox.position.y = 1.14;
    hitBox.userData.inspect = this._buildInspectMeta(type, code, podName);
    inspectables.push(hitBox);
    group.add(hitBox);

    // Record local LEDs on group so we register world matrices after group placement
    group.userData._pendingLeds = pendingLeds;
    return group;
  }

  _addHardwareUnit(group, geo, mat, y) {
    const unit = new THREE.Mesh(geo, mat);
    unit.position.set(0, y, 0.01);
    unit.castShadow = true;
    unit.receiveShadow = true;
    group.add(unit);

    // Rear faceplate plane on back of chassis
    const rear = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, geo.parameters.height * 0.85),
      this.mats.rearPanel
    );
    rear.rotation.y = Math.PI;
    rear.position.set(0, y, -0.395);
    group.add(rear);
  }

  _addPatchCables(group, y, cableMat) {
    const leftC = new THREE.Mesh(this.geos.patchLoopLeft, cableMat);
    leftC.position.y = y;
    const rightC = new THREE.Mesh(this.geos.patchLoopRight, cableMat);
    rightC.position.y = y;
    group.add(leftC, rightC);
  }

  _addRearPowerCords(group, y) {
    const cordA = new THREE.Mesh(this.geos.rearCordA, this.mats.powerCordRed);
    cordA.position.y = y;
    const cordB = new THREE.Mesh(this.geos.rearCordB, this.mats.powerCordBlue);
    cordB.position.y = y;
    group.add(cordA, cordB);
  }

  _registerPortLedRow(pendingLeds, y, count, kind) {
    const span = 0.56;
    for (let i = 0; i < count; i++) {
      const lx = -span / 2 + (i / Math.max(1, count - 1)) * span;
      pendingLeds.push({
        x: lx,
        y,
        z: 0.415,
        kind,
        seed: i * 17 + Math.round(y * 100),
      });
    }
  }

  _buildInspectMeta(type, code, podName) {
    if (type === 'switch') {
      return {
        category: 'Ağ & Switch Kabini (Spine / Leaf)',
        name: `${code} (${podName} · Ağ Omurgası)`,
        specs: '400GbE Spine + 48×25GbE Leaf Switchler · 384 Aktif Fiber Port · Çift PSU A+B',
      };
    }
    if (type === 'storage') {
      return {
        category: 'Depolama & SAN Kabini',
        name: `${code} (${podName} · NVMe All-Flash)`,
        specs: '1.2 PB NVMe Kapasite · Çift 64G FC SAN Switch · Yük: 21.4 kW · Giriş: 20.3°C',
      };
    }
    if (type === 'security') {
      return {
        category: 'Fiziksel Güvenlik & NVR Kabini',
        name: `${code} (${podName} · Erişim Kontrol)`,
        specs: '4K PoE CCTV NVR Kayıt + Biyometrik Mantrap & X-Ray Sunucu · Çift Besleme A+B',
      };
    }
    if (type === 'staging') {
      return {
        category: 'Test & Burn-In Kurulum Kabini',
        name: `${code} (Staging · Sunucu Ön Hazırlık)`,
        specs: '100G Sunucu Salonu Uplink · PXE Ön Kurulum & Termal Test · Çift Besleme A+B',
      };
    }
    return {
      category: '42U Hesaplama Sunucu Kabini',
      name: `${code} (${podName})`,
      specs: '10× 1U/2U Hesaplama Düğümü + 2× ToR Switch · Yük: 17.6 kW · Giriş: 20.5°C',
    };
  }

  /**
   * Call once after all cabinets have been placed in world space to bake
   * all blinking switch & server LEDs into a single 1-draw-call InstancedMesh!
   */
  finalizeLedSystem(scene, cabinets) {
    cabinets.forEach((cab) => {
      cab.updateMatrixWorld(true);
      const pending = cab.userData._pendingLeds || [];
      pending.forEach((led) => {
        _tempPos.set(led.x, led.y, led.z);
        cab.localToWorld(_tempPos);
        cab.getWorldQuaternion(_tempQuat);
        this.ledDefs.push({
          pos: _tempPos.clone(),
          quat: _tempQuat.clone(),
          kind: led.kind,
          seed: led.seed + this.ledDefs.length * 7,
        });
      });
      delete cab.userData._pendingLeds;
    });

    const total = this.ledDefs.length;
    if (total === 0) return () => {};

    const ledGeo = new THREE.BoxGeometry(0.018, 0.011, 0.012);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const inst = new THREE.InstancedMesh(ledGeo, ledMat, total);
    inst.instanceMatrix.setUsage(THREE.StaticDrawUsage);

    for (let i = 0; i < total; i++) {
      const def = this.ledDefs[i];
      _tempMat.compose(def.pos, def.quat, _tempScale);
      inst.setMatrixAt(i, _tempMat);
      inst.setColorAt(i, _ledColor.setHex(0x22c55e));
    }
    inst.instanceMatrix.needsUpdate = true;
    inst.instanceColor.needsUpdate = true;
    inst.computeBoundingSphere();
    scene.add(inst);

    // Zero-allocation per-frame blink update
    let lastUpdate = -1;
    const updateLeds = (elapsed) => {
      // Update ~24Hz for crisp natural switch traffic flicker without needless CPU churn
      if (elapsed - lastUpdate < 0.042) return;
      lastUpdate = elapsed;

      for (let i = 0; i < total; i++) {
        const def = this.ledDefs[i];
        const s = def.seed;

        if (def.kind === 'switch') {
          // Rapid asynchronous packet-burst blinking across green, cyan, and amber
          const wave = Math.sin(elapsed * (9.0 + (s % 7) * 2.1) + s * 1.37);
          const burst = Math.cos(elapsed * (17.0 + (s % 5) * 3.3) + s * 0.71);
          if (wave > 0.25 && burst > -0.2) {
            _ledColor.setHex(s % 5 === 0 ? 0xf59e0b : s % 3 === 0 ? 0x38bdf8 : 0x22c55e);
          } else if (wave < -0.55) {
            _ledColor.setHex(0x09161a);
          } else {
            _ledColor.setHex(0x0f766e);
          }
        } else if (def.kind === 'storage') {
          // Steady amber/green status with periodic I/O flashes
          const io = Math.sin(elapsed * (6.5 + (s % 4) * 1.9) + s);
          if (s % 4 === 0) {
            _ledColor.setHex(io > 0.35 ? 0xfbbf24 : 0x451a03);
          } else {
            _ledColor.setHex(io > -0.4 ? 0x22c55e : 0x052e16);
          }
        } else {
          // Compute server: steady green power + blinking cyan/blue disk activity
          if (s % 3 === 0) {
            _ledColor.setHex(0x22c55e);
          } else {
            const act = Math.sin(elapsed * (8.0 + (s % 6) * 2.2) + s * 2.1);
            _ledColor.setHex(act > 0.2 ? 0x38bdf8 : 0x0c2438);
          }
        }
        inst.setColorAt(i, _ledColor);
      }
      inst.instanceColor.needsUpdate = true;
    };

    return updateLeds;
  }
}
