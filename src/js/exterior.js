import * as THREE from 'three';
import { createCityFacadeTexture, createSignTexture } from './textures.js';
import { createCarsPack, PAINT_PRESETS } from '../three/carsPack.ts';

function addBoxCollider(colliders, minX, maxX, minZ, maxZ, gateRef = null) {
  colliders.push({ minX, maxX, minZ, maxZ, gateRef });
}

function attachCarInspectable(carRig, paintId, inspectables) {
  const spec = carRig.spec;
  const effectivePaintId = paintId ?? spec.defaultPaintId;
  const paintPreset = PAINT_PRESETS.find((p) => p.id === effectivePaintId);
  const paintLabel = paintPreset ? paintPreset.name : 'Özel Metalik';

  carRig.root.traverse((child) => {
    if (!child.isMesh || child === carRig.contactShadow) return;
    const partTitle = child.userData?.partInfo?.title;
    child.userData.inspect = {
      category: `${spec.category} (${spec.year})`,
      name: `${spec.name} · ${paintLabel}`,
      specs: partTitle
        ? `${partTitle} · ${spec.engine} · ${spec.power} · 0-100: ${spec.acceleration} · Maks: ${spec.topSpeed}`
        : `${spec.engine} · ${spec.power} · 0-100: ${spec.acceleration} · Maks: ${spec.topSpeed}`,
    };
    inspectables.push(child);
  });
}

function createCityBuilding({ w, h, d, facadeColor, windowColor, trimMat }) {
  const group = new THREE.Group();
  const facadeTex = createCityFacadeTexture(facadeColor, windowColor);
  const facadeMat = new THREE.MeshStandardMaterial({
    map: facadeTex,
    roughness: 0.68,
    metalness: 0.16,
  });

  // Ground podium base
  const podiumH = Math.min(3.6, h * 0.2);
  const podium = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, podiumH, d + 0.6), trimMat);
  podium.position.y = podiumH / 2;
  podium.castShadow = true;
  podium.receiveShadow = true;
  group.add(podium);

  // Main tower volume
  const towerH = h - podiumH;
  const tower = new THREE.Mesh(new THREE.BoxGeometry(w, towerH, d), facadeMat);
  tower.position.y = podiumH + towerH / 2;
  tower.castShadow = true;
  tower.receiveShadow = true;
  group.add(tower);

  // Rooftop parapet collar
  const parapet = new THREE.Mesh(new THREE.BoxGeometry(w + 0.35, 0.55, d + 0.35), trimMat);
  parapet.position.y = h + 0.25;
  group.add(parapet);

  // Mechanical penthouse on roof
  const mechBox = new THREE.Mesh(new THREE.BoxGeometry(w * 0.42, 2.1, d * 0.42), trimMat);
  mechBox.position.set(0, h + 1.15, 0);
  mechBox.castShadow = true;
  group.add(mechBox);

  // Rooftop communications mast
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 3.6, 8), trimMat);
  mast.position.set(w * 0.18, h + 2.8, -d * 0.15);
  group.add(mast);

  return group;
}

function createDieselGenerator(index, materials, inspectables) {
  const group = new THREE.Group();

  // 1. Concrete Spill-Containment Plinth + 4 Safety Corner Bollards
  const pad = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.24, 7.0), materials.sidewalk);
  pad.position.y = 0.12;
  pad.receiveShadow = true;
  group.add(pad);

  for (const [bx, bz] of [
    [-1.56, -3.32],
    [1.56, -3.32],
    [-1.56, 3.32],
    [1.56, 3.32],
  ]) {
    const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.85, 10), materials.generatorYellow);
    bollard.position.set(bx, 0.66, bz);
    bollard.castShadow = true;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 10), materials.darkSteelTrim);
    cap.position.set(bx, 1.09, bz);
    group.add(bollard, cap);
  }

  // 2. Heavy Double-Wall Belly Fuel Tank + Fuel Fill Port & Copper Earth Strap
  const tank = new THREE.Mesh(new THREE.BoxGeometry(2.48, 0.56, 5.96), materials.darkSteelTrim);
  tank.position.y = 0.52;
  tank.castShadow = true;
  tank.receiveShadow = true;
  group.add(tank);

  // Forklift pockets & fuel level sight glass on West tank wall
  for (const pz of [-1.2, 1.2]) {
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(2.52, 0.14, 0.34), materials.cableDataDark);
    pocket.position.set(0, 0.42, pz);
    group.add(pocket);
  }
  const fuelNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.18, 10), materials.chrome);
  fuelNeck.position.set(-1.14, 0.86, 2.25);
  const sightGauge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.34, 0.06), materials.greenLed);
  sightGauge.position.set(-1.25, 0.54, 2.25);
  const earthStrap = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.08), materials.copperBus);
  earthStrap.position.set(-1.32, 0.34, -2.55);
  group.add(fuelNeck, sightGauge, earthStrap);

  // 3. Containerized Acoustic Enclosure Canopy + Dark Steel Corner Structural Frame
  const enclosure = new THREE.Mesh(new THREE.BoxGeometry(2.34, 2.12, 5.72), materials.generatorYellow);
  enclosure.position.y = 1.86;
  enclosure.castShadow = true;
  enclosure.receiveShadow = true;
  group.add(enclosure);

  // Corner steel posts & top perimeter roof fascia frame
  for (const cx of [-1.14, 1.14]) {
    for (const cz of [-2.82, 2.82]) {
      const cPost = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.16, 0.14), materials.darkSteelTrim);
      cPost.position.set(cx, 1.86, cz);
      group.add(cPost);
    }
    const roofRail = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 5.78), materials.darkSteelTrim);
    roofRail.position.set(cx, 2.91, 0);
    group.add(roofRail);
  }
  for (const cz of [-2.82, 2.82]) {
    const roofEnd = new THREE.Mesh(new THREE.BoxGeometry(2.42, 0.14, 0.14), materials.darkSteelTrim);
    roofEnd.position.set(0, 2.91, cz);
    group.add(roofEnd);
  }

  // 3 Recessed Acoustic Service Access Doors per side + Chrome T-Latches & Intake Louvers
  for (const sx of [-1, 1]) {
    for (const dz of [-1.6, 0, 1.6]) {
      const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.56, 1.16), materials.darkSteelTrim);
      doorFrame.position.set(sx * 1.165, 1.78, dz);
      const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.46, 1.06), materials.generatorYellow);
      doorPanel.position.set(sx * 1.17, 1.78, dz);
      const latch = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, 0.05), materials.chrome);
      latch.position.set(sx * 1.21, 1.66, dz + 0.36);
      group.add(doorFrame, doorPanel, latch);

      // Horizontal acoustic louver slats on lower half of side doors
      for (let l = 0; l < 4; l++) {
        const louver = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.78), materials.darkSteelTrim);
        louver.position.set(sx * 1.2, 1.22 + l * 0.11, dz);
        group.add(louver);
      }
    }
  }

  // 4. Front Motorized Radiator Discharge Grille (South z = +2.88) & Rear Air-Intake Attenuator (North z = -2.88)
  const radPlenum = new THREE.Mesh(new THREE.BoxGeometry(1.88, 1.54, 0.12), materials.darkSteelTrim);
  radPlenum.position.set(0, 1.86, 2.86);
  group.add(radPlenum);
  for (let s = 0; s < 7; s++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.05, 0.15), materials.aluCladding);
    slat.position.set(0, 1.22 + s * 0.21, 2.87);
    group.add(slat);
  }

  const intakeHood = new THREE.Mesh(new THREE.BoxGeometry(1.94, 1.48, 0.24), materials.darkSteelTrim);
  intakeHood.position.set(0, 1.88, -2.92);
  group.add(intakeHood);
  for (let s = 0; s < 6; s++) {
    const baf = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.045, 0.26), materials.aluCladding);
    baf.position.set(0, 1.3 + s * 0.22, -2.93);
    group.add(baf);
  }

  // 5. West-Side Control/Sync HMI Cabinet & Generator Output Circuit Breaker (GCB) Box
  const ctrlCab = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.96, 0.72), materials.darkSteelTrim);
  ctrlCab.position.set(-1.24, 1.76, 1.56);
  const ctrlScreen = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.28, 0.36), materials.coldStrip);
  ctrlScreen.position.set(-1.37, 1.94, 1.56);
  const ctrlLed = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.08, 0.12), materials.greenLed);
  ctrlLed.position.set(-1.37, 2.15, 1.56);
  const ctrlEstop = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 10), materials.fireRed);
  ctrlEstop.rotation.z = Math.PI / 2;
  ctrlEstop.position.set(-1.37, 1.54, 1.72);
  group.add(ctrlCab, ctrlScreen, ctrlLed, ctrlEstop);

  // Generator Circuit Breaker (GCB 4000A) Termination Box at West-North (x = -1.24, z = -1.75)
  const gcbBox = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.02, 0.76), materials.aluCladding);
  gcbBox.position.set(-1.24, 1.46, -1.75);
  gcbBox.castShadow = true;
  const gcbDoor = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.88, 0.64), materials.darkSteelTrim);
  gcbDoor.position.set(-1.4, 1.46, -1.75);
  const gcbSign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.36, 0.34),
    new THREE.MeshBasicMaterial({ map: createSignTexture(`JENERATÖR GEN-0${index}`, '2.5 MVA · 400V · 4000A GCB', '#f59e0b') })
  );
  gcbSign.rotation.y = -Math.PI / 2;
  gcbSign.position.set(-1.21, 2.66, 0);
  group.add(gcbBox, gcbDoor, gcbSign);

  // 6. Roof Acoustic Silencer, Heat-Shield Bands, Vertical Exhaust Stack & Rain-Cap + Lifting Lugs
  for (const lz of [-0.1, -1.1]) {
    const cradle = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.24, 0.12), materials.darkSteelTrim);
    cradle.position.set(0, 3.02, lz);
    group.add(cradle);
  }
  const muffler = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 2.35, 18), materials.chrome);
  muffler.rotation.x = Math.PI / 2;
  muffler.position.set(0, 3.36, -0.58);
  muffler.castShadow = true;
  group.add(muffler);

  for (const bz of [-1.45, -0.58, 0.3]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.022, 8, 20), materials.darkSteelTrim);
    band.position.set(0, 3.36, bz);
    group.add(band);
  }

  // Flex exhaust drop into canopy roof
  const flexPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.55, 12), materials.darkSteelTrim);
  flexPipe.position.set(0, 3.06, 0.32);
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.17, 1.45, 14), materials.chrome);
  stack.position.set(0, 4.18, -1.52);
  stack.castShadow = true;
  const rainCap = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.03, 14), materials.darkSteelTrim);
  rainCap.position.set(0, 4.94, -1.52);
  rainCap.rotation.x = -0.28;
  group.add(flexPipe, stack, rainCap);

  // 4 Corner Roof Lifting Lugs
  for (const [lx, lz] of [
    [-1.08, -2.72],
    [1.08, -2.72],
    [-1.08, 2.72],
    [1.08, 2.72],
  ]) {
    const lug = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.02, 6, 12), materials.darkSteelTrim);
    lug.position.set(lx, 3.02, lz);
    group.add(lug);
  }

  // Inspection hit-proxy
  enclosure.userData.inspect = {
    category: 'Yedek Güç Ünitesi',
    name: `Konteyner Tipi Dizel Jeneratör GEN-0${index}`,
    specs: '2.5 MVA · 400V / 50Hz · 4000A Çıkış Şalteri (GCB) · 72 Saat Çift Cidar Yakıt Tankı · Otomatik Senkron',
  };
  inspectables.push(enclosure);

  return group;
}

function createChillerUnit(index, materials, inspectables, animatedFans) {
  const group = new THREE.Group();

  // 1. Concrete plinth + 4 spring vibration isolators
  const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.2, 4.9), materials.sidewalk);
  plinth.position.y = 0.1;
  plinth.receiveShadow = true;
  group.add(plinth);

  for (const [ix, iz] of [
    [-1.08, -2.05],
    [1.08, -2.05],
    [-1.08, 2.05],
    [1.08, 2.05],
  ]) {
    const iso = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.12, 10), materials.generatorYellow);
    iso.position.set(ix, 0.26, iz);
    group.add(iso);
  }

  // 2. Heavy Structural Steel Skid & Perimeter Portal Frame
  for (const sx of [-1.08, 1.08]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 4.46), materials.darkSteelTrim);
    rail.position.set(sx, 0.39, 0);
    rail.castShadow = true;
    group.add(rail);
  }
  for (const cz of [-2.17, -0.75, 0.75, 2.17]) {
    const cross = new THREE.Mesh(new THREE.BoxGeometry(2.28, 0.12, 0.12), materials.darkSteelTrim);
    cross.position.set(0, 0.38, cz);
    group.add(cross);
  }
  for (const px of [-1.1, 1.1]) {
    for (const pz of [-2.16, 0, 2.16]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.11, 1.76, 0.11), materials.darkSteelTrim);
      post.position.set(px, 1.24, pz);
      post.castShadow = true;
      group.add(post);
    }
  }

  // Top perimeter cowl beams framing the open fan deck
  for (const sx of [-1.1, 1.1]) {
    const topSide = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 4.46), materials.cracBody);
    topSide.position.set(sx, 2.02, 0);
    topSide.castShadow = true;
    group.add(topSide);
  }
  for (const sz of [-2.17, 2.17]) {
    const topEnd = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.24, 0.18), materials.cracBody);
    topEnd.position.set(0, 2.02, sz);
    topEnd.castShadow = true;
    group.add(topEnd);
  }

  // 3. Lower Mechanical Bay: Insulated Evaporator Drum + Twin Screw Compressors
  const evapShell = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 2.8, 18), materials.darkSteelTrim);
  evapShell.rotation.x = Math.PI / 2;
  evapShell.position.set(0, 0.72, 0.25);
  evapShell.castShadow = true;
  group.add(evapShell);

  for (const bz of [-0.7, 0, 0.7, 1.4]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.018, 8, 20), materials.chrome);
    band.position.set(0, 0.72, bz);
    group.add(band);
  }

  // South waterbox & flanged chilled-water outlet/inlet stubs (aligning cleanly with collector branch drops)
  const waterbox = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.56, 0.34), materials.aluCladding);
  waterbox.position.set(0, 0.76, 1.78);
  group.add(waterbox);

  const outStub = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.36, 12), materials.pipeSupply);
  outStub.rotation.x = Math.PI / 2;
  outStub.position.set(-0.36, 0.68, 2.08);
  const inStub = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.36, 12), materials.pipeReturn);
  inStub.rotation.x = Math.PI / 2;
  inStub.position.set(0.36, 0.9, 2.08);
  group.add(outStub, inStub);

  // Twin industrial screw compressors + copper discharge risers
  for (const sx of [-0.58, 0.58]) {
    const comp = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 1.05, 14), materials.pipeSupply);
    comp.rotation.x = Math.PI / 2;
    comp.position.set(sx, 0.68, -0.95);
    comp.castShadow = true;
    const oilSep = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.45, 12), materials.darkSteelTrim);
    oilSep.position.set(sx, 0.92, -0.58);
    const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.62, 10), materials.copperBus);
    riser.position.set(sx * 0.85, 1.24, -0.58);
    group.add(comp, oilSep, riser);
  }

  // North-facing VFD & BMS Electrical Control Panel Cabinet (visible from Chiller Yard front)
  const vfdCab = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.15, 0.28), materials.cracBody);
  vfdCab.position.set(-0.42, 1.08, -2.14);
  vfdCab.castShadow = true;
  const vfdHmi = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.22, 0.03), materials.coldStrip);
  vfdHmi.position.set(-0.66, 1.32, -2.29);
  const vfdLed = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.03), materials.greenLed);
  vfdLed.position.set(-0.36, 1.36, -2.29);
  const vfdEstop = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.04, 10), materials.fireRed);
  vfdEstop.rotation.x = Math.PI / 2;
  vfdEstop.position.set(-0.36, 1.18, -2.29);
  const chSign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.96, 0.24),
    new THREE.MeshBasicMaterial({ map: createSignTexture(`CHILLER CH-0${index}`, '850 kW · VFD FREE-COOLING', '#38bdf8') })
  );
  chSign.position.set(0.45, 1.88, -2.27);
  chSign.rotation.y = Math.PI;
  group.add(vfdCab, vfdHmi, vfdLed, vfdEstop, chSign);

  // 4. Angled V-Bank Microchannel Condenser Coils + Side Louver Protection Bars
  for (const sx of [-1, 1]) {
    const coilBank = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.98, 4.08), materials.aluCladding);
    coilBank.position.set(sx * 0.84, 1.52, 0);
    coilBank.rotation.z = sx * -0.34;
    coilBank.castShadow = true;
    coilBank.receiveShadow = true;
    group.add(coilBank);

    const coilCore = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.86, 3.92), materials.darkSteelTrim);
    coilCore.position.set(sx * 0.84, 1.52, 0);
    coilCore.rotation.z = sx * -0.34;
    group.add(coilCore);

    // Side protective louver ribs
    for (let b = 0; b < 4; b++) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.035, 4.24), materials.cracBody);
      bar.position.set(sx * 1.14, 1.12 + b * 0.23, 0);
      group.add(bar);
    }
  }

  // 5. Recessed Top Fan Plenum + 3 Open-Well EC Axial Fans with Visible Pitch Blades & Guards
  const fanDeck = new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.06, 4.18), materials.darkSteelTrim);
  fanDeck.position.set(0, 1.96, 0);
  group.add(fanDeck);

  const openShroudMat = materials.darkSteelTrim.clone();
  openShroudMat.side = THREE.DoubleSide;

  for (let f = -1; f <= 1; f++) {
    const fz = f * 1.32;

    // Dark recessed fan well floor so spinning chrome blades pop cleanly
    const well = new THREE.Mesh(new THREE.CircleGeometry(0.53, 24), materials.cableDataDark);
    well.rotation.x = -Math.PI / 2;
    well.position.set(0, 1.995, fz);
    group.add(well);

    // Open-ended cylindrical shroud + top bellmouth collar ring
    const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.52, 0.24, 24, 1, true), openShroudMat);
    shroud.position.set(0, 2.08, fz);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.032, 10, 28), materials.cracBody);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 2.2, fz);
    group.add(shroud, rim);

    // Spinning 4-blade EC axial rotor inside open shroud
    const fanRotor = new THREE.Group();
    fanRotor.position.set(0, 2.08, fz);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.13, 0.09, 14), materials.chrome);
    fanRotor.add(hub);
    for (let bl = 0; bl < 4; bl++) {
      const bladeWrap = new THREE.Group();
      bladeWrap.rotation.y = (bl * Math.PI) / 2;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.018, 0.15), materials.chrome);
      blade.position.x = 0.28;
      blade.rotation.x = 0.34;
      bladeWrap.add(blade);
      fanRotor.add(bladeWrap);
    }
    group.add(fanRotor);
    animatedFans.push(fanRotor);

    // Concentric wire safety guard rings over fan well
    for (const gr of [0.24, 0.42]) {
      const guard = new THREE.Mesh(new THREE.TorusGeometry(gr, 0.01, 6, 22), materials.chrome);
      guard.rotation.x = Math.PI / 2;
      guard.position.set(0, 2.2, fz);
      group.add(guard);
    }
    for (let sp = 0; sp < 2; sp++) {
      const spoke = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1.06, 6), materials.chrome);
      spoke.rotation.z = Math.PI / 2;
      spoke.rotation.y = (sp * Math.PI) / 2;
      spoke.position.set(0, 2.2, fz);
      group.add(spoke);
    }
  }

  // Inspection hit-proxy wrapping chiller
  const hitProxy = new THREE.Mesh(
    new THREE.BoxGeometry(2.45, 2.15, 4.45),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  hitProxy.position.y = 1.15;
  hitProxy.userData.inspect = {
    category: 'Dış Soğutma Grubu',
    name: `Hava Soğutmalı V-Coil Chiller CH-0${index}`,
    specs: '850 kW · Çift Vidalı Kompresör · 3× EC Aksiyel Fan · Gidiş 7°C / Dönüş 12°C · Free-Cooling',
  };
  group.add(hitProxy);
  inspectables.push(hitProxy);

  return group;
}

function addLatticeStrut(parent, p1, p2, radius, mat) {
  const dir = new THREE.Vector3().subVectors(p2, p1);
  const len = dir.length();
  if (len < 0.001) return;
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, len, 6), mat);
  mesh.position.copy(p1).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  mesh.castShadow = true;
  parent.add(mesh);
}

function createCatenaryWire(p1, p2, sag, radius, mat, segments = 14) {
  const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
  mid.y -= sag;
  const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
  const geom = new THREE.TubeGeometry(curve, segments, radius, 6, false);
  return new THREE.Mesh(geom, mat);
}

function createInsulatorString(length, discs, ceramicMat, metalMat) {
  const grp = new THREE.Group();
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, length, 8), metalMat);
  core.position.y = -length * 0.5;
  grp.add(core);
  for (let i = 0; i < discs; i++) {
    const t = (i + 0.7) / (discs + 0.4);
    const shed = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.125, 0.045, 12), ceramicMat);
    shed.position.y = -t * length;
    grp.add(shed);
  }
  return grp;
}

function createTransmissionPylon({
  height = 15.8,
  baseHalf = 1.45,
  topHalf = 0.32,
  tiers = 6,
  crossarms = [],
  materials,
  hasBeacon = true,
}) {
  const group = new THREE.Group();
  const mat = materials.powerTray;
  const darkMat = materials.darkSteelTrim;

  // 4 Concrete Foundation Piers
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const pier = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.44, 0.62), materials.sidewalk);
      pier.position.set(sx * baseHalf, 0.22, sz * baseHalf);
      pier.castShadow = true;
      pier.receiveShadow = true;
      group.add(pier);
    }
  }

  const bodyTopY = height - 1.65;
  const halfAt = (y) => {
    const t = Math.min(1, Math.max(0, y / bodyTopY));
    return THREE.MathUtils.lerp(baseHalf, topHalf, t * 0.92);
  };

  const corners = (y) => {
    const h = halfAt(y);
    return [
      new THREE.Vector3(-h, y, -h),
      new THREE.Vector3(h, y, -h),
      new THREE.Vector3(h, y, h),
      new THREE.Vector3(-h, y, h),
    ];
  };

  for (let t = 0; t < tiers; t++) {
    const y0 = 0.4 + (t / tiers) * (bodyTopY - 0.4);
    const y1 = 0.4 + ((t + 1) / tiers) * (bodyTopY - 0.4);
    const c0 = corners(y0);
    const c1 = corners(y1);
    const legR = t < 2 ? 0.068 : 0.052;
    const braceR = t < 2 ? 0.032 : 0.025;

    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      // Corner legs
      addLatticeStrut(group, c0[i], c1[i], legR, mat);
      // Horizontal girts
      addLatticeStrut(group, c1[i], c1[j], braceR * 1.1, mat);
      // X-diagonals on every face
      addLatticeStrut(group, c0[i], c1[j], braceR, mat);
      addLatticeStrut(group, c0[j], c1[i], braceR, mat);
    }
  }

  // Earth-wire tapered spire peak
  const peakBase = corners(bodyTopY);
  const peakTip = new THREE.Vector3(0, height, 0);
  peakBase.forEach((p) => addLatticeStrut(group, p, peakTip, 0.038, mat));

  const lightningRod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.03, 0.7, 6), materials.chrome);
  lightningRod.position.set(0, height + 0.35, 0);
  group.add(lightningRod);

  if (hasBeacon) {
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 10), materials.fireRed);
    beacon.position.set(0, height + 0.05, 0);
    group.add(beacon);
  }

  const ceramicMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.25, metalness: 0.12 });
  const attachPoints = { peak: peakTip.clone(), armTips: [] };

  crossarms.forEach((arm) => {
    const ay = arm.y;
    const wHalf = arm.span * 0.5;
    const bodyH = halfAt(ay);

    // Main horizontal double-angle crossarm truss + diagonal hanger struts
    for (const az of [-0.18, 0.18]) {
      addLatticeStrut(
        group,
        new THREE.Vector3(-wHalf, ay, az),
        new THREE.Vector3(wHalf, ay, az),
        0.044,
        mat
      );
    }
    addLatticeStrut(group, new THREE.Vector3(-wHalf, ay, -0.18), new THREE.Vector3(-wHalf, ay, 0.18), 0.036, mat);
    addLatticeStrut(group, new THREE.Vector3(wHalf, ay, -0.18), new THREE.Vector3(wHalf, ay, 0.18), 0.036, mat);

    // Angled tension ties up to tower body
    const tieTopY = Math.min(bodyTopY, ay + 1.15);
    const tieH = halfAt(tieTopY);
    addLatticeStrut(group, new THREE.Vector3(-wHalf * 0.92, ay, 0), new THREE.Vector3(-tieH, tieTopY, -tieH * 0.6), 0.03, mat);
    addLatticeStrut(group, new THREE.Vector3(-wHalf * 0.92, ay, 0), new THREE.Vector3(-tieH, tieTopY, tieH * 0.6), 0.03, mat);
    addLatticeStrut(group, new THREE.Vector3(wHalf * 0.92, ay, 0), new THREE.Vector3(tieH, tieTopY, -tieH * 0.6), 0.03, mat);
    addLatticeStrut(group, new THREE.Vector3(wHalf * 0.92, ay, 0), new THREE.Vector3(tieH, tieTopY, tieH * 0.6), 0.03, mat);

    // Crossarm internal lattice triangles
    for (let x = -wHalf + 0.65; x < wHalf - 0.35; x += 0.95) {
      if (Math.abs(x) < bodyH * 0.7) continue;
      addLatticeStrut(group, new THREE.Vector3(x, ay, -0.18), new THREE.Vector3(x + 0.5, ay, 0.18), 0.022, mat);
    }

    const tips = [];
    (arm.phaseOffsets || [-wHalf + 0.12, 0, wHalf - 0.12]).forEach((px) => {
      const insLen = arm.insulatorLen ?? 0.95;
      const ins = createInsulatorString(insLen, arm.discs ?? 6, ceramicMat, darkMat);
      ins.position.set(px, ay, 0);
      group.add(ins);
      tips.push(new THREE.Vector3(px, ay - insLen, 0));
    });
    attachPoints.armTips.push(tips);
  });

  group.userData.attachPoints = attachPoints;
  return group;
}

function createTransformerUnit(index, materials, inspectables) {
  const group = new THREE.Group();

  // 1. Concrete Oil-Containment Bund Plinth + Sump Grating + 4 Safety Corner Bollards
  const pad = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.26, 3.35), materials.sidewalk);
  pad.position.y = 0.13;
  pad.receiveShadow = true;
  group.add(pad);

  const bundRim = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.08, 2.65), materials.darkSteelTrim);
  bundRim.position.y = 0.28;
  group.add(bundRim);

  for (const [bx, bz] of [
    [-1.46, -1.48],
    [1.46, -1.48],
    [-1.46, 1.48],
    [1.46, 1.48],
  ]) {
    const bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.82, 10), materials.generatorYellow);
    bollard.position.set(bx, 0.67, bz);
    bollard.castShadow = true;
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.07, 10), materials.darkSteelTrim);
    cap.position.set(bx, 1.09, bz);
    group.add(bollard, cap);
  }

  // 2. Main Welded Steel Transformer Tank + Top Cover Lid + Lifting Lugs
  const tank = new THREE.Mesh(new THREE.BoxGeometry(1.66, 1.82, 1.88), materials.aluCladding);
  tank.position.y = 1.22;
  tank.castShadow = true;
  tank.receiveShadow = true;
  group.add(tank);

  const lid = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.09, 2.0), materials.darkSteelTrim);
  lid.position.y = 2.15;
  lid.castShadow = true;
  group.add(lid);

  // Side Cooling Radiator Fin Banks + Oil Collector Pipes + Cooling Fan Shrouds (East & West)
  for (const sx of [-1, 1]) {
    for (const hy of [0.68, 1.78]) {
      const hdr = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.38, 10), materials.darkSteelTrim);
      hdr.rotation.x = Math.PI / 2;
      hdr.position.set(sx * 1.02, hy, 0);
      group.add(hdr);
    }
    for (let i = -2; i <= 2; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.24, 0.075), materials.darkSteelTrim);
      fin.position.set(sx * 1.03, 1.23, i * 0.3);
      fin.castShadow = true;
      group.add(fin);
    }
    const fanRing = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 14), materials.chrome);
    fanRing.rotation.z = Math.PI / 2;
    fanRing.position.set(sx * 1.24, 1.23, 0);
    group.add(fanRing);
  }

  // 3. Cylindrical Oil Conservator Expansion Tank + Buchholz Relay & Breather Pipe (South-Top)
  for (const bx of [-0.42, 0.42]) {
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.06), materials.darkSteelTrim);
    bracket.position.set(bx, 2.38, 0.56);
    group.add(bracket);
  }
  const conservator = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 1.28, 16), materials.cracBody);
  conservator.rotation.z = Math.PI / 2;
  conservator.position.set(0, 2.66, 0.56);
  conservator.castShadow = true;
  const buchholz = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.22), materials.generatorYellow);
  buchholz.position.set(0, 2.36, 0.3);
  const breather = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.55, 8), materials.coldStrip);
  breather.position.set(-0.68, 2.35, 0.56);
  group.add(conservator, buchholz, breather);

  // 4. 3x Ribbed 34.5 kV Porcelain HV Bushings + Surge Arresters (Parafudr) on North Top
  const bushMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.26, metalness: 0.12 });
  for (let b = -1; b <= 1; b++) {
    const bx = b * 0.48;
    const hvStem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.065, 0.78, 12), bushMat);
    hvStem.position.set(bx, 2.58, -0.34);
    hvStem.castShadow = true;
    group.add(hvStem);
    for (let s = 0; s < 4; s++) {
      const shed = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.04, 12), bushMat);
      shed.position.set(bx, 2.34 + s * 0.16, -0.34);
      group.add(shed);
    }
    const lugCap = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.09, 10), materials.copperBus);
    lugCap.position.set(bx, 2.99, -0.34);
    group.add(lugCap);

    // Adjacent Surge Arrester (Parafudr) at z = -0.76
    const arrStem = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.044, 0.54, 10), materials.cracBody);
    arrStem.position.set(bx, 2.46, -0.76);
    const arrTop = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.06, 8), materials.copperBus);
    arrTop.position.set(bx, 2.76, -0.76);
    const arrJump = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.42, 6), materials.copperBus);
    arrJump.rotation.x = Math.PI / 2;
    arrJump.position.set(bx, 2.75, -0.55);
    group.add(arrStem, arrTop, arrJump);
  }

  // 5. South 400V LV Enclosed Bus-Duct Throat + Relay Marshalling Box + Nameplate Sign
  const lvThroat = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.58, 0.34), materials.darkSteelTrim);
  lvThroat.position.set(0, 1.56, 1.06);
  lvThroat.castShadow = true;
  const marshalling = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.78, 0.24), materials.cracBody);
  marshalling.position.set(-0.48, 1.12, 1.04);
  const mScreen = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.03), materials.coldStrip);
  mScreen.position.set(-0.48, 1.28, 1.17);
  const trSign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.92, 0.23),
    new THREE.MeshBasicMaterial({ map: createSignTexture(`TRAFO TR-0${index}`, '34.5kV / 400V · 3150 kVA', '#f59e0b') })
  );
  trSign.position.set(0.28, 1.98, 0.95);
  group.add(lvThroat, marshalling, mScreen, trSign);

  const earthStrap = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.06), materials.copperBus);
  earthStrap.position.set(0.86, 0.48, 0.94);
  group.add(earthStrap);

  tank.userData.inspect = {
    category: 'Orta Gerilim Trafo Merkezi',
    name: `Güç Trafosu TR-0${index} (3150 kVA)`,
    specs: '34.5 kV / 0.4 kV · Buchholz & Parafudr Korumalı · Genleşme Depolu · Direkt Güç & UPS Odası Beslemesi',
  };
  inspectables.push(tank);

  return group;
}

function buildPedestrianCampusGate(materials, colliders, inspectables, animatedGates) {
  const gateGroup = new THREE.Group();
  const centerX = -10.5;
  const gateZ = 23.0;

  // Concrete approach apron linking plaza (z=22.25) to roadSouth (z=24.0)
  const approach = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.07, 2.2), materials.plazaTile);
  approach.position.set(centerX, 0.035, 23.1);
  approach.receiveShadow = true;
  gateGroup.add(approach);

  // Heavy architectural portal piers
  for (const px of [-13.35, -7.65]) {
    const pier = new THREE.Mesh(new THREE.BoxGeometry(0.56, 3.55, 0.68), materials.darkSteelTrim);
    pier.position.set(px, 1.775, gateZ);
    pier.castShadow = true;
    pier.receiveShadow = true;
    gateGroup.add(pier);

    const trimCap = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.16, 0.76), materials.aluCladding);
    trimCap.position.set(px, 3.58, gateZ);
    gateGroup.add(trimCap);
  }

  // Overhead illuminated architectural canopy beam
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.52, 0.92), materials.darkSteelTrim);
  canopy.position.set(centerX, 3.65, gateZ);
  canopy.castShadow = true;
  gateGroup.add(canopy);

  const canopyBand = new THREE.Mesh(new THREE.BoxGeometry(6.54, 0.07, 0.94), materials.aluCladding);
  canopyBand.position.set(centerX, 3.92, gateZ);
  gateGroup.add(canopyBand);

  const signTex = createSignTexture('NEXA VERİ MERKEZİ', 'KAMPÜS YAYA & PROTOKOL GİRİŞİ', '#38bdf8');
  const signMat = new THREE.MeshBasicMaterial({ map: signTex });
  const signFront = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 0.44), signMat);
  signFront.position.set(centerX, 3.66, gateZ + 0.47);
  const signBack = new THREE.Mesh(new THREE.PlaneGeometry(3.9, 0.44), signMat);
  signBack.position.set(centerX, 3.66, gateZ - 0.47);
  signBack.rotation.y = Math.PI;
  gateGroup.add(signFront, signBack);

  // Status LED strip beneath transom
  const statusMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.5,
    roughness: 0.2,
  });
  const statusStrip = new THREE.Mesh(new THREE.BoxGeometry(5.1, 0.05, 0.12), statusMat);
  statusStrip.position.set(centerX, 3.36, gateZ);
  gateGroup.add(statusStrip);

  // Sliding glass-and-steel double gate leaves
  const leavesPivot = new THREE.Group();
  leavesPivot.position.set(centerX, 0, gateZ);
  gateGroup.add(leavesPivot);

  function buildLeaf() {
    const leaf = new THREE.Group();
    const glass = new THREE.Mesh(new THREE.BoxGeometry(2.52, 2.18, 0.06), materials.archGlass);
    glass.position.y = 1.24;
    glass.renderOrder = 3;
    leaf.add(glass);

    const frameTop = new THREE.Mesh(new THREE.BoxGeometry(2.58, 0.1, 0.1), materials.darkSteelTrim);
    frameTop.position.y = 2.34;
    const frameBot = new THREE.Mesh(new THREE.BoxGeometry(2.58, 0.14, 0.1), materials.darkSteelTrim);
    frameBot.position.y = 0.12;
    const midRail = new THREE.Mesh(new THREE.BoxGeometry(2.58, 0.07, 0.09), materials.aluCladding);
    midRail.position.y = 1.15;
    const stileIn = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.28, 0.1), materials.darkSteelTrim);
    stileIn.position.set(1.25, 1.22, 0);
    const stileOut = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.28, 0.1), materials.darkSteelTrim);
    stileOut.position.set(-1.25, 1.22, 0);
    leaf.add(frameTop, frameBot, midRail, stileIn, stileOut);
    return leaf;
  }

  const leafA = buildLeaf();
  const leafB = buildLeaf();
  leafA.position.x = -1.29;
  leafB.position.x = 1.29;
  leavesPivot.add(leafA, leafB);

  // Access control reader bollard outside South-East pier
  const bollard = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.22, 0.2), materials.darkSteelTrim);
  bollard.position.set(-7.15, 0.61, gateZ + 0.65);
  bollard.castShadow = true;
  const readerPad = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 0.04), materials.greenLed);
  readerPad.position.set(-7.15, 1.05, gateZ + 0.76);
  gateGroup.add(bollard, readerPad);

  const pedGateObj = {
    type: 'slidingDouble',
    label: 'Kampüs Yaya Protokol Kapısı',
    x: centerX,
    z: gateZ,
    triggerDistSq: 56,
    leafA,
    leafB,
    closedOffset: 1.29,
    openOffset: 3.65,
    openAmount: 0,
    manualOpen: false,
    statusMat,
  };
  animatedGates.push(pedGateObj);

  // Dynamic collider when closed
  addBoxCollider(colliders, -13.1, -7.9, gateZ - 0.35, gateZ + 0.35, pedGateObj);
  // Pier colliders
  addBoxCollider(colliders, -13.7, -13.0, gateZ - 0.45, gateZ + 0.45);
  addBoxCollider(colliders, -8.0, -7.3, gateZ - 0.45, gateZ + 0.45);

  // Clickable inspect & manual toggle on canopy & gate leaves
  [canopy, leafA.children[0], leafB.children[0], bollard].forEach((mesh) => {
    mesh.userData.inspect = {
      category: 'Kampüs Güvenlik Girişi',
      name: 'Otomatik Yaya & Protokol Kapısı (Açılır/Kapanır)',
      specs: 'Yaklaşım Sensörlü Çift Kanatlı Sürgülü Cam Kapı · RFID + İnterkom (Aç/Kapat için Tıklayın)',
    };
    mesh.userData.gateToggle = pedGateObj;
    inspectables.push(mesh);
  });

  return gateGroup;
}

function buildParkingVehicleGate(materials, colliders, inspectables, animatedGates) {
  const group = new THREE.Group();
  const centerX = 8.0;
  const gateZ = 23.0;

  // 1. Concrete curb borders flanking the 7.2m asphalt driveway
  for (const bx of [4.25, 11.75]) {
    const curb = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.18, 2.8), materials.sidewalk);
    curb.position.set(bx, 0.09, 23.1);
    curb.receiveShadow = true;
    group.add(curb);
  }

  // 2. Heavy Steel Portal Columns + Overhead Gantry ("OTOPARK & ARAÇ GİRİŞİ")
  for (const px of [4.25, 11.75]) {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.52, 3.25, 0.66), materials.darkSteelTrim);
    col.position.set(px, 1.625, gateZ);
    col.castShadow = true;
    col.receiveShadow = true;
    group.add(col);

    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.16, 0.74), materials.aluCladding);
    cap.position.set(px, 3.28, gateZ);
    group.add(cap);
  }

  const gantry = new THREE.Mesh(new THREE.BoxGeometry(8.3, 0.48, 0.74), materials.darkSteelTrim);
  gantry.position.set(centerX, 3.35, gateZ);
  gantry.castShadow = true;
  group.add(gantry);

  const gantrySignTex = createSignTexture('OTOPARK & ARAÇ GİRİŞİ', 'YETKİLİ GEÇİŞ · HGS / PLAKA OKUMA', '#f59e0b');
  const gantrySignMat = new THREE.MeshBasicMaterial({ map: gantrySignTex });
  const signSouth = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 0.42), gantrySignMat);
  signSouth.position.set(centerX, 3.35, gateZ + 0.38);
  const signNorth = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 0.42), gantrySignMat);
  signNorth.position.set(centerX, 3.35, gateZ - 0.38);
  signNorth.rotation.y = Math.PI;
  group.add(signSouth, signNorth);

  // Embedded steel floor guide rail extending East along fence pocket
  const track = new THREE.Mesh(new THREE.BoxGeometry(15.2, 0.04, 0.14), materials.chrome);
  track.position.set(11.6, 0.06, gateZ);
  group.add(track);

  // Motorized Actuator Drive Cabinet on East Pier
  const motorBox = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.72, 0.46), materials.generatorYellow);
  motorBox.position.set(12.28, 0.4, gateZ + 0.36);
  motorBox.castShadow = true;
  group.add(motorBox);

  const gateStatusMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.7,
    roughness: 0.2,
  });
  const beacon = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.18, 14), gateStatusMat);
  beacon.position.set(12.28, 0.85, gateZ + 0.36);
  const gantryLed = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.05, 0.12), gateStatusMat);
  gantryLed.position.set(centerX, 3.09, gateZ);
  group.add(beacon, gantryLed);

  // 3. Sliding Motorized Security Gate Leaf (7.05m wide x 2.02m tall, slides +X from x=8.0 to x=15.05)
  const gateLeafGroup = new THREE.Group();
  gateLeafGroup.position.set(centerX, 0.08, gateZ);
  group.add(gateLeafGroup);

  const bottomBeam = new THREE.Mesh(new THREE.BoxGeometry(7.06, 0.16, 0.12), materials.darkSteelTrim);
  bottomBeam.position.y = 0.1;
  bottomBeam.castShadow = true;
  const hazardStrip = new THREE.Mesh(new THREE.BoxGeometry(6.9, 0.06, 0.13), materials.yellowLine);
  hazardStrip.position.y = 0.1;
  const midBeam = new THREE.Mesh(new THREE.BoxGeometry(7.06, 0.08, 0.1), materials.aluCladding);
  midBeam.position.y = 1.05;
  const topBeam = new THREE.Mesh(new THREE.BoxGeometry(7.06, 0.1, 0.12), materials.darkSteelTrim);
  topBeam.position.y = 1.98;
  topBeam.castShadow = true;
  gateLeafGroup.add(bottomBeam, hazardStrip, midBeam, topBeam);

  // Vertical stiles & security pickets (InstancedMesh for crisp performance)
  const picketCount = 25;
  const picketInst = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.055, 1.84, 0.055),
    materials.darkSteelTrim,
    picketCount
  );
  const dummy = new THREE.Object3D();
  for (let i = 0; i < picketCount; i++) {
    const px = -3.42 + (i / (picketCount - 1)) * 6.84;
    dummy.position.set(px, 1.04, 0);
    dummy.updateMatrix();
    picketInst.setMatrixAt(i, dummy.matrix);
  }
  picketInst.castShadow = true;
  picketInst.computeBoundingSphere();
  gateLeafGroup.add(picketInst);

  // Transparent hit-proxy across gate leaf for easy clicking
  const gateHitProxy = new THREE.Mesh(
    new THREE.BoxGeometry(7.0, 2.0, 0.25),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  gateHitProxy.position.y = 1.04;
  gateLeafGroup.add(gateHitProxy);

  const slidingGateObj = {
    type: 'slidingSingle',
    label: 'Kampüs Araç Giriş Kapısı',
    x: centerX,
    z: gateZ,
    triggerDistSq: 105,
    target: gateLeafGroup,
    closedPos: centerX,
    openPos: 15.05,
    openAmount: 0,
    manualOpen: false,
    statusMat: gateStatusMat,
  };
  animatedGates.push(slidingGateObj);

  // 4. Compact HGS / RFID Access Kiosk + ANPR Plate Camera Mast + Parking Control Booth
  const kioskCurb = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.16, 0.92), materials.sidewalk);
  kioskCurb.position.set(4.15, 0.08, 22.05);
  kioskCurb.receiveShadow = true;
  group.add(kioskCurb);

  const kioskBase = new THREE.Mesh(new THREE.BoxGeometry(0.28, 1.28, 0.28), materials.darkSteelTrim);
  kioskBase.position.set(4.15, 0.78, 22.05);
  kioskBase.castShadow = true;
  const kioskScreen = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.26, 0.04), materials.coldStrip);
  kioskScreen.position.set(4.28, 1.24, 22.05);
  kioskScreen.rotation.y = Math.PI / 2;
  const kioskBadge = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.16), materials.greenLed);
  kioskBadge.position.set(4.3, 0.98, 22.05);
  group.add(kioskBase, kioskScreen, kioskBadge);

  // ANPR License Plate Camera Mast on East curb (x = 11.85, z = 21.7)
  const camPole = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.075, 2.75, 10), materials.darkSteelTrim);
  camPole.position.set(11.85, 1.375, 21.7);
  const camHead = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.36), materials.cracBody);
  camHead.position.set(11.65, 2.68, 21.82);
  camHead.rotation.y = 0.52;
  camHead.rotation.x = 0.28;
  const camLens = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.06, 12), materials.coldStrip);
  camLens.rotation.x = Math.PI / 2;
  camLens.position.set(11.56, 2.64, 21.96);
  group.add(camPole, camHead, camLens);

  // Compact Parking Control Cabin (OTOPARK KONTROL) at East side of gate (x = 13.7, z = 20.8)
  const pBooth = new THREE.Group();
  pBooth.position.set(13.7, 0, 20.8);
  const pbBase = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.14, 2.3), materials.sidewalk);
  pbBase.position.y = 0.07;
  const pbBody = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.45, 2.0), materials.aluCladding);
  pbBody.position.y = 1.36;
  pbBody.castShadow = true;
  const pbWin = new THREE.Mesh(new THREE.BoxGeometry(2.26, 1.05, 1.55), materials.archGlass);
  pbWin.position.y = 1.65;
  const pbRoof = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.22, 2.55), materials.darkSteelTrim);
  pbRoof.position.y = 2.68;
  pbRoof.castShadow = true;
  const pbSign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 0.36),
    new THREE.MeshBasicMaterial({ map: createSignTexture('OTOPARK KONTROL', 'OTOPARK & PLAKA TAKİP', '#38bdf8') })
  );
  pbSign.position.set(0, 2.36, 1.02);
  pBooth.add(pbBase, pbBody, pbWin, pbRoof, pbSign);
  group.add(pBooth);
  addBoxCollider(colliders, 12.4, 15.0, 19.6, 22.0);

  // Dynamic Walk Mode collider for sliding gate leaf
  addBoxCollider(colliders, 4.4, 11.6, gateZ - 0.3, gateZ + 0.3, slidingGateObj);
  // Portal column & kiosk curb colliders
  addBoxCollider(colliders, 3.8, 4.6, 21.5, 23.4);
  addBoxCollider(colliders, 11.4, 12.6, 22.4, 23.6);

  // Clickable inspectables & toggles
  [gantry, gateHitProxy, motorBox].forEach((mesh) => {
    mesh.userData.inspect = {
      category: 'Kampüs Araç Girişi',
      name: 'Motorlu Sürgülü Kampüs Kapısı',
      specs: '7.1 m Çelik Sürgülü Kapı · Otomatik Yaklaşım Sensörlü (Aç/Kapat için Tıklayın)',
    };
    mesh.userData.gateToggle = slidingGateObj;
    inspectables.push(mesh);
  });

  [kioskBase, pBooth.children[1]].forEach((mesh) => {
    mesh.userData.inspect = {
      category: 'Otopark Geçiş Kontrolü',
      name: 'HGS / RFID & Plaka Okuma (ANPR)',
      specs: 'Otomatik Kapı Tetikleme · HGS/RFID Okuyucu + ANPR Kamera (Aç/Kapat için Tıklayın)',
    };
    mesh.userData.gateToggle = slidingGateObj;
    inspectables.push(mesh);
  });

  return group;
}

export function buildExteriorCity(
  scene,
  materials,
  colliders,
  inspectables,
  animatedFans,
  animatedGates = [],
  options = {}
) {
  const exteriorGroup = new THREE.Group();
  exteriorGroup.name = 'ExteriorCity';

  // Wide terrain extending smoothly to horizon fog
  const terrain = new THREE.Mesh(new THREE.PlaneGeometry(340, 340), materials.grass);
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = -0.02;
  terrain.receiveShadow = true;
  exteriorGroup.add(terrain);

  // Concrete campus pad around Data Center
  const campusPad = new THREE.Mesh(new THREE.BoxGeometry(62, 0.06, 48), materials.sidewalk);
  campusPad.position.set(2, 0.01, -1);
  campusPad.receiveShadow = true;
  exteriorGroup.add(campusPad);

  // Entry pedestrian plaza (South-West leading to glass entrance)
  const plaza = new THREE.Mesh(new THREE.BoxGeometry(16, 0.08, 9.5), materials.plazaTile);
  plaza.position.set(-10.5, 0.04, 17.5);
  plaza.receiveShadow = true;
  exteriorGroup.add(plaza);

  // Asphalt city road grid surrounding the campus
  const roadSouth = new THREE.Mesh(new THREE.PlaneGeometry(240, 11), materials.asphalt);
  roadSouth.rotation.x = -Math.PI / 2;
  roadSouth.position.set(0, 0.02, 29.5);
  roadSouth.receiveShadow = true;
  exteriorGroup.add(roadSouth);

  const roadNorth = new THREE.Mesh(new THREE.PlaneGeometry(240, 10), materials.asphalt);
  roadNorth.rotation.x = -Math.PI / 2;
  roadNorth.position.set(0, 0.02, -31);
  roadNorth.receiveShadow = true;
  exteriorGroup.add(roadNorth);

  const roadWest = new THREE.Mesh(new THREE.PlaneGeometry(10, 240), materials.asphalt);
  roadWest.rotation.x = -Math.PI / 2;
  roadWest.position.set(-34, 0.02, 0);
  roadWest.receiveShadow = true;
  exteriorGroup.add(roadWest);

  const roadEast = new THREE.Mesh(new THREE.PlaneGeometry(10, 240), materials.asphalt);
  roadEast.rotation.x = -Math.PI / 2;
  roadEast.position.set(38, 0.02, 0);
  roadEast.receiveShadow = true;
  exteriorGroup.add(roadEast);

  // Dashed lane markings along South Avenue (InstancedMesh)
  const dashGeo = new THREE.PlaneGeometry(2.6, 0.22);
  const dashCount = 36;
  const dashes = new THREE.InstancedMesh(dashGeo, materials.roadLine, dashCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < dashCount; i++) {
    dummy.position.set(-90 + i * 5.2, 0.03, 29.5);
    dummy.rotation.set(-Math.PI / 2, 0, 0);
    dummy.updateMatrix();
    dashes.setMatrixAt(i, dummy.matrix);
  }
  dashes.computeBoundingSphere();
  exteriorGroup.add(dashes);

  // Campus Parking Lot (South-East) + Driveway Connector from South Boulevard
  const parkingLot = new THREE.Mesh(new THREE.PlaneGeometry(18, 9.4), materials.asphalt);
  parkingLot.rotation.x = -Math.PI / 2;
  parkingLot.position.set(8.0, 0.045, 18.2);
  parkingLot.receiveShadow = true;
  exteriorGroup.add(parkingLot);

  const drivewayConnector = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 2.8), materials.asphalt);
  drivewayConnector.rotation.x = -Math.PI / 2;
  drivewayConnector.position.set(8.0, 0.044, 23.3);
  drivewayConnector.receiveShadow = true;
  exteriorGroup.add(drivewayConnector);

  // Driveway lane borders & center dashes framing the sliding vehicle gate
  for (const lx of [4.65, 11.35]) {
    const edge = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 2.9), materials.yellowLine);
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(lx, 0.05, 22.95);
    exteriorGroup.add(edge);
  }
  for (const dz of [21.9, 23.3]) {
    const midDash = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.85), materials.roadLine);
    midDash.rotation.x = -Math.PI / 2;
    midDash.position.set(8.0, 0.05, dz);
    exteriorGroup.add(midDash);
  }

  // Parking bay stripes (1.2 | 4.4 | 8.0 [formerly EV bay] | 11.6 | 14.8)
  const bayStripesX = [-0.4, 2.8, 6.0, 10.0, 13.2, 16.4];
  bayStripesX.forEach((sx) => {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 4.9), materials.roadLine);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(sx, 0.05, 16.3);
    exteriorGroup.add(stripe);
  });

  // Concrete wheel stops at North end of each parked car (Blue supercar placed at x=8.0 where EV charger stood)
  const carSlotConfigs = [
    { model: 'supercar', x: 1.2, z: 16.4, rotY: 0, paint: null },
    { model: 'classic', x: 4.4, z: 16.4, rotY: 0, paint: null },
    { model: 'supercar', x: 8.0, z: 16.4, rotY: 0, paint: 'sapphire' },
    { model: 'offroad', x: 11.6, z: 16.4, rotY: 0, paint: null },
  ];

  const carsPack = createCarsPack({
    anisotropy: options.anisotropy ?? 8,
    isSoftwareGl: options.isSoftwareGl ?? false,
  });

  carSlotConfigs.forEach((slot) => {
    const wheelStop = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.11, 0.18), materials.yellowLine);
    wheelStop.position.set(slot.x, 0.1, 14.12);
    wheelStop.castShadow = true;
    exteriorGroup.add(wheelStop);

    const carRig = carsPack.buildCar(slot.model);
    if (slot.paint) {
      carRig.setPaint(slot.paint);
    }
    carRig.setHeadlights(false);
    carRig.root.position.set(slot.x, 0.048, slot.z);
    carRig.root.rotation.y = slot.rotY;
    exteriorGroup.add(carRig.root);

    attachCarInspectable(carRig, slot.paint, inspectables);
    addBoxCollider(colliders, slot.x - 1.12, slot.x + 1.12, slot.z - 2.32, slot.z + 2.32);
  });

  // Campus Gates: Pedestrian Protocol Gate (-10.5, 23.0) & Sliding Vehicle Gate (8.0, 23.0)
  exteriorGroup.add(buildPedestrianCampusGate(materials, colliders, inspectables, animatedGates));
  exteriorGroup.add(buildParkingVehicleGate(materials, colliders, inspectables, animatedGates));

  // Security Gatehouse (Güvenlik Nizamiyesi) guarding West side of Pedestrian Campus Entrance
  const gatehouse = new THREE.Group();
  gatehouse.position.set(-20.8, 0, 20.6);
  const ghBase = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.16, 3.2), materials.sidewalk);
  ghBase.position.y = 0.08;
  const ghWalls = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.8, 2.8), materials.aluCladding);
  ghWalls.position.y = 1.56;
  ghWalls.castShadow = true;
  const ghWindow = new THREE.Mesh(new THREE.BoxGeometry(3.9, 1.2, 2.3), materials.archGlass);
  ghWindow.position.y = 1.9;
  const ghRoof = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.28, 3.6), materials.darkSteelTrim);
  ghRoof.position.y = 3.1;
  ghRoof.castShadow = true;
  const ghSign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.8, 0.65),
    new THREE.MeshBasicMaterial({ map: createSignTexture('NİZAMİYE', '7/24 KAMPÜS GÜVENLİK KONTROLÜ', '#f59e0b') })
  );
  ghSign.position.set(0, 2.7, 1.42);
  gatehouse.add(ghBase, ghWalls, ghWindow, ghRoof, ghSign);
  exteriorGroup.add(gatehouse);
  ghWalls.userData.inspect = {
    category: 'Dış Güvenlik Noktası',
    name: 'Ana Nizamiye Güvenlik Merkezi',
    specs: '7/24 Ziyaretçi Kayıt · Plaka & Kimlik Doğrulama · Acil Durum Koordinasyonu',
  };
  inspectables.push(ghWalls);
  addBoxCollider(colliders, -23.1, -18.5, 18.9, 22.3);

  // Exterior Utility Yards
  // 1. East Backup Diesel Generators (x = 23.5, z = -6.5 & +1.5) + Overhead Power Cable Ladder Bridge into Güç & UPS Odası (18.0, 2.86, -11.85)
  const genYardGroup = new THREE.Group();
  exteriorGroup.add(genYardGroup);

  [-6.5, 1.5].forEach((gz, idx) => {
    const gen = createDieselGenerator(idx + 1, materials, inspectables);
    gen.position.set(23.5, 0.04, gz);
    exteriorGroup.add(gen);
    addBoxCollider(colliders, 21.7, 25.3, gz - 3.55, gz + 3.55);

    // GCB Output Vertical Power Risers + Spur Cable Ladder (from x = 22.26, y = 2.02 -> y = 2.78 -> Main Rack at x = 20.65)
    const tapZ = gz - 1.75; // -8.25 for GEN-01, -0.25 for GEN-02
    const spurTray = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.075, 0.52), materials.powerTray);
    spurTray.position.set(21.48, 2.78, tapZ);
    spurTray.castShadow = true;
    genYardGroup.add(spurTray);

    const spurSpec = [
      { dz: -0.16, mat: materials.copperBus },
      { dz: -0.06, mat: materials.cableCat6Blue },
      { dz: 0.04, mat: materials.cableDataDark },
      { dz: 0.14, mat: materials.fiberTray },
    ];
    spurSpec.forEach(({ dz, mat }) => {
      const gland = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.046, 0.08, 8), materials.chrome);
      gland.position.set(22.26, 2.04, tapZ + dz);
      const vRise = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.8, 8), mat);
      vRise.position.set(22.26, 2.44, tapZ + dz);
      const elbow = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), mat);
      elbow.position.set(22.26, 2.84, tapZ + dz);
      const hRun = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 1.62, 8), mat);
      hRun.rotation.z = Math.PI / 2;
      hRun.position.set(21.45, 2.84, tapZ + dz);
      genYardGroup.add(gland, vRise, elbow, hRun);
    });
  });

  // Main North-South Overhead Power Cable Ladder Spine along x = 20.65 (z = -11.95 .. -0.05)
  const mainGenTray = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.08, 12.1), materials.powerTray);
  mainGenTray.position.set(20.65, 2.78, -6.0);
  mainGenTray.castShadow = true;
  genYardGroup.add(mainGenTray);

  // Galvanized Steel H-Frame Support Stanchions along x = 20.65
  for (const sz of [-11.4, -8.25, -4.2, -0.25]) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.1, 0.36), materials.sidewalk);
    foot.position.set(20.65, 0.05, sz);
    for (const sx of [20.32, 20.98]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 2.74, 0.09), materials.darkSteelTrim);
      post.position.set(sx, 1.41, sz);
      post.castShadow = true;
      genYardGroup.add(post);
    }
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.09, 0.1), materials.darkSteelTrim);
    cross.position.set(20.65, 2.71, sz);
    genYardGroup.add(foot, cross);
  }

  // 90° East-to-West Overhead Cable Bridge into Güç & UPS Odası Wall Penetration (z = -11.85, x = 18.0 .. 20.98)
  const wallBridgeTray = new THREE.Mesh(new THREE.BoxGeometry(2.98, 0.08, 0.68), materials.powerTray);
  wallBridgeTray.position.set(19.49, 2.78, -11.85);
  wallBridgeTray.castShadow = true;
  const wallTransitHood = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.52, 0.86), materials.darkSteelTrim);
  wallTransitHood.position.set(18.14, 2.86, -11.85);
  genYardGroup.add(wallBridgeTray, wallTransitHood);

  // Continuous Parallel Power Cable Runs: GEN-02 (z = -0.25 -> -11.85) & GEN-01 (z = -8.25 -> -11.85) + Bridge into Wall (18.0)
  const mainCableRuns = [
    // GEN-02 L1/L2/L3/N running full length z: -0.25 -> -11.85
    { x: 20.42, z1: -11.98, z2: -0.25, mat: materials.copperBus },
    { x: 20.5, z1: -11.9, z2: -0.25, mat: materials.cableCat6Blue },
    { x: 20.58, z1: -11.82, z2: -0.25, mat: materials.cableDataDark },
    // Shared Sync/Telemetry yellow conduit
    { x: 20.65, z1: -11.74, z2: -0.25, mat: materials.fiberTray },
    // GEN-01 L1/L2/L3 joining at z = -8.25 -> -11.85
    { x: 20.73, z1: -11.98, z2: -8.25, mat: materials.copperBus },
    { x: 20.81, z1: -11.9, z2: -8.25, mat: materials.cableCat6Blue },
    { x: 20.89, z1: -11.82, z2: -8.25, mat: materials.cableDataDark },
  ];
  mainCableRuns.forEach(({ x, z1, z2, mat }) => {
    const len = z2 - z1;
    const cz = (z1 + z2) * 0.5;
    const run = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, len, 8), mat);
    run.rotation.x = Math.PI / 2;
    run.position.set(x, 2.84, cz);
    genYardGroup.add(run);
  });

  // Bridge feeder conductors crossing West from Main Rack (x=20.85) straight into Power Room Wall Transit (x=18.0)
  [
    { dz: -0.22, xStart: 20.89, mat: materials.copperBus },
    { dz: -0.14, xStart: 20.81, mat: materials.cableCat6Blue },
    { dz: -0.06, xStart: 20.73, mat: materials.cableDataDark },
    { dz: 0.02, xStart: 20.65, mat: materials.fiberTray },
    { dz: 0.1, xStart: 20.58, mat: materials.copperBus },
    { dz: 0.18, xStart: 20.5, mat: materials.cableCat6Blue },
    { dz: 0.25, xStart: 20.42, mat: materials.cableDataDark },
  ].forEach(({ dz, xStart, mat }) => {
    const len = xStart - 17.98;
    const cx = 17.98 + len * 0.5;
    const bridgeCable = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, len, 8), mat);
    bridgeCable.rotation.z = Math.PI / 2;
    bridgeCable.position.set(cx, 2.84, -11.85 + dz);
    genYardGroup.add(bridgeCable);
  });

  // Outdoor GEN-SYNC & Fuel Paralleling Junction Cabinet beneath rack at (20.65, 0.04, -4.2)
  const syncCab = new THREE.Group();
  syncCab.position.set(20.65, 0.04, -4.2);
  const syncPlinth = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.14, 1.32), materials.sidewalk);
  syncPlinth.position.y = 0.07;
  const syncBody = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.72, 1.18), materials.darkSteelTrim);
  syncBody.position.y = 1.0;
  syncBody.castShadow = true;
  const syncScreen = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.34, 0.48), materials.coldStrip);
  syncScreen.position.set(-0.35, 1.32, 0);
  const syncSign = new THREE.Mesh(
    new THREE.PlaneGeometry(0.92, 0.23),
    new THREE.MeshBasicMaterial({ map: createSignTexture('GEN-SYNC', 'PARALELLEME & ATS HATTI', '#38bdf8') })
  );
  syncSign.rotation.y = -Math.PI / 2;
  syncSign.position.set(-0.35, 1.72, 0);
  for (const rz of [-0.2, 0.2]) {
    const riserConduit = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.94, 8), materials.chrome);
    riserConduit.position.set(0, 2.31, rz);
    syncCab.add(riserConduit);
  }
  syncCab.add(syncPlinth, syncBody, syncScreen, syncSign);
  genYardGroup.add(syncCab);
  addBoxCollider(colliders, 20.15, 21.15, -4.9, -3.5);

  syncBody.userData.inspect = {
    category: 'Jeneratör Senkron & Dağıtım',
    name: 'GEN-SYNC Paralelleme & Dış Güç Köprüsü',
    specs: '2× 2.5 MVA Paralel Barası · Çift Devre XLPE Zırhlı Kablo Köprüsü → Güç & UPS Odası (ATS-01)',
  };
  inspectables.push(syncBody);

  const trayHitProxy = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 0.45, 12.2),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  trayHitProxy.position.set(20.1, 2.82, -6.0);
  trayHitProxy.userData.inspect = syncBody.userData.inspect;
  genYardGroup.add(trayHitProxy);
  inspectables.push(trayHitProxy);

  // 2. North Chiller Yard (z = -17.8) + Industrial Staggered Collector Pipe Rack & Valve Yard
  const chillerYardGroup = new THREE.Group();
  exteriorGroup.add(chillerYardGroup);

  const addFlange = (x, y, z, rotAxis = 'z', radius = 0.17) => {
    const fl = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.055, 14), materials.darkSteelTrim);
    if (rotAxis === 'x') fl.rotation.z = Math.PI / 2;
    else if (rotAxis === 'z') fl.rotation.x = Math.PI / 2;
    fl.position.set(x, y, z);
    chillerYardGroup.add(fl);
  };

  const addElbow = (x, y, z, radius, mat) => {
    const elb = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.08, 12, 10), mat);
    elb.position.set(x, y, z);
    chillerYardGroup.add(elb);
  };

  const addButterflyValve = (x, y, z, axis = 'z', wheelMat = materials.fireRed) => {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.12, 14), materials.darkSteelTrim);
    if (axis === 'z') body.rotation.x = Math.PI / 2;
    else if (axis === 'x') body.rotation.z = Math.PI / 2;
    body.position.set(x, y, z);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.24, 8), materials.chrome);
    stem.position.set(x, y + 0.16, z);
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 8, 16), wheelMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, y + 0.28, z);
    chillerYardGroup.add(body, stem, wheel);
  };

  // Steel H-Frame Pipe Support Stanchions along z = -14.22 supporting both collector tiers
  for (const sx of [-14.0, -10.8, -6.2, -3.0]) {
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.88), materials.sidewalk);
    foot.position.set(sx, 0.05, -14.22);
    for (const sz of [-14.56, -13.88]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.09, 1.92, 0.09), materials.darkSteelTrim);
      post.position.set(sx, 1.0, sz);
      post.castShadow = true;
      chillerYardGroup.add(post);
    }
    const lowerBeam = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.8), materials.darkSteelTrim);
    lowerBeam.position.set(sx, 1.18, -14.22);
    const upperBeam = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.09, 0.8), materials.darkSteelTrim);
    upperBeam.position.set(sx, 1.61, -14.22);
    chillerYardGroup.add(foot, lowerBeam, upperBeam);
  }

  // Primary Supply Collector Header (Blue · y = 1.35, z = -14.45) & Return Collector Header (Red · y = 1.78, z = -14.00)
  const extSupplyCol = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 11.4, 16), materials.pipeSupply);
  extSupplyCol.rotation.z = Math.PI / 2;
  extSupplyCol.position.set(-8.5, 1.35, -14.45);
  extSupplyCol.castShadow = true;

  const extReturnCol = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 11.4, 16), materials.pipeReturn);
  extReturnCol.rotation.z = Math.PI / 2;
  extReturnCol.position.set(-8.5, 1.78, -14.0);
  extReturnCol.castShadow = true;
  chillerYardGroup.add(extSupplyCol, extReturnCol);

  // Flanged blind end-caps + automatic air vents on both headers (x = -14.2 & x = -2.8)
  for (const ex of [-14.2, -2.8]) {
    addFlange(ex, 1.35, -14.45, 'x', 0.19);
    addFlange(ex, 1.78, -14.0, 'x', 0.19);
    const ventSup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.18, 8), materials.chrome);
    ventSup.position.set(ex + (ex < -8 ? 0.25 : -0.25), 1.54, -14.45);
    const ventRet = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.18, 8), materials.chrome);
    ventRet.position.set(ex + (ex < -8 ? 0.25 : -0.25), 1.97, -14.0);
    chillerYardGroup.add(ventSup, ventRet);
  }

  // 3 Chillers + Flanged/Valved Non-Intersecting Branch Drops
  [-13.5, -8.5, -3.5].forEach((cx, idx) => {
    const chiller = createChillerUnit(idx + 1, materials, inspectables, animatedFans);
    chiller.position.set(cx, 0.04, -17.8);
    exteriorGroup.add(chiller);
    addBoxCollider(colliders, cx - 1.5, cx + 1.5, -20.4, -15.2);

    // --- SUPPLY BRANCH (Blue: exits evaporator at y=0.72, z=-15.55 -> bellows -> Y-strainer -> elbow up to y=1.35 at z=-14.45) ---
    const sx = cx - 0.36;
    const bellowsSup = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.24, 14), materials.cableDataDark);
    bellowsSup.rotation.x = Math.PI / 2;
    bellowsSup.position.set(sx, 0.72, -15.42);
    addFlange(sx, 0.72, -15.54, 'z', 0.16);
    addFlange(sx, 0.72, -15.3, 'z', 0.16);

    const supHoriz = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.85, 12), materials.pipeSupply);
    supHoriz.rotation.x = Math.PI / 2;
    supHoriz.position.set(sx, 0.72, -14.88);
    // Y-strainer pocket
    const strainer = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.26, 10), materials.darkSteelTrim);
    strainer.rotation.x = 0.75;
    strainer.position.set(sx, 0.62, -15.05);
    addElbow(sx, 0.72, -14.45, 0.105, materials.pipeSupply);

    const supRise = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.63, 12), materials.pipeSupply);
    supRise.position.set(sx, 1.035, -14.45);
    addButterflyValve(sx, 1.03, -14.45, 'y', materials.coldStrip);
    addFlange(sx, 1.24, -14.45, 'y', 0.155);
    chillerYardGroup.add(bellowsSup, supHoriz, strainer, supRise);

    // --- RETURN BRANCH (Red: exits evaporator at y=0.94, z=-15.55 -> bellows -> motorized valve -> rises OVER supply at z=-14.82 to y=1.78 -> runs to header z=-14.00) ---
    const rx = cx + 0.36;
    const bellowsRet = new THREE.Mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.24, 14), materials.cableDataDark);
    bellowsRet.rotation.x = Math.PI / 2;
    bellowsRet.position.set(rx, 0.94, -15.42);
    addFlange(rx, 0.94, -15.54, 'z', 0.16);
    addFlange(rx, 0.94, -15.3, 'z', 0.16);

    const retStub = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.48, 12), materials.pipeReturn);
    retStub.rotation.x = Math.PI / 2;
    retStub.position.set(rx, 0.94, -15.06);
    // Motorized modulating control valve actuator
    const actBody = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.16), materials.generatorYellow);
    actBody.position.set(rx, 1.15, -15.08);
    addElbow(rx, 0.94, -14.82, 0.105, materials.pipeReturn);

    const retRise = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.84, 12), materials.pipeReturn);
    retRise.position.set(rx, 1.36, -14.82);
    addElbow(rx, 1.78, -14.82, 0.105, materials.pipeReturn);

    const retTopRun = new THREE.Mesh(new THREE.CylinderGeometry(0.105, 0.105, 0.82, 12), materials.pipeReturn);
    retTopRun.rotation.x = Math.PI / 2;
    retTopRun.position.set(rx, 1.78, -14.41);
    addButterflyValve(rx, 1.78, -14.32, 'z', materials.fireRed);
    addFlange(rx, 1.78, -14.12, 'z', 0.155);

    // Dial thermometer gauge on top run
    const gaugeStem = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.12, 8), materials.chrome);
    gaugeStem.position.set(rx, 1.91, -14.62);
    const gaugeDial = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.03, 12), materials.cracBody);
    gaugeDial.rotation.x = Math.PI / 2;
    gaugeDial.position.set(rx, 1.99, -14.62);
    chillerYardGroup.add(bellowsRet, retStub, actBody, retRise, retTopRun, gaugeStem, gaugeDial);
  });

  // Twin Wall-Penetration Lines entering Soğutma Odası (aligned to building.js sleeves at y=1.35, z=-13.0)
  for (const px of [-13.85, -8.85]) {
    // Supply penetration straight at y=1.35 from z=-14.45 into wall z=-13.0
    const wallSup = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 1.48, 14), materials.pipeSupply);
    wallSup.rotation.x = Math.PI / 2;
    wallSup.position.set(px, 1.35, -13.71);
    addFlange(px, 1.35, -14.3, 'z', 0.17);
    addButterflyValve(px, 1.35, -13.55, 'z', materials.coldStrip);
    addFlange(px, 1.35, -13.02, 'z', 0.21);
    chillerYardGroup.add(wallSup);
  }
  for (const px of [-13.15, -8.15]) {
    // Return penetration drops smoothly from upper Return Header (y=1.78, z=-14.00) down to wall sleeve (y=1.35, z=-13.0)
    const rHoriz = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.52, 14), materials.pipeReturn);
    rHoriz.rotation.x = Math.PI / 2;
    rHoriz.position.set(px, 1.78, -13.74);
    addFlange(px, 1.78, -13.86, 'z', 0.17);
    addElbow(px, 1.78, -13.48, 0.125, materials.pipeReturn);

    const rDrop = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.43, 14), materials.pipeReturn);
    rDrop.position.set(px, 1.565, -13.48);
    addElbow(px, 1.35, -13.48, 0.125, materials.pipeReturn);

    const wallRet = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.5, 14), materials.pipeReturn);
    wallRet.rotation.x = Math.PI / 2;
    wallRet.position.set(px, 1.35, -13.23);
    addButterflyValve(px, 1.35, -13.26, 'z', materials.fireRed);
    addFlange(px, 1.35, -13.02, 'z', 0.21);
    chillerYardGroup.add(rHoriz, rDrop, wallRet);
  }

  // Clickable inspection proxy for exterior piping & valve manifold rack
  const manifoldProxy = new THREE.Mesh(
    new THREE.BoxGeometry(11.4, 1.4, 1.9),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  manifoldProxy.position.set(-8.5, 1.35, -14.2);
  manifoldProxy.userData.inspect = {
    category: 'Dış Borulama & Vana İstasyonu',
    name: 'Primer Chiller Çift Kademeli Kolektör Hattı',
    specs: 'DN250 Gidiş (7°C) & Dönüş (12°C) İzoleli Hat · Kelebek Vanalar, Pislik Tutucu, Esnek Kompansatör & BMS Aktüatör',
  };
  chillerYardGroup.add(manifoldProxy);
  inspectables.push(manifoldProxy);

  // 3. North-East Electrical Substation Transformers (TR-01 & TR-02) + OG Portal + Campus & Cross-Road HV Pylons + Power Room Bridges
  const subGroup = new THREE.Group();
  exteriorGroup.add(subGroup);

  const trPositions = [10.5, 15.0];
  trPositions.forEach((tx, idx) => {
    const tr = createTransformerUnit(idx + 1, materials, inspectables);
    tr.position.set(tx, 0.04, -17.5);
    exteriorGroup.add(tr);
    addBoxCollider(colliders, tx - 1.65, tx + 1.65, -19.2, -15.8);

    // 400V AC Overhead Copper Bus-Duct & Cable Bridge from TR South LV Throat (z = -16.38) into Güç & UPS Odası (z = -13.0)
    const bridgeX = idx === 0 ? 10.6 : 15.0;
    const lvRiser = new THREE.Mesh(new THREE.BoxGeometry(0.68, 1.32, 0.3), materials.darkSteelTrim);
    lvRiser.position.set(tx, 2.18, -16.25);
    lvRiser.castShadow = true;
    subGroup.add(lvRiser);

    // Overhead Galvanized Ladder Bridge (z = -16.35 .. -12.98, y = 2.78) + H-Frame Stanchion at z = -14.8
    const lvTray = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.08, 3.4), materials.powerTray);
    lvTray.position.set(bridgeX, 2.78, -14.65);
    lvTray.castShadow = true;
    const wallHood = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.48, 0.32), materials.darkSteelTrim);
    wallHood.position.set(bridgeX, 2.84, -13.14);
    subGroup.add(lvTray, wallHood);

    // Stanchion posts supporting LV Bridge at z = -14.8
    for (const sx of [bridgeX - 0.3, bridgeX + 0.3]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.72, 0.08), materials.darkSteelTrim);
      post.position.set(sx, 1.4, -14.8);
      post.castShadow = true;
      subGroup.add(post);
    }
    const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.08, 0.1), materials.darkSteelTrim);
    crossBeam.position.set(bridgeX, 2.71, -14.8);
    subGroup.add(crossBeam);

    // 4 Parallel L1 / L2 / L3 / N Heavy Conductors running straight into North Wall Penetration Hood
    [
      [-0.2, materials.copperBus],
      [-0.07, materials.cableCat6Blue],
      [0.07, materials.cableDataDark],
      [0.2, materials.copperBus],
    ].forEach(([dx, cMat]) => {
      const cond = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 3.4, 8), cMat);
      cond.rotation.x = Math.PI / 2;
      cond.position.set(bridgeX + dx, 2.84, -14.68);
      subGroup.add(cond);
    });
  });

  // OG (34.5 kV) H-Frame Substation Disconnector Portal at z = -20.25 (spanning TR-01 & TR-02)
  for (const px of [9.65, 12.75, 15.85]) {
    const colFoot = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.14, 0.42), materials.sidewalk);
    colFoot.position.set(px, 0.07, -20.25);
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.18, 4.35, 0.18), materials.darkSteelTrim);
    col.position.set(px, 2.24, -20.25);
    col.castShadow = true;
    subGroup.add(colFoot, col);
  }
  const portalBeam = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.22, 0.24), materials.powerTray);
  portalBeam.position.set(12.75, 4.38, -20.25);
  portalBeam.castShadow = true;
  subGroup.add(portalBeam);

  // Rigid 3-Phase Overhead 34.5 kV Busbar on Post Insulators across OG Portal + Branch Drops into TR-01 & TR-02 HV Bushings
  const hvWireMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.42, metalness: 0.78 });
  const portalInsMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.26, metalness: 0.12 });

  // 3 Overhead Main OG Busbars along X at y = 4.68 / 4.82 / 4.96 (staggered in Z for phase isolation)
  const ogBusZ = [-20.42, -20.25, -20.08];
  const ogBusY = 4.72;
  ogBusZ.forEach((bz) => {
    const bus = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 5.8, 10), materials.copperBus);
    bus.rotation.z = Math.PI / 2;
    bus.position.set(12.75, ogBusY, bz);
    subGroup.add(bus);
    for (const ix of [10.02, 12.75, 15.48]) {
      const postIns = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.26, 8), portalInsMat);
      postIns.position.set(ix, 4.58, bz);
      subGroup.add(postIns);
    }
  });

  // Drop connections from OG Portal Busbars down to TR-01 & TR-02 Ceramic Bushings
  trPositions.forEach((tx) => {
    [-1, 0, 1].forEach((b, phaseIdx) => {
      const bx = tx + b * 0.48;
      const pBus = new THREE.Vector3(bx, ogBusY, ogBusZ[phaseIdx]);
      const pBush = new THREE.Vector3(bx, 3.03, -17.84);
      const wireDrop = createCatenaryWire(pBus, pBush, 0.22, 0.018, materials.copperBus, 10);
      subGroup.add(wireDrop);

      // Disconnector blade insulator mounted under portal beam
      const discStand = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.34, 8), portalInsMat);
      discStand.position.set(bx, 4.12, -20.12);
      subGroup.add(discStand);
    });
  });

  // RMU / 34.5 kV OG Metering & Ring-Main Cell Cabinet between transformers (x = 12.75, z = -19.8)
  const rmuGroup = new THREE.Group();
  rmuGroup.position.set(12.75, 0.04, -19.65);
  const rmuPlinth = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.16, 1.05), materials.sidewalk);
  rmuPlinth.position.y = 0.08;
  const rmuBody = new THREE.Mesh(new THREE.BoxGeometry(1.36, 1.72, 0.88), materials.darkSteelTrim);
  rmuBody.position.y = 1.02;
  rmuBody.castShadow = true;
  const rmuDoor = new THREE.Mesh(new THREE.BoxGeometry(1.24, 1.56, 0.04), materials.aluCladding);
  rmuDoor.position.set(0, 1.02, 0.45);
  const rmuHmi = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.24, 0.03), materials.coldStrip);
  rmuHmi.position.set(-0.28, 1.32, 0.48);
  const rmuLed = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.03), materials.greenLed);
  rmuLed.position.set(0.28, 1.48, 0.48);
  const rmuSign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.16, 0.28),
    new THREE.MeshBasicMaterial({ map: createSignTexture('34.5 kV OG HÜCRE', 'RMU KESİCİ & ŞEBEKE ÖLÇÜ', '#f59e0b') })
  );
  rmuSign.position.set(0, 1.66, 0.48);
  rmuGroup.add(rmuPlinth, rmuBody, rmuDoor, rmuHmi, rmuLed, rmuSign);
  subGroup.add(rmuGroup);
  addBoxCollider(colliders, 11.9, 13.6, -20.4, -19.0);
  rmuBody.userData.inspect = {
    category: 'Orta Gerilim Hücre (RMU)',
    name: '34.5 kV SF6 Kesicili Giriş & Ölçü Hücresi',
    specs: 'Çift Fiderli Ring Anahtarlama · Akım/Gerilim Trafoları · Uzaktan SCADA Açma-Kapama',
  };
  inspectables.push(rmuBody);

  // 3A. Campus Substation Receiving Lattice Tower (in front of transformers, near North road at x = 12.75, z = -22.5)
  const campusPylon = createTransmissionPylon({
    height: 11.2,
    baseHalf: 1.08,
    topHalf: 0.28,
    tiers: 5,
    crossarms: [
      { y: 8.4, span: 5.4, phaseOffsets: [-2.35, 0, 2.35], insulatorLen: 0.88, discs: 5 },
    ],
    materials,
    hasBeacon: true,
  });
  campusPylon.position.set(12.75, 0.04, -22.5);
  subGroup.add(campusPylon);
  addBoxCollider(colliders, 11.4, 14.1, -23.85, -21.15);

  const hvWarnSign = new THREE.Mesh(
    new THREE.PlaneGeometry(1.45, 0.38),
    new THREE.MeshBasicMaterial({ map: createSignTexture('TEHLİKE · 34.5 kV', 'YÜKSEK GERİLİM ŞEBEKE DİREĞİ', '#ef4444') })
  );
  hvWarnSign.position.set(12.75, 3.1, -21.62);
  const hvWarnSignBack = hvWarnSign.clone();
  hvWarnSignBack.rotation.y = Math.PI;
  hvWarnSignBack.position.set(12.75, 3.1, -23.38);
  subGroup.add(hvWarnSign, hvWarnSignBack);

  const pylonHitProxy = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 10.5, 2.8),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  pylonHitProxy.position.set(12.75, 5.2, -22.5);
  pylonHitProxy.userData.inspect = {
    category: 'Şebeke İletim Altyapısı',
    name: '34.5 kV Kampüs Trafo İniş Pilonu',
    specs: 'Galvaniz Kafes Çelik Direk · Çift Devre Askı İzolatörü · Yıldırım Koruma Teli & OG Portal Bağlantısı',
  };
  subGroup.add(pylonHitProxy);
  inspectables.push(pylonHitProxy);

  // Down-Dropper Conductors from Campus Pylon Crossarm (y = 7.52, z = -22.5) to OG Portal Busbars (y = 4.72, z = -20.25)
  const campusAttach = campusPylon.userData.attachPoints;
  campusAttach.armTips[0].forEach((localTip, idx) => {
    const pStart = localTip.clone().add(campusPylon.position);
    const targetX = 12.75 + (idx - 1) * 2.25;
    const pEnd = new THREE.Vector3(targetX, ogBusY, ogBusZ[idx]);
    subGroup.add(createCatenaryWire(pStart, pEnd, 0.25, 0.02, hvWireMat, 12));
  });

  // 3B. Giant Cross-Road High-Voltage Lattice Transmission Pylons (Across roadNorth at z = -38.8, in front of opposite city buildings)
  const giantPylonPositions = [12.75, -15.5];
  const giantPylons = giantPylonPositions.map((gx, gIdx) => {
    const gPylon = createTransmissionPylon({
      height: 16.4,
      baseHalf: 1.55,
      topHalf: 0.36,
      tiers: 7,
      crossarms: [
        { y: 10.6, span: 7.4, phaseOffsets: [-3.1, 0, 3.1], insulatorLen: 1.1, discs: 6 },
        { y: 13.4, span: 5.8, phaseOffsets: [-2.35, 0, 2.35], insulatorLen: 1.0, discs: 6 },
      ],
      materials,
      hasBeacon: true,
    });
    gPylon.position.set(gx, 0.0, -38.8);
    subGroup.add(gPylon);
    addBoxCollider(colliders, gx - 1.85, gx + 1.85, -40.65, -36.95);

    const gProxy = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 15.5, 3.6),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    gProxy.position.set(gx, 7.8, -38.8);
    gProxy.userData.inspect = {
      category: 'Ana Şebeke İletim Hattı',
      name: gIdx === 0 ? '154 / 34.5 kV Şebeke Dağıtım Pilonu (Ana Hat)' : '154 kV Şehir İletim Koridor Direği',
      specs: '16.4 m Çift Devre Kafes Çelik Pilon · Porselen Askı İzolatörler · Yol Üstü Havai Hat Geçişi',
    };
    subGroup.add(gProxy);
    inspectables.push(gProxy);
    return gPylon;
  });

  // 3C. Overhead High-Voltage Catenary Conductors:
  // (1) Across North Road from Giant Pylon (12.75, -38.8) -> Campus Pylon (12.75, -22.5)
  const mainRoadPylon = giantPylons[0];
  mainRoadPylon.userData.attachPoints.armTips[0].forEach((localTip, idx) => {
    const pFrom = localTip.clone().add(mainRoadPylon.position);
    const pTo = campusAttach.armTips[0][idx].clone().add(campusPylon.position);
    subGroup.add(createCatenaryWire(pFrom, pTo, 1.05, 0.022, hvWireMat, 18));
  });
  // Shield / Ground Earth Wire from Peak to Peak across roadNorth
  subGroup.add(
    createCatenaryWire(
      mainRoadPylon.userData.attachPoints.peak.clone().add(mainRoadPylon.position),
      campusAttach.peak.clone().add(campusPylon.position),
      0.7,
      0.014,
      materials.chrome,
      16
    )
  );

  // (2) East-West City Grid Trunk Lines connecting the two Giant Pylons along the opposite boulevard (-15.5 <-> 12.75 at z = -38.8)
  const westGridPylon = giantPylons[1];
  [0, 1].forEach((armIdx) => {
    westGridPylon.userData.attachPoints.armTips[armIdx].forEach((localTip, idx) => {
      const pA = localTip.clone().add(westGridPylon.position);
      const pB = mainRoadPylon.userData.attachPoints.armTips[armIdx][idx].clone().add(mainRoadPylon.position);
      subGroup.add(createCatenaryWire(pA, pB, 1.35, 0.022, hvWireMat, 20));
    });
  });
  subGroup.add(
    createCatenaryWire(
      westGridPylon.userData.attachPoints.peak.clone().add(westGridPylon.position),
      mainRoadPylon.userData.attachPoints.peak.clone().add(mainRoadPylon.position),
      0.95,
      0.014,
      materials.chrome,
      18
    )
  );

  // Unified 4-Sided Perimeter Security Fence (Posts + 3 Horizontal Rails + Vertical Pickets matching South Front)
  const fenceWestX = -28.5;
  const fenceEastX = 32.5;
  const fenceNorthZ = -24.5;
  const fenceSouthZ = 23.0;

  const southSegments = [
    [fenceWestX, -13.5],
    [-7.5, 4.1],
    [11.9, fenceEastX],
  ];

  const postPositions = [];
  const picketTransforms = [];

  // Helper to populate evenly spaced posts + 3 rails + pickets along any X or Z fence span
  const addFenceSpanX = (x1, x2, z) => {
    const w = x2 - x1;
    const cx = (x1 + x2) * 0.5;
    for (const ry of [0.35, 1.15, 1.95]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(w, 0.07, 0.07), materials.aluCladding);
      rail.position.set(cx, ry, z);
      rail.castShadow = true;
      exteriorGroup.add(rail);
    }
    const postSteps = Math.max(1, Math.round(w / 3.0));
    for (let i = 0; i <= postSteps; i++) {
      postPositions.push([x1 + (w * i) / postSteps, z]);
    }
    for (let px = x1 + 0.3; px < x2 - 0.15; px += 0.35) {
      picketTransforms.push([px, z]);
    }
    addBoxCollider(colliders, x1, x2, z - 0.2, z + 0.2);
  };

  const addFenceSpanZ = (z1, z2, x) => {
    const d = z2 - z1;
    const cz = (z1 + z2) * 0.5;
    for (const ry of [0.35, 1.15, 1.95]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, d), materials.aluCladding);
      rail.position.set(x, ry, cz);
      rail.castShadow = true;
      exteriorGroup.add(rail);
    }
    const postSteps = Math.max(1, Math.round(d / 3.0));
    // Skip endpoints (i=0 and i=postSteps) since North & South corners already place corner posts
    for (let i = 1; i < postSteps; i++) {
      postPositions.push([x, z1 + (d * i) / postSteps]);
    }
    for (let pz = z1 + 0.3; pz < z2 - 0.15; pz += 0.35) {
      picketTransforms.push([x, pz]);
    }
    addBoxCollider(colliders, x - 0.2, x + 0.2, z1, z2);
  };

  // South segments (excluding Pedestrian Gate [-13.5..-7.5] and Parking Gate [4.1..11.9])
  southSegments.forEach(([x1, x2]) => addFenceSpanX(x1, x2, fenceSouthZ));
  // North perimeter
  addFenceSpanX(fenceWestX, fenceEastX, fenceNorthZ);
  // West & East perimeters
  addFenceSpanZ(fenceNorthZ, fenceSouthZ, fenceWestX);
  addFenceSpanZ(fenceNorthZ, fenceSouthZ, fenceEastX);

  const postMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.12, 2.2, 0.12),
    materials.darkSteelTrim,
    postPositions.length
  );
  postPositions.forEach(([px, pz], i) => {
    dummy.position.set(px, 1.1, pz);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    postMesh.setMatrixAt(i, dummy.matrix);
  });
  postMesh.castShadow = true;
  postMesh.computeBoundingSphere();
  exteriorGroup.add(postMesh);

  const perimeterPickets = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.04, 1.85, 0.04),
    materials.darkSteelTrim,
    picketTransforms.length
  );
  picketTransforms.forEach(([px, pz], i) => {
    dummy.position.set(px, 1.1, pz);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    perimeterPickets.setMatrixAt(i, dummy.matrix);
  });
  perimeterPickets.castShadow = true;
  perimeterPickets.computeBoundingSphere();
  exteriorGroup.add(perimeterPickets);

  // Surrounding City / Office District
  const citySpecs = [
    { x: -52, z: -8, w: 18, h: 28, d: 20, facadeColor: '#475569', windowColor: '#7dd3fc' },
    { x: -52, z: 18, w: 16, h: 19, d: 16, facadeColor: '#64748b', windowColor: '#bae6fd' },
    { x: -16, z: 48, w: 24, h: 24, d: 16, facadeColor: '#526071', windowColor: '#93c5fd' },
    { x: 18, z: 48, w: 22, h: 34, d: 18, facadeColor: '#3f4b5b', windowColor: '#fde68a' },
    { x: 56, z: -4, w: 20, h: 26, d: 22, facadeColor: '#576475', windowColor: '#7dd3fc' },
    { x: 54, z: 22, w: 16, h: 16, d: 15, facadeColor: '#687586', windowColor: '#bae6fd' },
    { x: -18, z: -50, w: 26, h: 22, d: 16, facadeColor: '#4a5568', windowColor: '#93c5fd' },
    { x: 18, z: -50, w: 22, h: 30, d: 18, facadeColor: '#3b4454', windowColor: '#fde68a' },
  ];

  citySpecs.forEach((spec) => {
    const b = createCityBuilding({
      w: spec.w,
      h: spec.h,
      d: spec.d,
      facadeColor: spec.facadeColor,
      windowColor: spec.windowColor,
      trimMat: materials.darkSteelTrim,
    });
    b.position.set(spec.x, 0, spec.z);
    exteriorGroup.add(b);
  });

  // Composite Boulevard & Campus Trees (kept clear of both pedestrian & vehicle driveways)
  const treeCoords = [
    [-25, 25], [-19, 25], [-2.5, 25], [15.5, 25], [22, 25], [29, 25],
    [-31, 14], [-31, 4], [-31, -6], [-31, -16],
    [35, 14], [35, 2], [35, -10], [35, -20],
    [-24, -27], [-8, -27], [8, -27], [24, -27],
  ];
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f6e49, roughness: 0.85 });

  const trunkInst = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.16, 0.24, 2.2, 8),
    trunkMat,
    treeCoords.length
  );
  const crownInst = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(1.45, 1),
    leafMat,
    treeCoords.length
  );
  const crownTopInst = new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(1.05, 1),
    leafMat,
    treeCoords.length
  );

  const tintColor = new THREE.Color();
  treeCoords.forEach(([tx, tz], i) => {
    const s = 0.88 + ((i * 37) % 30) / 100;
    dummy.position.set(tx, 1.1 * s, tz);
    dummy.rotation.set(0, i * 0.7, 0);
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    trunkInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(tx, 2.9 * s, tz);
    dummy.scale.set(s, s * 0.95, s);
    dummy.updateMatrix();
    crownInst.setMatrixAt(i, dummy.matrix);

    dummy.position.set(tx + 0.15 * s, 3.8 * s, tz - 0.1 * s);
    dummy.scale.set(s * 0.9, s * 0.9, s * 0.9);
    dummy.updateMatrix();
    crownTopInst.setMatrixAt(i, dummy.matrix);

    tintColor.setHSL(0.35 + ((i % 5) - 2) * 0.015, 0.36, 0.32 + (i % 3) * 0.03);
    crownInst.setColorAt(i, tintColor);
    crownTopInst.setColorAt(i, tintColor);
  });

  trunkInst.castShadow = true;
  crownInst.castShadow = true;
  trunkInst.computeBoundingSphere();
  crownInst.computeBoundingSphere();
  crownTopInst.computeBoundingSphere();
  exteriorGroup.add(trunkInst, crownInst, crownTopInst);

  // Street Lamps along South Boulevard (spaced clear of driveways)
  [-24, -15.5, 1.5, 15.5, 28].forEach((lx) => {
    const lamp = new THREE.Group();
    lamp.position.set(lx, 0, 24.4);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 5.2, 8), materials.darkSteelTrim);
    pole.position.y = 2.6;
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.1), materials.darkSteelTrim);
    arm.position.set(0, 5.15, 0.45);
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.65), materials.warmStrip);
    bulb.position.set(0, 5.08, 0.85);
    lamp.add(pole, arm, bulb);
    exteriorGroup.add(lamp);
  });

  scene.add(exteriorGroup);
  return {
    exteriorGroup,
    dispose: () => {
      carsPack.dispose();
    },
  };
}
