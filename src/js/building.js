import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  createSignTexture,
  createNocWallScreenManager,
  createCracPanelTexture,
  createFireCylinderLabelTexture,
  createFireControlPanelTexture,
  createHazardStripeTexture,
  createOperatorMonitorTexture,
  createKeyboardTexture,
  createFileCabinetTexture,
  createSafetyLockerTexture,
  createPrinterPanelTexture,
  createCredenzaDoorsTexture,
  createUpsPanelTexture,
  createSwitchgearPanelTexture,
  createBatteryModuleTexture,
  createPowerScadaTexture,
  createStagingScreenTexture,
  createSecurityControlTexture,
  createXrayScanTexture,
  createLogisticsBoxTexture,
  createExtinguisherSignTexture,
  createExtinguisherBodyTexture,
  createCleanAgentDepotTexture,
  createVfdPanelTexture,
  createCoolingScadaTexture,
  createBufferTankLabelTexture,
  createLobbyBrandSignTexture,
  createLobbyDirectoryTexture,
  createEntranceMatTexture,
  createReceptionMonitorTexture,
  createOdfPanelTexture,
  createExitSignTexture,
  createCracHmiEmissiveTexture,
} from './textures.js';
import { CabinetAssetFactory } from './cabinets.js';
import { sharedGeoPool } from './materials.js';

function addCollider(colliders, minX, maxX, minZ, maxZ) {
  colliders.push({ minX, maxX, minZ, maxZ });
}

function addWallBox(parent, colliders, material, x1, x2, z1, z2, y1 = 0.18, y2 = 5.18, addCol = true) {
  const w = Math.abs(x2 - x1);
  const d = Math.abs(z2 - z1);
  const h = y2 - y1;
  if (w <= 0.01 || d <= 0.01 || h <= 0.01) return null;
  const mesh = new THREE.Mesh(sharedGeoPool.box(w, h, d), material);
  mesh.position.set((x1 + x2) / 2, y1 + h / 2, (z1 + z2) / 2);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  if (addCol) {
    addCollider(colliders, Math.min(x1, x2), Math.max(x1, x2), Math.min(z1, z2), Math.max(z1, z2));
  }
  return mesh;
}

function createSlidingDoor({
  parent,
  doors,
  axis, // 'x' or 'z' (direction door leaves slide)
  centerX,
  centerZ,
  width,
  height = 3.1,
  leafMat,
  frameMat,
}) {
  const group = new THREE.Group();
  group.position.set(centerX, 0.18, centerZ);

  // Frame posts & transom header
  const halfW = width / 2;
  const postGeo = sharedGeoPool.box(0.12, height, 0.14);
  const leftPost = new THREE.Mesh(postGeo, frameMat);
  const rightPost = new THREE.Mesh(postGeo, frameMat);
  const header = new THREE.Mesh(sharedGeoPool.box(width + 0.24, 0.18, 0.18), frameMat);
  header.position.y = height + 0.09;

  if (axis === 'x') {
    leftPost.position.set(-halfW, height / 2, 0);
    rightPost.position.set(halfW, height / 2, 0);
  } else {
    leftPost.rotation.y = Math.PI / 2;
    rightPost.rotation.y = Math.PI / 2;
    header.rotation.y = Math.PI / 2;
    leftPost.position.set(0, height / 2, -halfW);
    rightPost.position.set(0, height / 2, halfW);
  }
  group.add(leftPost, rightPost, header);

  // Sliding double leaves
  const leafW = width / 2 - 0.02;
  const leafGeo =
    axis === 'x'
      ? sharedGeoPool.box(leafW, height - 0.06, 0.05)
      : sharedGeoPool.box(0.05, height - 0.06, leafW);

  const leafA = new THREE.Mesh(leafGeo, leafMat);
  const leafB = new THREE.Mesh(leafGeo, leafMat);
  const offsetClosed = width / 4;

  if (axis === 'x') {
    leafA.position.set(-offsetClosed, height / 2, 0);
    leafB.position.set(offsetClosed, height / 2, 0);
  } else {
    leafA.position.set(0, height / 2, -offsetClosed);
    leafB.position.set(0, height / 2, offsetClosed);
  }
  group.add(leafA, leafB);
  parent.add(group);

  doors.push({
    axis,
    x: centerX,
    z: centerZ,
    leafA,
    leafB,
    closedOffset: offsetClosed,
    openOffset: offsetClosed + width * 0.44,
    openAmount: 0,
  });
}

function createDualSecurityCapsules({
  parent,
  doors,
  colliders,
  inspectables,
  materials,
  centerX,
  centerZ,
}) {
  const group = new THREE.Group();
  group.position.set(centerX, 0.18, centerZ);

  const frameMat = materials.darkSteelTrim;
  const capsuleGlassMat = materials.archGlass.clone();
  capsuleGlassMat.side = THREE.DoubleSide;

  // Architectural transom closing y = 2.90..3.14 into overhead wall header + outer jamb wings + center pier
  const transom = new THREE.Mesh(sharedGeoPool.box(2.44, 0.24, 0.34), frameMat);
  transom.position.set(0, 3.02, 0);
  transom.castShadow = true;
  group.add(transom);

  for (const jx of [-1.135, 1.135]) {
    const jamb = new THREE.Mesh(sharedGeoPool.box(0.17, 2.9, 0.28), frameMat);
    jamb.position.set(jx, 1.45, 0);
    jamb.castShadow = true;
    group.add(jamb);
  }

  // Central Biometric & Load-Cell Telemetry Pier between the two capsules (local x = 0)
  const centerPier = new THREE.Mesh(sharedGeoPool.box(0.14, 2.9, 0.36), frameMat);
  centerPier.position.set(0, 1.45, 0);
  centerPier.castShadow = true;
  group.add(centerPier);

  const termScreenMat = new THREE.MeshStandardMaterial({
    map: createSignTexture('BİYOMETRİK TARTIM', 'AĞIRLIK FARKI: 0.0 kg', '#4ade80'),
    emissive: 0x0f172a,
    roughness: 0.3,
  });
  for (const dir of [1, -1]) {
    const termHousing = new THREE.Mesh(sharedGeoPool.box(0.12, 0.38, 0.05), frameMat);
    termHousing.position.set(0, 1.32, dir * 0.19);
    const termFace = new THREE.Mesh(sharedGeoPool.plane(0.11, 0.12), termScreenMat);
    termFace.rotation.y = dir > 0 ? 0 : Math.PI;
    termFace.position.set(0, 1.41, dir * 0.218);
    const palmPad = new THREE.Mesh(sharedGeoPool.box(0.08, 0.1, 0.02), materials.coldStrip);
    palmPad.position.set(0, 1.24, dir * 0.216);
    group.add(termHousing, termFace, palmPad);
  }

  const R = 0.52;
  const eastArcGeo = sharedGeoPool.cyl(R, R, 2.62, 16, 1, true, 0.74, Math.PI - 1.48);
  const westArcGeo = sharedGeoPool.cyl(R, R, 2.62, 16, 1, true, Math.PI + 0.74, Math.PI - 1.48);
  const frontDoorGeo = sharedGeoPool.cyl(0.48, 0.48, 2.56, 16, 1, true, -0.76, 1.52);
  const backDoorGeo = sharedGeoPool.cyl(0.45, 0.45, 2.56, 16, 1, true, Math.PI - 0.76, 1.52);

  const capsuleSpecs = [
    {
      offsetX: -0.55,
      title: 'KAPSÜL 1 · GİRİŞ',
      sub: 'TARTIM + BİYOMETRİ',
      accent: '#38bdf8',
      idleHex: 0x38bdf8,
    },
    {
      offsetX: 0.55,
      title: 'KAPSÜL 2 · ÇIKIŞ',
      sub: 'AĞIRLIK FARK KONTROL',
      accent: '#22c55e',
      idleHex: 0x0ea5e9,
    },
  ];

  capsuleSpecs.forEach((spec) => {
    const cap = new THREE.Group();
    cap.position.set(spec.offsetX, 0, 0);

    // 1) Threshold Sill & Weight-Sensing Load-Cell Floor Scale
    const sillRing = new THREE.Mesh(sharedGeoPool.cyl(0.54, 0.55, 0.036, 28), materials.chrome);
    sillRing.position.y = 0.018;
    const scaleDisk = new THREE.Mesh(sharedGeoPool.cyl(0.41, 0.41, 0.026, 24), materials.rackBody);
    scaleDisk.position.y = 0.042;
    const scaleRingMat = new THREE.MeshStandardMaterial({
      color: spec.idleHex,
      emissive: spec.idleHex,
      emissiveIntensity: 1.4,
      roughness: 0.25,
    });
    const scaleLedRing = new THREE.Mesh(sharedGeoPool.torus(0.425, 0.012, 8, 28), scaleRingMat);
    scaleLedRing.rotation.x = Math.PI / 2;
    scaleLedRing.position.y = 0.048;
    cap.add(sillRing, scaleDisk, scaleLedRing);

    for (const ang of [Math.PI * 0.25, Math.PI * 0.75, Math.PI * 1.25, Math.PI * 1.75]) {
      const pad = new THREE.Mesh(sharedGeoPool.box(0.045, 0.018, 0.045), materials.generatorYellow);
      pad.position.set(Math.sin(ang) * 0.37, 0.052, Math.cos(ang) * 0.37);
      pad.rotation.y = ang;
      cap.add(pad);
    }

    // 2) Fixed Curved Side Glass Arcs + 4 Vertical Framing Mullions + Top Drum Canopy
    const eastGlass = new THREE.Mesh(eastArcGeo, capsuleGlassMat);
    eastGlass.position.y = 1.34;
    const westGlass = new THREE.Mesh(westArcGeo, capsuleGlassMat);
    westGlass.position.y = 1.34;
    const lowerRing = new THREE.Mesh(sharedGeoPool.torus(R + 0.005, 0.024, 8, 28), frameMat);
    lowerRing.rotation.x = Math.PI / 2;
    lowerRing.position.y = 0.05;
    const upperRing = new THREE.Mesh(sharedGeoPool.torus(R + 0.005, 0.028, 8, 28), frameMat);
    upperRing.rotation.x = Math.PI / 2;
    upperRing.position.y = 2.66;
    cap.add(eastGlass, westGlass, lowerRing, upperRing);

    for (const ang of [-0.74, 0.74, Math.PI - 0.74, Math.PI + 0.74]) {
      const mullion = new THREE.Mesh(sharedGeoPool.box(0.052, 2.66, 0.052), frameMat);
      mullion.position.set(Math.sin(ang) * R, 1.34, Math.cos(ang) * R);
      mullion.rotation.y = ang;
      mullion.castShadow = true;
      cap.add(mullion);
    }

    const crownDrum = new THREE.Mesh(sharedGeoPool.cyl(0.545, 0.545, 0.24, 28), frameMat);
    crownDrum.position.y = 2.79;
    crownDrum.castShadow = true;
    const crownChrome = new THREE.Mesh(sharedGeoPool.cyl(0.552, 0.552, 0.04, 28), materials.chrome);
    crownChrome.position.y = 2.68;
    const ceilingLight = new THREE.Mesh(sharedGeoPool.cyl(0.26, 0.28, 0.022, 20), materials.coldStrip);
    ceilingLight.position.y = 2.665;
    cap.add(crownDrum, crownChrome, ceilingLight);

    // 3) Rotating Curved Interlocking Glass Door Leaves (Front +Z & Back -Z)
    const frontPivot = new THREE.Group();
    const frontLeaf = new THREE.Mesh(frontDoorGeo, capsuleGlassMat);
    frontLeaf.position.y = 1.32;
    frontPivot.add(frontLeaf);
    for (const ang of [-0.73, 0.73]) {
      const stile = new THREE.Mesh(sharedGeoPool.box(0.032, 2.56, 0.032), frameMat);
      stile.position.set(Math.sin(ang) * 0.48, 1.32, Math.cos(ang) * 0.48);
      stile.rotation.y = ang;
      frontPivot.add(stile);
    }
    const frontBar = new THREE.Mesh(sharedGeoPool.box(0.36, 0.026, 0.024), materials.chrome);
    frontBar.position.set(0, 1.12, 0.492);
    frontPivot.add(frontBar);

    const backPivot = new THREE.Group();
    const backLeaf = new THREE.Mesh(backDoorGeo, capsuleGlassMat);
    backLeaf.position.y = 1.32;
    backPivot.add(backLeaf);
    for (const ang of [Math.PI - 0.73, Math.PI + 0.73]) {
      const stile = new THREE.Mesh(sharedGeoPool.box(0.032, 2.56, 0.032), frameMat);
      stile.position.set(Math.sin(ang) * 0.45, 1.32, Math.cos(ang) * 0.45);
      stile.rotation.y = ang;
      backPivot.add(stile);
    }
    const backBar = new THREE.Mesh(sharedGeoPool.box(0.34, 0.026, 0.024), materials.chrome);
    backBar.position.set(0, 1.12, -0.462);
    backPivot.add(backBar);

    cap.add(frontPivot, backPivot);
    group.add(cap);

    doors.push({
      x: centerX + spec.offsetX,
      z: centerZ,
      openAmount: 0,
      dynamicNodes: [frontPivot, backPivot],
      onUpdate(amt) {
        // Staggered interlocking sequence: outer door opens slightly ahead of inner server door
        const frontAmt = Math.min(1, amt * 1.35);
        const backAmt = Math.max(0, Math.min(1, (amt - 0.14) * 1.17));
        frontPivot.rotation.y = 1.57 * frontAmt;
        backPivot.rotation.y = 1.57 * backAmt;
        const verified = amt > 0.25;
        scaleRingMat.color.setHex(verified ? 0x22c55e : spec.idleHex);
        scaleRingMat.emissive.setHex(verified ? 0x22c55e : spec.idleHex);
        scaleRingMat.emissiveIntensity = verified ? 1.9 : 1.3;
      },
    });
  });

  // Walkability Colliders: Block ONLY the center pier & outer jambs; leave both cylindrical paths open
  addCollider(colliders, centerX - 0.14, centerX + 0.14, centerZ - 0.56, centerZ + 0.56);
  addCollider(colliders, centerX - 1.24, centerX - 1.04, centerZ - 0.56, centerZ + 0.56);
  addCollider(colliders, centerX + 1.04, centerX + 1.24, centerZ - 0.56, centerZ + 0.56);

  const hitProxy = new THREE.Mesh(sharedGeoPool.box(2.36, 2.88, 1.12), materials.invisibleHitMat);
  hitProxy.position.set(0, 1.44, 0);
  hitProxy.userData.inspect = {
    category: 'Yüksek Güvenlik Mantrap',
    name: 'İkili Tartımlı Biyometrik Güvenlik Kapsülü',
    specs: 'Tek Kişilik Silindirik Portal · Yük Hücreli (Load-Cell) Ağırlık Farkı Tespiti · Piggybacking Engelleyici · Kilitli Çift Kavisli Kapak',
  };
  group.add(hitProxy);
  inspectables.push(hitProxy);

  parent.add(group);
}

function createErgonomicTaskChair(materials, seatMat) {
  const chairGrp = new THREE.Group();
  const hub = new THREE.Mesh(sharedGeoPool.cyl(0.045, 0.055, 0.06, 10), materials.chrome);
  hub.position.y = 0.09;
  chairGrp.add(hub);

  for (let s = 0; s < 5; s++) {
    const ang = (s * Math.PI * 2) / 5;
    const spoke = new THREE.Mesh(sharedGeoPool.box(0.29, 0.028, 0.036), materials.chrome);
    spoke.position.set(Math.cos(ang) * 0.145, 0.075, Math.sin(ang) * 0.145);
    spoke.rotation.y = -ang;
    const caster = new THREE.Mesh(sharedGeoPool.cyl(0.028, 0.028, 0.032, 10), materials.rackBody);
    caster.rotation.x = Math.PI / 2;
    caster.position.set(Math.cos(ang) * 0.27, 0.03, Math.sin(ang) * 0.27);
    chairGrp.add(spoke, caster);
  }

  const piston = new THREE.Mesh(sharedGeoPool.cyl(0.028, 0.032, 0.36, 10), materials.chrome);
  piston.position.y = 0.27;
  const seatCushion = new THREE.Mesh(sharedGeoPool.box(0.48, 0.075, 0.48), seatMat);
  seatCushion.position.y = 0.48;

  for (const az of [-0.26, 0.26]) {
    const armV = new THREE.Mesh(sharedGeoPool.box(0.04, 0.18, 0.04), materials.chrome);
    armV.position.set(0.02, 0.56, az);
    const armPad = new THREE.Mesh(sharedGeoPool.box(0.28, 0.035, 0.07), seatMat);
    armPad.position.set(-0.02, 0.65, az);
    chairGrp.add(armV, armPad);
  }

  const backSpine = new THREE.Mesh(sharedGeoPool.box(0.045, 0.52, 0.09), materials.darkSteelTrim);
  backSpine.position.set(0.24, 0.72, 0);
  const backMesh = new THREE.Mesh(sharedGeoPool.box(0.055, 0.54, 0.44), seatMat);
  backMesh.position.set(0.22, 0.81, 0);
  backMesh.rotation.z = -0.1;
  const headrest = new THREE.Mesh(sharedGeoPool.box(0.06, 0.15, 0.26), seatMat);
  headrest.position.set(0.26, 1.15, 0);
  headrest.rotation.z = -0.12;

  chairGrp.add(piston, seatCushion, backSpine, backMesh, headrest);
  return chairGrp;
}

function createCracUnit(index, materials, inspectables, bodyMat = materials.cracBody) {
  const crac = new THREE.Group();

  // Steel base plinth
  const basePlinth = new THREE.Mesh(sharedGeoPool.box(2.24, 0.16, 1.08), materials.darkSteelTrim);
  basePlinth.position.y = 0.08;
  basePlinth.receiveShadow = true;
  crac.add(basePlinth);

  // Main insulated steel cabinet body
  const mainBox = new THREE.Mesh(sharedGeoPool.box(2.2, 2.26, 1.04), bodyMat);
  mainBox.position.y = 1.29;
  mainBox.castShadow = true;
  mainBox.receiveShadow = true;
  crac.add(mainBox);

  // Detailed Front Panel (HMI Screen, Louvers, Nameplate CRAH-0X)
  const cracPanelTex = createCracPanelTexture(index);
  const cracHmiEmissive = createCracHmiEmissiveTexture();
  const frontPanelMat = new THREE.MeshStandardMaterial({
    map: cracPanelTex,
    emissiveMap: cracHmiEmissive,
    emissive: 0xffffff,
    emissiveIntensity: 0.95,
    roughness: 0.42,
    metalness: 0.28,
  });
  const frontPanel = new THREE.Mesh(sharedGeoPool.plane(2.12, 2.18), frontPanelMat);
  frontPanel.position.set(0, 1.29, 0.525);
  crac.add(frontPanel);

  // Chrome door latches
  for (const lx of [-0.08, 0.08]) {
    const latch = new THREE.Mesh(sharedGeoPool.box(0.035, 0.18, 0.04), materials.chrome);
    latch.position.set(lx, 1.26, 0.54);
    crac.add(latch);
  }

  // Cyan bottom airflow strip
  const strip = new THREE.Mesh(sharedGeoPool.box(2.1, 0.045, 0.03), materials.coldStrip);
  strip.position.set(0, 0.18, 0.53);
  crac.add(strip);

  // Top EC Fan Discharge / Return Plenum Hood + Dual Circular Fan Cowls
  const hood = new THREE.Mesh(sharedGeoPool.box(2.12, 0.24, 0.96), materials.darkSteelTrim);
  hood.position.y = 2.54;
  hood.castShadow = true;
  crac.add(hood);

  for (const fx of [-0.55, 0.55]) {
    const cowl = new THREE.Mesh(
      sharedGeoPool.cyl(0.38, 0.42, 0.14, 18),
      materials.aluCladding
    );
    cowl.position.set(fx, 2.7, 0);
    const hub = new THREE.Mesh(
      sharedGeoPool.cyl(0.12, 0.12, 0.16, 12),
      materials.darkSteelTrim
    );
    hub.position.set(fx, 2.7, 0);
    crac.add(cowl, hub);
  }

  // Rear top chilled-water supply (blue) & return (red) riser stubs connecting to overhead headers
  // CRAH sits at z = -12.05, y = 0.18 -> supplyHeader at z = -11.4, y = 3.20; returnHeader at z = -11.0, y = 3.55
  const supplyRiser = new THREE.Mesh(
    sharedGeoPool.cyl(0.075, 0.075, 0.86, 12),
    materials.pipeSupply
  );
  supplyRiser.position.set(-0.32, 2.75, 0.65);
  const supplyElbow = new THREE.Mesh(
    sharedGeoPool.cyl(0.075, 0.075, 0.42, 12),
    materials.pipeSupply
  );
  supplyElbow.rotation.x = Math.PI / 2;
  supplyElbow.position.set(-0.32, 2.38, 0.48);

  const returnRiser = new THREE.Mesh(
    sharedGeoPool.cyl(0.075, 0.075, 1.22, 12),
    materials.pipeReturn
  );
  returnRiser.position.set(0.32, 2.93, 1.05);
  const returnElbow = new THREE.Mesh(
    sharedGeoPool.cyl(0.075, 0.075, 0.82, 12),
    materials.pipeReturn
  );
  returnElbow.rotation.x = Math.PI / 2;
  returnElbow.position.set(0.32, 2.38, 0.68);

  // Brass isolation shutoff valve wheels on risers
  const valveMat = materials.brassValve;
  for (const [vx, vy, vz] of [
    [-0.32, 2.66, 0.65],
    [0.32, 2.66, 1.05],
  ]) {
    const valve = new THREE.Mesh(sharedGeoPool.cyl(0.11, 0.11, 0.04, 14), valveMat);
    valve.rotation.x = Math.PI / 2;
    valve.position.set(vx, vy, vz + 0.09);
    crac.add(valve);
  }

  crac.add(supplyRiser, supplyElbow, returnRiser, returnElbow);

  mainBox.userData.inspect = {
    category: 'Hassas Klima Ünitesi',
    name: `CRAH-0${index} Yükseltilmiş Döşeme Soğutucu`,
    specs: '180 kW Soğutma · Çift EC Fan %68 Devir · Üfleme 18.5°C / Dönüş 31.4°C',
  };
  inspectables.push(mainBox);
  crac.userData.panelMat = frontPanelMat;

  return crac;
}

export function buildDataCenter(scene, materials, colliders, inspectables, doors) {
  const dcGroup = new THREE.Group();
  dcGroup.name = 'DataCenterBuilding';

  // 1. Concrete Foundation Plinth & Interior Floors (y = 0.18)
  const plinth = new THREE.Mesh(sharedGeoPool.box(36.6, 0.18, 26.6), materials.darkSteelTrim);
  plinth.position.set(0, 0.09, 0);
  plinth.receiveShadow = true;
  dcGroup.add(plinth);

  // South entrance step/ramp leading cleanly into Lobby at x = -11.5, z = 13
  const ramp = new THREE.Mesh(sharedGeoPool.box(4.6, 0.14, 1.8), materials.plazaTile);
  ramp.position.set(-11.5, 0.09, 13.8);
  ramp.receiveShadow = true;
  dcGroup.add(ramp);

  // Zone-specific interior floors (slightly above plinth at y = 0.185)
  const lobbyFloor = new THREE.Mesh(sharedGeoPool.plane(13, 8), materials.lobbyFloor);
  lobbyFloor.rotation.x = -Math.PI / 2;
  lobbyFloor.position.set(-11.5, 0.185, 9);
  lobbyFloor.receiveShadow = true;

  const nocFloor = new THREE.Mesh(sharedGeoPool.plane(11, 10), materials.nocFloor);
  nocFloor.rotation.x = -Math.PI / 2;
  nocFloor.position.set(-12.5, 0.185, 0);
  nocFloor.receiveShadow = true;

  // Shared material aliases for Server Hall (room dimming & PointLights disabled for optimal VRAM/FPS)
  function cloneForServerDim(baseMat) {
    return baseMat;
  }

  const serverRaisedFloorMat = materials.raisedFloor;
  const serverPerfMat = materials.perforatedFloor;
  const serverCracBodyMat = materials.cracBody;
  const serverInnerWallMat = materials.interiorWall;
  const serverCeilingMat = materials.concreteExt;
  const cracPanelMats = [];

  const srvFiberTray = materials.fiberTray;
  const srvPowerTray = materials.powerTray;
  const srvChrome = materials.chrome;
  const srvFireRed = materials.fireRed;
  const srvRackTrim = materials.rackTrim;
  const srvDarkSteel = materials.darkSteelTrim;
  const srvCopperBus = materials.copperBus;
  const srvPipeSupply = materials.pipeSupply;
  const srvPipeReturn = materials.pipeReturn;
  const srvRackBody = materials.rackBody;
  const cabinetFactory = new CabinetAssetFactory();
  const placedCabinets = [];

  const srvFiberYellow = cabinetFactory.mats.fiberYellow;
  const srvFiberAqua = cabinetFactory.mats.fiberAqua;
  const srvCordRed = cabinetFactory.mats.powerCordRed;
  const srvCordBlue = cabinetFactory.mats.powerCordBlue;
  const serverCabMats = cabinetFactory.mats;

  const serverFloor = new THREE.Mesh(sharedGeoPool.plane(16, 18), serverRaisedFloorMat);
  serverFloor.rotation.x = -Math.PI / 2;
  serverFloor.position.set(1, 0.185, -4);
  serverFloor.receiveShadow = true;

  // Perforated airflow floor tiles inside Cold Aisle A (z = -7.9) and B (z = -0.9)
  const perfA = new THREE.Mesh(sharedGeoPool.plane(6.6, 2.0), serverPerfMat);
  perfA.rotation.x = -Math.PI / 2;
  perfA.position.set(-0.3, 0.19, -7.9);
  const perfB = new THREE.Mesh(sharedGeoPool.plane(6.6, 2.0), serverPerfMat);
  perfB.rotation.x = -Math.PI / 2;
  perfB.position.set(-0.3, 0.19, -0.9);

  const stagingFloor = new THREE.Mesh(sharedGeoPool.plane(14, 8), materials.mechFloor);
  stagingFloor.rotation.x = -Math.PI / 2;
  stagingFloor.position.set(2, 0.185, 9);
  stagingFloor.receiveShadow = true;

  const powerFloor = new THREE.Mesh(sharedGeoPool.plane(9, 26), materials.mechFloor);
  powerFloor.rotation.x = -Math.PI / 2;
  powerFloor.position.set(13.5, 0.185, 0);
  powerFloor.receiveShadow = true;

  const mechFloor = new THREE.Mesh(sharedGeoPool.plane(11, 8), materials.mechFloor);
  mechFloor.rotation.x = -Math.PI / 2;
  mechFloor.position.set(-12.5, 0.185, -9);
  mechFloor.receiveShadow = true;

  dcGroup.add(lobbyFloor, nocFloor, serverFloor, perfA, perfB, stagingFloor, powerFloor, mechFloor);

  // 2. Exterior Shell Walls (x: [-18, +18], z: [-13, +13])
  // North wall (z = -12.82)
  addWallBox(dcGroup, colliders, materials.concreteExt, -18, 18, -13.0, -12.64);
  // East wall (x = +17.82) with Emergency Exit Doorway at z = 8.9..10.7
  addWallBox(dcGroup, colliders, materials.concreteExt, 17.64, 18.0, -13.0, 8.9);
  addWallBox(dcGroup, colliders, materials.concreteExt, 17.64, 18.0, 8.9, 10.7, 2.75, 5.18, false);
  addWallBox(dcGroup, colliders, materials.concreteExt, 17.64, 18.0, 10.7, 13.0);
  // West wall: Mechanical & NOC solid precast + Lobby glass curtain
  addWallBox(dcGroup, colliders, materials.concreteExt, -18.0, -17.64, -13.0, 5.0);
  addWallBox(dcGroup, colliders, materials.concreteExt, -18.0, -17.64, 5.0, 13.0, 0.18, 1.0);
  addWallBox(dcGroup, colliders, materials.archGlass, -17.9, -17.74, 5.0, 13.0, 1.0, 4.1, false);
  addWallBox(dcGroup, colliders, materials.aluCladding, -18.0, -17.64, 5.0, 13.0, 4.1, 5.18, false);

  // South wall (z = +12.82):
  // Lobby curtain wall left of entrance (-18..-13.1)
  addWallBox(dcGroup, colliders, materials.concreteExt, -18.0, -13.1, 12.64, 13.0, 0.18, 1.0);
  addWallBox(dcGroup, colliders, materials.archGlass, -18.0, -13.1, 12.74, 12.9, 1.0, 4.1, false);
  addWallBox(dcGroup, colliders, materials.aluCladding, -18.0, -13.1, 12.64, 13.0, 4.1, 5.18, false);
  // Header over main entrance (-13.1..-9.9)
  addWallBox(dcGroup, colliders, materials.aluCladding, -13.1, -9.9, 12.64, 13.0, 3.35, 5.18, false);
  // Lobby curtain wall right of entrance (-9.9..-5.0)
  addWallBox(dcGroup, colliders, materials.concreteExt, -9.9, -5.0, 12.64, 13.0, 0.18, 1.0);
  addWallBox(dcGroup, colliders, materials.archGlass, -9.9, -5.0, 12.74, 12.9, 1.0, 4.1, false);
  addWallBox(dcGroup, colliders, materials.aluCladding, -9.9, -5.0, 12.64, 13.0, 4.1, 5.18, false);
  // Solid South wall for Staging & Power (-5.0..+18.0)
  addWallBox(dcGroup, colliders, materials.concreteExt, -5.0, 18.0, 12.64, 13.0);

  // Architectural exterior vertical cladding fins & main facade sign
  for (let fx = -16; fx <= 16; fx += 4) {
    if (fx > -14 && fx < -8) continue;
    const fin = new THREE.Mesh(sharedGeoPool.box(0.28, 5.1, 0.35), materials.aluCladding);
    fin.position.set(fx, 2.7, 13.12);
    fin.castShadow = true;
    dcGroup.add(fin);
  }
  const facadeSign = new THREE.Mesh(
    sharedGeoPool.plane(5.8, 1.25),
    new THREE.MeshBasicMaterial({
      map: createSignTexture('NEXA TIER-III VERİ MERKEZİ', '7/24 N+1 KRİTİK ALTYAPI', '#38bdf8'),
    })
  );
  facadeSign.position.set(-11.5, 4.35, 13.03);
  dcGroup.add(facadeSign);

  // Canopy overhang above South entrance
  const canopy = new THREE.Mesh(sharedGeoPool.box(7.2, 0.22, 2.2), materials.darkSteelTrim);
  canopy.position.set(-11.5, 3.65, 14.0);
  canopy.castShadow = true;
  dcGroup.add(canopy);

  // 3. Interior Partition Walls & Doorways
  // A) Partition along z = +5.0 (Lobby/Staging vs NOC/Server Hall)
  addWallBox(dcGroup, colliders, materials.interiorWall, -18.0, -13.5, 4.88, 5.12);
  addWallBox(dcGroup, colliders, materials.interiorWall, -13.5, -11.5, 4.88, 5.12, 3.3, 5.18, false); // NOC Door header
  addWallBox(dcGroup, colliders, materials.interiorWall, -11.5, 0.0, 4.88, 5.12);
  addWallBox(dcGroup, colliders, materials.interiorWall, 0.0, 2.4, 4.88, 5.12, 3.3, 5.18, false); // Server Door header
  addWallBox(dcGroup, colliders, materials.interiorWall, 2.4, 9.0, 4.88, 5.12);

  // B) Partition along z = -5.0 (Mechanical Room vs NOC)
  addWallBox(dcGroup, colliders, materials.interiorWall, -18.0, -7.0, -5.12, -4.88);

  // C) Partition along x = -7.0 (NOC & Mechanical vs Server Hall)
  addWallBox(dcGroup, colliders, materials.interiorWall, -7.12, -6.88, -13.0, -10.0);
  addWallBox(dcGroup, colliders, materials.interiorWall, -7.12, -6.88, -10.0, -8.0, 3.3, 5.18, false); // Mech Door header
  addWallBox(dcGroup, colliders, materials.interiorWall, -7.12, -6.88, -8.0, -4.4);
  // Panoramic NOC Observation Window (z = -4.4..+2.2)
  addWallBox(dcGroup, colliders, materials.interiorWallAccent, -7.12, -6.88, -4.4, 2.2, 0.18, 1.05);
  addWallBox(dcGroup, colliders, materials.archGlass, -7.04, -6.96, -4.4, 2.2, 1.05, 3.75, false);
  addWallBox(dcGroup, colliders, materials.interiorWall, -7.12, -6.88, -4.4, 2.2, 3.75, 5.18, false);
  // NOC -> Server Hall Door (z = +2.2..+4.2)
  addWallBox(dcGroup, colliders, materials.interiorWall, -7.12, -6.88, 2.2, 4.2, 3.3, 5.18, false);
  addWallBox(dcGroup, colliders, materials.interiorWall, -7.12, -6.88, 4.2, 5.0);

  // D) Partition along x = -5.0 (Lobby vs Security)
  addWallBox(dcGroup, colliders, materials.interiorWall, -5.12, -4.88, 5.0, 8.0);
  addWallBox(dcGroup, colliders, materials.interiorWall, -5.12, -4.88, 8.0, 10.2, 3.3, 5.18, false); // Mantrap Door header
  addWallBox(dcGroup, colliders, materials.interiorWall, -5.12, -4.88, 10.2, 13.0);

  // D2) Partition along x = +2.55 (Güvenlik Odası vs Donanım Hazırlık / Staging — sunucu salonu kapısının hemen sağından)
  addWallBox(dcGroup, colliders, materials.interiorWall, 2.43, 2.67, 5.0, 8.0);
  addWallBox(dcGroup, colliders, materials.interiorWall, 2.43, 2.67, 8.0, 10.2, 3.3, 5.18, false); // Security -> Staging Door header
  addWallBox(dcGroup, colliders, materials.interiorWall, 2.43, 2.67, 10.2, 13.0);

  // E) Partition along x = +9.0 (Server Hall / Staging vs Power & UPS)
  addWallBox(dcGroup, colliders, materials.interiorWall, 8.88, 9.12, -13.0, -5.0);
  addWallBox(dcGroup, colliders, materials.interiorWall, 8.88, 9.12, -5.0, -2.8, 3.3, 5.18, false); // Power North Door header
  addWallBox(dcGroup, colliders, materials.interiorWall, 8.88, 9.12, -2.8, 8.0);
  addWallBox(dcGroup, colliders, materials.interiorWall, 8.88, 9.12, 8.0, 10.2, 3.3, 5.18, false); // Power South Door header
  addWallBox(dcGroup, colliders, materials.interiorWall, 8.88, 9.12, 10.2, 13.0);

  // 4. Automatic Sliding Doors
  // Main Exterior Entrance
  createSlidingDoor({
    parent: dcGroup,
    doors,
    axis: 'x',
    centerX: -11.5,
    centerZ: 12.82,
    width: 3.2,
    height: 3.15,
    leafMat: materials.archGlass,
    frameMat: materials.darkSteelTrim,
  });
  // Lobby -> NOC
  createSlidingDoor({
    parent: dcGroup,
    doors,
    axis: 'x',
    centerX: -12.5,
    centerZ: 5.0,
    width: 2.0,
    height: 3.05,
    leafMat: materials.archGlass,
    frameMat: materials.darkSteelTrim,
  });
  // Lobby -> Staging Mantrap
  createSlidingDoor({
    parent: dcGroup,
    doors,
    axis: 'z',
    centerX: -5.0,
    centerZ: 9.1,
    width: 2.2,
    height: 3.05,
    leafMat: materials.archGlass,
    frameMat: materials.darkSteelTrim,
  });
  // NOC -> Server Hall
  createSlidingDoor({
    parent: dcGroup,
    doors,
    axis: 'z',
    centerX: -7.0,
    centerZ: 3.2,
    width: 2.0,
    height: 3.05,
    leafMat: materials.archGlass,
    frameMat: materials.darkSteelTrim,
  });
  // Security -> Server Hall: Dual Cylindrical Biometric & Weight-Sensing Security Capsules
  createDualSecurityCapsules({
    parent: dcGroup,
    doors,
    colliders,
    inspectables,
    materials,
    centerX: 1.2,
    centerZ: 5.0,
  });
  // Mechanical -> Server Hall
  createSlidingDoor({
    parent: dcGroup,
    doors,
    axis: 'z',
    centerX: -7.0,
    centerZ: -9.0,
    width: 2.0,
    height: 3.05,
    leafMat: materials.aluCladding,
    frameMat: materials.darkSteelTrim,
  });
  // Server Hall -> Power/UPS
  createSlidingDoor({
    parent: dcGroup,
    doors,
    axis: 'z',
    centerX: 9.0,
    centerZ: -3.9,
    width: 2.2,
    height: 3.05,
    leafMat: materials.aluCladding,
    frameMat: materials.darkSteelTrim,
  });
  // Security -> Staging (Donanım Ön Kurulum)
  createSlidingDoor({
    parent: dcGroup,
    doors,
    axis: 'z',
    centerX: 2.55,
    centerZ: 9.1,
    width: 2.2,
    height: 3.05,
    leafMat: materials.archGlass,
    frameMat: materials.darkSteelTrim,
  });
  // Staging -> Power/Battery
  createSlidingDoor({
    parent: dcGroup,
    doors,
    axis: 'z',
    centerX: 9.0,
    centerZ: 9.1,
    width: 2.2,
    height: 3.05,
    leafMat: materials.aluCladding,
    frameMat: materials.darkSteelTrim,
  });

  // Room Signs over Doorways
  const signs = [
    { pos: [-12.5, 3.85, 5.18], rotY: 0, t: 'GENEL KONTROL MERKEZİ', s: 'NOC · 7/24 İZLEME', c: '#38bdf8' },
    { pos: [1.2, 3.85, 5.18], rotY: 0, t: 'ANA SUNUCU SALONU', s: 'İKİLİ TARTIMLI KAPSÜL · KORİDOR A & B', c: '#0ea5e9' },
    { pos: [-5.18, 3.85, 9.1], rotY: -Math.PI / 2, t: 'GÜVENLİK GEÇİŞİ', s: 'BİYOMETRİK MANTRAP', c: '#f59e0b' },
    { pos: [2.37, 3.85, 9.1], rotY: -Math.PI / 2, t: 'DONANIM HAZIRLIK', s: 'ÖN TEST & LOJİSTİK (STAGİNG)', c: '#38bdf8' },
    { pos: [8.82, 3.85, -3.9], rotY: -Math.PI / 2, t: 'GÜÇ VE UPS ODASI', s: 'N+1 KESİNTİSİZ GÜÇ', c: '#22c55e' },
    { pos: [-6.82, 3.85, -9.0], rotY: Math.PI / 2, t: 'SOĞUTMA TESİSİ', s: 'CHILLER POMPA DAİRESİ', c: '#38bdf8' },
  ];
  signs.forEach((sg) => {
    const plane = new THREE.Mesh(
      sharedGeoPool.plane(2.1, 0.52),
      new THREE.MeshBasicMaterial({ map: createSignTexture(sg.t, sg.s, sg.c) })
    );
    plane.position.set(...sg.pos);
    plane.rotation.y = sg.rotY;
    dcGroup.add(plane);
  });

  // 5. ROOM 1: Giriş Lobisi & Güvenlik (x: [-18..-5], z: [+5..+13])
  // A) Entrance Walk-Off Floor Mat (Giriş Paspası) centered directly inside Main Glass Door (x = -11.5, z = 11.72)
  const matFrame = new THREE.Mesh(sharedGeoPool.box(3.38, 0.016, 1.56), materials.chrome);
  matFrame.position.set(-11.5, 0.19, 11.72);
  matFrame.receiveShadow = true;
  const matCarpet = new THREE.Mesh(
    sharedGeoPool.plane(3.24, 1.44),
    new THREE.MeshStandardMaterial({ map: createEntranceMatTexture(), roughness: 0.92, metalness: 0.05 })
  );
  matCarpet.rotation.x = -Math.PI / 2;
  matCarpet.position.set(-11.5, 0.2, 11.72);
  matCarpet.receiveShadow = true;
  // Exterior threshold rubber scraper strip on entrance ramp
  const extThresholdMat = new THREE.Mesh(sharedGeoPool.box(3.18, 0.014, 0.56), materials.cableDataDark);
  extThresholdMat.position.set(-11.5, 0.168, 13.28);
  dcGroup.add(matFrame, matCarpet, extThresholdMat);

  // B) Architectural Branded Reception Desk (x = -15.35, z = 8.9, facing East +X)
  const desk = new THREE.Group();
  desk.position.set(-15.35, 0.18, 8.9);

  // Lower Staff Worktop + Structural Steel Legs + Front Modesty Apron + Upper Visitor Ledge
  const deskWorktop = new THREE.Mesh(sharedGeoPool.box(0.84, 0.05, 3.38), materials.darkSteelTrim);
  deskWorktop.position.set(-0.14, 0.76, 0);
  deskWorktop.receiveShadow = true;
  const frontApron = new THREE.Mesh(sharedGeoPool.box(0.22, 1.04, 3.54), materials.rackBody);
  frontApron.position.set(0.34, 0.54, 0);
  const sideWingN = new THREE.Mesh(sharedGeoPool.box(1.06, 1.06, 0.08), materials.darkSteelTrim);
  sideWingN.position.set(-0.04, 0.55, -1.73);
  const sideWingS = new THREE.Mesh(sharedGeoPool.box(1.06, 1.06, 0.08), materials.darkSteelTrim);
  sideWingS.position.set(-0.04, 0.55, 1.73);
  const counterLedge = new THREE.Mesh(sharedGeoPool.box(0.48, 0.06, 3.62), materials.plazaTile);
  counterLedge.position.set(0.32, 1.1, 0);
  // Recessed Cyan Architectural Toe-Kick & Under-Ledge Light Strips
  const toeLed = new THREE.Mesh(sharedGeoPool.box(0.04, 0.04, 3.46), materials.coldStrip);
  toeLed.position.set(0.45, 0.06, 0);
  const ledgeLed = new THREE.Mesh(sharedGeoPool.box(0.04, 0.03, 3.5), materials.coldStrip);
  ledgeLed.position.set(0.47, 1.04, 0);

  // Front Illuminated NEXA Brand Fascia on Reception Apron (facing East +X)
  const brandFasciaFrame = new THREE.Mesh(sharedGeoPool.box(0.045, 0.64, 2.74), materials.darkSteelTrim);
  brandFasciaFrame.position.set(0.46, 0.58, 0);
  const brandFasciaFace = new THREE.Mesh(
    sharedGeoPool.plane(2.64, 0.56),
    new THREE.MeshStandardMaterial({
      map: createLobbyBrandSignTexture(),
      emissive: 0x082f49,
      emissiveIntensity: 0.35,
      roughness: 0.32,
    })
  );
  brandFasciaFace.rotation.y = Math.PI / 2;
  brandFasciaFace.position.set(0.486, 0.58, 0);

  // Shared Lobby Peripheral Materials
  const recKbMat = new THREE.MeshStandardMaterial({ map: createKeyboardTexture(), roughness: 0.4, metalness: 0.3 });
  const recPadMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 });
  const recEdgeMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    emissive: 0x0284c7,
    emissiveIntensity: 0.55,
  });
  const recSeatMat = new THREE.MeshStandardMaterial({ color: 0x17202e, roughness: 0.78, metalness: 0.12 });
  const recPaperMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 });

  // 2 Complete Reception Operator Workstations (z = -0.88 & +0.88, operator sitting at -X looking East +X)
  [-0.88, 0.88].forEach((wz, idx) => {
    const recTex = createReceptionMonitorTexture(idx);
    const monMat = new THREE.MeshStandardMaterial({
      map: recTex,
      emissiveMap: recTex,
      emissive: 0xffffff,
      emissiveIntensity: 0.85,
      roughness: 0.25,
    });
    const monPost = new THREE.Mesh(sharedGeoPool.cyl(0.022, 0.026, 0.32, 8), materials.chrome);
    monPost.position.set(0.12, 0.94, wz);
    const monBase = new THREE.Mesh(sharedGeoPool.box(0.14, 0.02, 0.16), materials.darkSteelTrim);
    monBase.position.set(0.12, 0.795, wz);
    const monBezel = new THREE.Mesh(sharedGeoPool.box(0.035, 0.36, 0.6), materials.rackBody);
    monBezel.position.set(0.09, 1.12, wz);
    const monScreen = new THREE.Mesh(sharedGeoPool.plane(0.56, 0.32), monMat);
    monScreen.rotation.y = -Math.PI / 2;
    monScreen.position.set(0.07, 1.12, wz);

    // XL Desk Mousepad (centered under Keyboard Left [-Z] & Mouse Right [+Z])
    const rPad = new THREE.Mesh(sharedGeoPool.box(0.36, 0.008, 0.76), recPadMat);
    rPad.position.set(-0.24, 0.79, wz);
    const rPadEdge = new THREE.Mesh(sharedGeoPool.box(0.37, 0.005, 0.77), recEdgeMat);
    rPadEdge.position.set(-0.24, 0.788, wz);

    // Mechanical Backlit Keyboard (slightly Left = -Z) + Cable into Grommet
    const rKb = new THREE.Mesh(sharedGeoPool.box(0.4, 0.02, 0.14), recKbMat);
    rKb.rotation.order = 'YXZ';
    rKb.rotation.set(0.05, -Math.PI / 2, 0);
    rKb.position.set(-0.24, 0.804, wz - 0.1);
    const rKbCord = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.17, 0.798, wz - 0.1),
          new THREE.Vector3(-0.04, 0.795, wz - 0.06),
          new THREE.Vector3(0.08, 0.792, wz),
          new THREE.Vector3(0.08, 0.73, wz),
        ]),
        10,
        0.005,
        5,
        false
      ),
      materials.cableDataDark
    );

    // Ergonomic Mouse (Right = +Z) + Glowing Scroll Wheel + Cable into Grommet
    const rMouse = new THREE.Mesh(sharedGeoPool.box(0.1, 0.026, 0.058), materials.rackBody);
    rMouse.position.set(-0.24, 0.805, wz + 0.22);
    const rMouseWheel = new THREE.Mesh(sharedGeoPool.box(0.02, 0.012, 0.012), materials.coldStrip);
    rMouseWheel.position.set(-0.205, 0.818, wz + 0.22);
    const rMouseCord = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.19, 0.798, wz + 0.22),
          new THREE.Vector3(-0.04, 0.795, wz + 0.14),
          new THREE.Vector3(0.08, 0.792, wz),
          new THREE.Vector3(0.08, 0.73, wz),
        ]),
        10,
        0.005,
        5,
        false
      ),
      materials.cableDataDark
    );

    // Monitor Display Cable + Grommet Cap + Under-Desk SFF PC Tower & Rear Umbilical
    const rMonCord = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.11, 1.06, wz),
          new THREE.Vector3(0.13, 0.92, wz),
          new THREE.Vector3(0.08, 0.79, wz),
          new THREE.Vector3(0.08, 0.73, wz),
        ]),
        8,
        0.006,
        5,
        false
      ),
      materials.cableDataDark
    );
    const rGrommet = new THREE.Mesh(sharedGeoPool.cyl(0.042, 0.042, 0.014, 10), materials.rackTrim);
    rGrommet.position.set(0.08, 0.79, wz);
    const sffPc = new THREE.Mesh(sharedGeoPool.box(0.38, 0.32, 0.17), materials.rackBody);
    sffPc.position.set(-0.04, 0.18, wz < 0 ? -1.42 : 1.42);
    const sffLed = new THREE.Mesh(sharedGeoPool.box(0.02, 0.05, 0.02), materials.coldStrip);
    sffLed.position.set(-0.235, 0.26, wz < 0 ? -1.42 : 1.42);
    const pcUmbilical = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0.15, 0.24, wz < 0 ? -1.42 : 1.42),
          new THREE.Vector3(0.16, 0.45, wz * 1.1),
          new THREE.Vector3(0.08, 0.73, wz),
        ]),
        10,
        0.011,
        6,
        false
      ),
      materials.cableCat6Blue
    );

    // Reception Ergonomic Mesh Task Chair (matching NOC chairs, facing East +X)
    const rChair = createErgonomicTaskChair(materials, recSeatMat);
    rChair.position.set(-0.78, 0, wz);
    rChair.rotation.y = Math.PI + (idx === 0 ? 0.1 : -0.1);

    desk.add(
      monPost,
      monBase,
      monBezel,
      monScreen,
      rPad,
      rPadEdge,
      rKb,
      rKbCord,
      rMouse,
      rMouseWheel,
      rMouseCord,
      rMonCord,
      rGrommet,
      sffPc,
      sffLed,
      pcUmbilical,
      rChair
    );
  });

  // RFID Visitor Card Encoder Pad + VoIP Phone + Visitor Badge Stand on Counter Ledge
  const rfidEncoder = new THREE.Mesh(sharedGeoPool.box(0.15, 0.035, 0.22), materials.darkSteelTrim);
  rfidEncoder.position.set(0.32, 1.145, -0.35);
  const recRfidGlow = new THREE.Mesh(sharedGeoPool.box(0.09, 0.01, 0.14), materials.coldStrip);
  recRfidGlow.position.set(0.32, 1.165, -0.35);
  const badgeStand = new THREE.Mesh(sharedGeoPool.box(0.12, 0.14, 0.18), materials.chrome);
  badgeStand.position.set(0.32, 1.2, 0.35);
  const recPhone = new THREE.Mesh(sharedGeoPool.box(0.18, 0.055, 0.22), materials.rackBody);
  recPhone.position.set(-0.08, 0.815, 0.02);

  desk.add(
    deskWorktop,
    frontApron,
    sideWingN,
    sideWingS,
    counterLedge,
    toeLed,
    ledgeLed,
    brandFasciaFrame,
    brandFasciaFace,
    rfidEncoder,
    recRfidGlow,
    badgeStand,
    recPhone
  );
  frontApron.userData.inspect = {
    category: 'Karşılama & Ziyaretçi Kaydı',
    name: 'NEXA Karşılama ve Güvenlik Bankosu',
    specs: 'Çift Operatör Konsolu · RFID Ziyaretçi Kart Kodlayıcı · Turnike Uzaktan Kontrol',
  };
  inspectables.push(frontApron);
  dcGroup.add(desk);
  addCollider(colliders, -16.45, -14.75, 7.05, 10.75);

  // North Wall Illuminated NEXA Welcome Brand Plaque (left of NOC door) + Digital Facility Directory (right of NOC door)
  const lobbyBrandWall = new THREE.Mesh(sharedGeoPool.box(2.72, 0.72, 0.08), materials.darkSteelTrim);
  lobbyBrandWall.position.set(-15.65, 2.55, 5.15);
  const lobbyBrandFace = new THREE.Mesh(
    sharedGeoPool.plane(2.58, 0.62),
    new THREE.MeshStandardMaterial({
      map: createLobbyBrandSignTexture(),
      emissive: 0x082f49,
      emissiveIntensity: 0.3,
      roughness: 0.35,
    })
  );
  lobbyBrandFace.position.set(-15.65, 2.55, 5.195);

  const dirFrame = new THREE.Mesh(sharedGeoPool.box(2.02, 1.28, 0.09), materials.darkSteelTrim);
  dirFrame.position.set(-8.4, 2.25, 5.15);
  const dirScreen = new THREE.Mesh(
    sharedGeoPool.plane(1.9, 1.18),
    new THREE.MeshStandardMaterial({
      map: createLobbyDirectoryTexture(),
      emissive: 0x0b1f33,
      emissiveIntensity: 0.38,
      roughness: 0.3,
    })
  );
  dirScreen.position.set(-8.4, 2.25, 5.2);
  dcGroup.add(lobbyBrandWall, lobbyBrandFace, dirFrame, dirScreen);

  // C) Visitor Waiting Lounge (2 Single Lounge Armchairs + Center Coffee Table in South-East Lobby: x = -7.35, z = 11.55)
  const loungeChairMat = new THREE.MeshStandardMaterial({ color: 0x243247, roughness: 0.78, metalness: 0.08 });
  function createLobbyArmchair(px, pz, yaw) {
    const lc = new THREE.Group();
    lc.position.set(px, 0.18, pz);
    lc.rotation.y = yaw;
    for (const lx of [-0.34, 0.34]) {
      for (const lz of [-0.32, 0.32]) {
        const leg = new THREE.Mesh(sharedGeoPool.cyl(0.022, 0.018, 0.22, 8), materials.chrome);
        leg.position.set(lx, 0.11, lz);
        lc.add(leg);
      }
    }
    const baseFrame = new THREE.Mesh(sharedGeoPool.box(0.76, 0.05, 0.74), materials.darkSteelTrim);
    baseFrame.position.y = 0.23;
    const seatCush = new THREE.Mesh(sharedGeoPool.box(0.66, 0.14, 0.66), loungeChairMat);
    seatCush.position.set(0, 0.32, -0.02);
    const backCush = new THREE.Mesh(sharedGeoPool.box(0.68, 0.48, 0.15), loungeChairMat);
    backCush.position.set(0, 0.6, 0.28);
    backCush.rotation.x = 0.12;
    for (const ax of [-0.35, 0.35]) {
      const arm = new THREE.Mesh(sharedGeoPool.box(0.11, 0.34, 0.7), loungeChairMat);
      arm.position.set(ax, 0.44, 0);
      lc.add(arm);
    }
    lc.add(baseFrame, seatCush, backCush);
    return lc;
  }

  const loungeChairL = createLobbyArmchair(-8.55, 11.55, -0.18);
  const loungeChairR = createLobbyArmchair(-6.15, 11.55, 0.18);

  // Center Coffee Table between the two armchairs (x = -7.35, z = 11.55)
  const coffeeTable = new THREE.Group();
  coffeeTable.position.set(-7.35, 0.18, 11.55);
  for (const [cx, cz] of [
    [-0.36, -0.24],
    [0.36, -0.24],
    [-0.36, 0.24],
    [0.36, 0.24],
  ]) {
    const tLeg = new THREE.Mesh(sharedGeoPool.box(0.04, 0.42, 0.04), materials.darkSteelTrim);
    tLeg.position.set(cx, 0.21, cz);
    coffeeTable.add(tLeg);
  }
  const tShelf = new THREE.Mesh(sharedGeoPool.box(0.78, 0.025, 0.52), materials.darkSteelTrim);
  tShelf.position.y = 0.14;
  const tTop = new THREE.Mesh(sharedGeoPool.box(0.92, 0.035, 0.64), materials.rackBody);
  tTop.position.y = 0.43;
  const tGlass = new THREE.Mesh(sharedGeoPool.box(0.86, 0.014, 0.58), materials.archGlass);
  tGlass.position.y = 0.455;
  // Visitor Welcome Folder + NEXA Guest Info Card on coffee table
  const brochure1 = new THREE.Mesh(sharedGeoPool.box(0.24, 0.025, 0.3), materials.pipeSupply);
  brochure1.position.set(-0.16, 0.47, 0.04);
  brochure1.rotation.y = 0.15;
  const brochure2 = new THREE.Mesh(sharedGeoPool.box(0.22, 0.018, 0.28), recPaperMat);
  brochure2.position.set(-0.14, 0.49, 0.02);
  brochure2.rotation.y = -0.1;
  const tableStand = new THREE.Mesh(sharedGeoPool.box(0.16, 0.13, 0.04), materials.chrome);
  tableStand.position.set(0.2, 0.52, -0.08);
  coffeeTable.add(tShelf, tTop, tGlass, brochure1, brochure2, tableStand);
  tTop.userData.inspect = {
    category: 'Ziyaretçi Bekleme Alanı',
    name: 'Misafir Bekleme Grubu (2 Koltuk & Sehpa)',
    specs: 'Ziyaretçi Karşılama Oturma Alanı · Güvenlik Bilgilendirme Broşürleri',
  };
  inspectables.push(tTop);

  // Decorative Architectural Planter in Lobby corners (South-East & South-West)
  const potMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.55, metalness: 0.25 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.72, metalness: 0.04 });
  for (const [px, pz] of [
    [-5.45, 12.15],
    [-17.2, 12.0],
  ]) {
    const pot = new THREE.Mesh(sharedGeoPool.cyl(0.24, 0.19, 0.54, 14), potMat);
    pot.position.set(px, 0.45, pz);
    const soil = new THREE.Mesh(sharedGeoPool.cyl(0.21, 0.21, 0.04, 12), materials.cableDataDark);
    soil.position.set(px, 0.71, pz);
    const stem = new THREE.Mesh(sharedGeoPool.cyl(0.025, 0.035, 0.75, 8), potMat);
    stem.position.set(px, 1.05, pz);
    const crownA = new THREE.Mesh(sharedGeoPool.sphere(0.28, 12, 10), leafMat);
    crownA.position.set(px, 1.44, pz);
    const crownB = new THREE.Mesh(sharedGeoPool.sphere(0.2, 10, 8), leafMat);
    crownB.position.set(px + 0.12, 1.24, pz - 0.08);
    dcGroup.add(pot, soil, stem, crownA, crownB);
  }
  dcGroup.add(loungeChairL, loungeChairR, coffeeTable);
  addCollider(colliders, -9.05, -5.65, 11.05, 12.2);

  // D) Shared 2-Lane Optical Speed-Gate Turnstile Builder (Mantrap East Door + NOC North Lobby Door)
  const laneGuideMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5, metalness: 0.2 });

  const addOpticalTurnstileGate = ({
    cx,
    cz,
    rotY = 0,
    specsText,
    gateTitle,
  }) => {
    const offsets = [-0.98, 0, 0.98];
    const alongX = Math.abs(Math.cos(rotY)) > 0.5;

    offsets.forEach((off, ti) => {
      const turn = new THREE.Group();
      const px = alongX ? cx : cx + off;
      const pz = alongX ? cz + off : cz;
      turn.position.set(px, 0.18, pz);
      turn.rotation.y = rotY;

      const tBase = new THREE.Mesh(sharedGeoPool.box(1.44, 0.04, 0.22), materials.darkSteelTrim);
      tBase.position.y = 0.02;
      const tBody = new THREE.Mesh(sharedGeoPool.box(1.36, 0.94, 0.16), materials.chrome);
      tBody.position.y = 0.51;
      const tTopGlass = new THREE.Mesh(sharedGeoPool.box(1.32, 0.035, 0.15), materials.rackBody);
      tTopGlass.position.y = 0.995;

      for (const ex of [-0.66, 0.66]) {
        const endCap = new THREE.Mesh(sharedGeoPool.cyl(0.08, 0.08, 0.96, 12), materials.chrome);
        endCap.position.set(ex, 0.51, 0);
        turn.add(endCap);
      }
      const readerPad = new THREE.Mesh(sharedGeoPool.box(0.16, 0.018, 0.11), materials.coldStrip);
      readerPad.position.set(-0.46, 1.018, 0);
      const arrowLed = new THREE.Mesh(sharedGeoPool.box(0.12, 0.015, 0.08), materials.greenLed);
      arrowLed.position.set(-0.62, 0.96, 0);
      const sideAccent = new THREE.Mesh(sharedGeoPool.box(0.92, 0.025, 0.17), materials.coldStrip);
      sideAccent.position.set(0, 0.88, 0);

      turn.add(tBase, tBody, tTopGlass, readerPad, arrowLed, sideAccent);

      if (ti < 2) {
        const wingCenterZ = 0.49;
        const wing = new THREE.Mesh(sharedGeoPool.box(0.024, 0.76, 0.74), materials.archGlass);
        wing.position.set(0.12, 0.58, wingCenterZ);
        const wingTrim = new THREE.Mesh(sharedGeoPool.box(0.03, 0.028, 0.74), materials.coldStrip);
        wingTrim.position.set(0.12, 0.96, wingCenterZ);
        turn.add(wing, wingTrim);
      }

      tBody.userData.inspect = {
        category: 'Fiziksel Geçiş Kontrolü',
        name: gateTitle,
        specs: specsText,
      };
      inspectables.push(tBody);
      dcGroup.add(turn);

      if (alongX) {
        addCollider(colliders, px - 0.73, px + 0.73, pz - 0.09, pz + 0.09);
      } else {
        addCollider(colliders, px - 0.09, px + 0.09, pz - 0.73, pz + 0.73);
      }
    });

    for (const laneOff of [-0.49, 0.49]) {
      const guide = new THREE.Mesh(
        alongX ? sharedGeoPool.box(1.75, 0.01, 0.08) : sharedGeoPool.box(0.08, 0.01, 1.75),
        laneGuideMat
      );
      if (alongX) {
        guide.position.set(cx + 0.2, 0.19, cz + laneOff);
      } else {
        guide.position.set(cx + laneOff, 0.19, cz - 0.2);
      }
      dcGroup.add(guide);
    }
  };

  // 1) East Lobby -> Biyometrik Mantrap Turnstiles (x = -6.35, z = 9.10)
  addOpticalTurnstileGate({
    cx: -6.35,
    cz: 9.1,
    rotY: 0,
    gateTitle: 'Optik Hızlı Geçiş Turnikesi (2 Hat)',
    specsText: 'RFID + QR + Biyometrik Entegrasyon · Mantrap Kapısı (Z: 9.10) ile Tam Hizalı · Antipanik Kanat',
  });

  // 2) North Lobby -> Genel Kontrol Merkezi (NOC) Turnstiles (x = -12.50, z = 6.35, facing Lobby +Z)
  addOpticalTurnstileGate({
    cx: -12.5,
    cz: 6.35,
    rotY: Math.PI / 2,
    gateTitle: 'NOC Lobi Giriş Optik Turnikesi (2 Hat)',
    specsText: 'Yetkili NOC Personel Kartı + Çift Yönlü Optik Sensör · NOC Cam Kapısı (X: -12.50) ile Tam Hizalı',
  });

  // 6. ROOM 2: Genel Kontrol Merkezi (NOC) (x: [-18..-7], z: [-5..+5])
  // Massive 4-Panel Micro-LED Video Wall on West Wall (x = -17.34) facing East
  const nocWallManager = createNocWallScreenManager();
  const videoWallGroup = new THREE.Group();
  videoWallGroup.position.set(-17.34, 0.18, -0.35);

  const wallFrame = new THREE.Mesh(sharedGeoPool.box(0.22, 3.22, 8.85), materials.darkSteelTrim);
  wallFrame.position.y = 2.68;
  videoWallGroup.add(wallFrame);

  const wallScreen = new THREE.Mesh(
    sharedGeoPool.plane(8.55, 2.95),
    new THREE.MeshBasicMaterial({ map: nocWallManager.texture })
  );
  wallScreen.rotation.y = Math.PI / 2;
  wallScreen.position.set(0.12, 2.68, 0);
  videoWallGroup.add(wallScreen);

  const wallHeaderLed = new THREE.Mesh(sharedGeoPool.box(0.06, 0.045, 8.6), materials.coldStrip);
  wallHeaderLed.position.set(0.11, 4.26, 0);
  videoWallGroup.add(wallHeaderLed);

  // Under-wall Video Matrix Controller Rack & Patch Risers
  const matrixCtrl = new THREE.Mesh(sharedGeoPool.box(0.42, 0.88, 3.6), materials.rackBody);
  matrixCtrl.position.set(0.16, 0.44, 0);
  const ctrlLed = new THREE.Mesh(sharedGeoPool.box(0.03, 0.04, 3.2), materials.coldStrip);
  ctrlLed.position.set(0.38, 0.72, 0);
  videoWallGroup.add(matrixCtrl, ctrlLed);
  addCollider(colliders, -17.6, -16.85, -2.2, 1.5);

  for (const rz of [-1.2, 0, 1.2]) {
    const wallRiser = new THREE.Mesh(
      sharedGeoPool.cyl(0.022, 0.022, 0.42, 8),
      cabinetFactory.mats.fiberAqua
    );
    wallRiser.position.set(0.16, 1.0, rz);
    videoWallGroup.add(wallRiser);
  }

  wallFrame.userData.inspect = {
    category: 'Genel Kontrol Merkezi (NOC)',
    name: '4-Panelli Micro-LED Komuta Duvarı',
    specs: 'PUE: 1.23 · Aktif Yük: 1.42 MW · 24 Kabin + NOC-IDF-01 · CCTV & VESDA Aktif',
  };
  inspectables.push(wallFrame);
  dcGroup.add(videoWallGroup);

  // Dedicated NOC Switch & Patch Distribution Cabinet (NOC-IDF-01) along North-East NOC Wall
  const nocIdfCab = cabinetFactory.createCabinet({
    type: 'switch',
    code: 'NOC-IDF-01',
    podName: 'NOC Kontrol',
    showLeftSide: true,
    showRightSide: true,
    inspectables,
  });
  nocIdfCab.position.set(-8.35, 0.18, -4.35);
  dcGroup.add(nocIdfCab);
  placedCabinets.push(nocIdfCab);
  addCollider(colliders, -8.88, -7.82, -4.95, -3.75);

  // Wall-Mounted NOC Perimeter Cable Tray running cleanly straight along the North Wall (z = -4.68)
  const nocWallTray = new THREE.Mesh(sharedGeoPool.box(10.65, 0.075, 0.34), materials.fiberTray);
  nocWallTray.position.set(-12.325, 2.66, -4.68);
  const nocWallFiberY = new THREE.Mesh(
    sharedGeoPool.cyl(0.026, 0.026, 10.55, 8),
    cabinetFactory.mats.fiberYellow
  );
  nocWallFiberY.rotation.z = Math.PI / 2;
  nocWallFiberY.position.set(-12.325, 2.7, -4.74);
  const nocWallFiberA = new THREE.Mesh(
    sharedGeoPool.cyl(0.024, 0.024, 10.55, 8),
    cabinetFactory.mats.fiberAqua
  );
  nocWallFiberA.rotation.z = Math.PI / 2;
  nocWallFiberA.position.set(-12.325, 2.7, -4.68);
  const nocWallCat6 = new THREE.Mesh(
    sharedGeoPool.cyl(0.024, 0.024, 10.55, 8),
    materials.cableCat6Blue
  );
  nocWallCat6.rotation.z = Math.PI / 2;
  nocWallCat6.position.set(-12.325, 2.7, -4.61);
  // Closed West End-Cap on Wall Tray
  const wallTrayCap = new THREE.Mesh(sharedGeoPool.box(0.03, 0.08, 0.34), materials.fiberTray);
  wallTrayCap.position.set(-17.64, 2.66, -4.68);
  dcGroup.add(nocWallTray, nocWallFiberY, nocWallFiberA, nocWallCat6, wallTrayCap);

  // Steel L-Brackets bolting the Cable Tray directly to the North Partition Wall (z = -4.88)
  for (const wx of [-17.1, -15.2, -13.1, -11.05, -9.2, -7.4]) {
    const wallBracket = new THREE.Mesh(sharedGeoPool.box(0.07, 0.22, 0.4), materials.darkSteelTrim);
    wallBracket.position.set(wx, 2.58, -4.7);
    dcGroup.add(wallBracket);
  }

  // Short T-Spur Tray over NOC-IDF-01 Front Fiber Chimney (z = -4.68 -> -4.09 at x = -8.35) + Closed Power Junction Box over Rear Chimney (z = -4.61)
  const idfSpurTray = new THREE.Mesh(sharedGeoPool.box(0.36, 0.075, 0.68), materials.fiberTray);
  idfSpurTray.position.set(-8.35, 2.66, -4.38);
  const idfSpurCap = new THREE.Mesh(sharedGeoPool.box(0.36, 0.08, 0.03), materials.fiberTray);
  idfSpurCap.position.set(-8.35, 2.66, -4.05);
  const idfSpurFiber = new THREE.Mesh(
    sharedGeoPool.cyl(0.026, 0.026, 0.6, 8),
    cabinetFactory.mats.fiberYellow
  );
  idfSpurFiber.rotation.x = Math.PI / 2;
  idfSpurFiber.position.set(-8.35, 2.7, -4.38);
  const idfPwrBox = new THREE.Mesh(sharedGeoPool.box(0.56, 0.22, 0.3), materials.darkSteelTrim);
  idfPwrBox.position.set(-8.35, 2.72, -4.63);
  dcGroup.add(idfSpurTray, idfSpurCap, idfSpurFiber, idfPwrBox);

  // West Wall Corner Steel Conduit Drop into Video Wall Matrix Controller (flush in NW corner)
  const vwDropChannel = new THREE.Mesh(
    sharedGeoPool.box(0.14, 2.5, 0.14),
    materials.darkSteelTrim
  );
  vwDropChannel.position.set(-17.56, 1.43, -4.78);
  const vwFloorRun = new THREE.Mesh(sharedGeoPool.box(0.14, 0.045, 2.7), materials.darkSteelTrim);
  vwFloorRun.position.set(-17.56, 0.205, -3.45);
  dcGroup.add(vwDropChannel, vwFloorRun);

  // Two Flush Wall-Mounted Cable Riser Channels on the North Wall (z = -4.82) feeding Console Rows via Floor Raceways (no standing poles!)
  for (const [riserX, rowX] of [
    [-15.2, -14.2],
    [-11.05, -11.4],
  ]) {
    const wallRiser = new THREE.Mesh(
      sharedGeoPool.box(0.16, 2.48, 0.12),
      materials.darkSteelTrim
    );
    wallRiser.position.set(riserX, 1.42, -4.82);

    // Flush Floor Cable Raceway stepping from wall riser to under-desk line (rowX - 0.38)
    const wallFeedRun = new THREE.Mesh(sharedGeoPool.box(0.18, 0.036, 1.65), materials.darkSteelTrim);
    wallFeedRun.position.set(riserX, 0.203, -4.0);
    const crossRunW = Math.abs(rowX - 0.38 - riserX) + 0.18;
    const crossRun = new THREE.Mesh(sharedGeoPool.box(crossRunW, 0.036, 0.18), materials.darkSteelTrim);
    crossRun.position.set((riserX + (rowX - 0.38)) / 2, 0.203, -3.18);

    // Under-Desk Spine Raceway along x = rowX - 0.38 (z: -3.20..+1.45)
    const raceway = new THREE.Mesh(sharedGeoPool.box(0.22, 0.038, 4.75), materials.darkSteelTrim);
    raceway.position.set(rowX - 0.38, 0.204, -0.88);
    const racewayCat6 = new THREE.Mesh(
      sharedGeoPool.cyl(0.015, 0.015, 4.65, 8),
      materials.cableCat6Blue
    );
    racewayCat6.rotation.x = Math.PI / 2;
    racewayCat6.position.set(rowX - 0.34, 0.226, -0.88);
    const racewayPwr = new THREE.Mesh(
      sharedGeoPool.cyl(0.015, 0.015, 4.65, 8),
      materials.cableDataDark
    );
    racewayPwr.rotation.x = Math.PI / 2;
    racewayPwr.position.set(rowX - 0.42, 0.226, -0.88);

    dcGroup.add(wallRiser, wallFeedRun, crossRun, raceway, racewayCat6, racewayPwr);
  }

  // Shared Operator Monitor, Keyboard & Complete Cable Geometries
  const monScreenMats = [0, 1, 2].map((v) => {
    const opTex = createOperatorMonitorTexture(v);
    return new THREE.MeshStandardMaterial({
      map: opTex,
      emissiveMap: opTex,
      emissive: 0xffffff,
      emissiveIntensity: 0.88,
      roughness: 0.22,
    });
  });
  const keyboardMat = new THREE.MeshStandardMaterial({
    map: createKeyboardTexture(),
    roughness: 0.38,
    metalness: 0.35,
  });
  const deskPadMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 });
  const padEdgeMat = new THREE.MeshStandardMaterial({
    color: 0x0ea5e9,
    emissive: 0x0284c7,
    emissiveIntensity: 0.65,
  });
  const meshSeatMat = new THREE.MeshStandardMaterial({ color: 0x17202e, roughness: 0.78, metalness: 0.12 });
  const mugMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3 });

  // Vertical Umbilical Cable Bundle cleanly bridging Floor Junction Box (-0.38, 0.04, 0) to Desk Trough (-0.38, 0.74, 0)
  const deskDropCableGeo = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.38, 0.04, 0.0),
      new THREE.Vector3(-0.38, 0.38, 0.0),
      new THREE.Vector3(-0.38, 0.75, 0.0),
    ]),
    10,
    0.014,
    6,
    false
  );
  // Under-desk SFF PC rear cables routed neatly into central Floor Junction Box (-0.38, 0.05, 0)
  const pcRearLeftGeo = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.34, 0.24, -0.74),
      new THREE.Vector3(-0.38, 0.12, -0.62),
      new THREE.Vector3(-0.38, 0.05, 0.0),
    ]),
    10,
    0.008,
    6,
    false
  );
  const pcRearRightGeo = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.34, 0.24, 0.74),
      new THREE.Vector3(-0.38, 0.12, 0.62),
      new THREE.Vector3(-0.38, 0.05, 0.0),
    ]),
    10,
    0.008,
    6,
    false
  );
  // Desktop Peripheral Cords hugging desk flat into Desk Grommet Center (-0.38, 0.78, 0)
  const mouseCordGeo = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.145, 0.786, -0.28),
      new THREE.Vector3(-0.02, 0.786, -0.22),
      new THREE.Vector3(-0.22, 0.784, -0.1),
      new THREE.Vector3(-0.38, 0.78, 0.0),
      new THREE.Vector3(-0.38, 0.73, 0.0),
    ]),
    12,
    0.005,
    5,
    false
  );
  const kbdCordGeo = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.1, 0.788, 0.1),
      new THREE.Vector3(-0.05, 0.786, 0.08),
      new THREE.Vector3(-0.24, 0.784, 0.04),
      new THREE.Vector3(-0.38, 0.78, 0.0),
      new THREE.Vector3(-0.38, 0.73, 0.0),
    ]),
    12,
    0.006,
    5,
    false
  );
  const phoneCordGeo = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.16, 0.795, -0.96),
      new THREE.Vector3(-0.35, 0.785, -0.68),
      new THREE.Vector3(-0.38, 0.78, 0.0),
      new THREE.Vector3(-0.38, 0.73, 0.0),
    ]),
    10,
    0.005,
    5,
    false
  );
  // DisplayPort / Power Cables routed from each Monitor Back -> along VESA Bar -> down into Grommet (-0.38, 0.73, 0)
  const monCenterCordGeo = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.27, 1.07, 0.04),
      new THREE.Vector3(-0.38, 1.04, 0.02),
      new THREE.Vector3(-0.38, 0.73, 0.0),
    ]),
    10,
    0.005,
    5,
    false
  );
  const monLeftCordGeo = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.19, 1.07, -0.68),
      new THREE.Vector3(-0.33, 1.06, -0.58),
      new THREE.Vector3(-0.36, 1.05, -0.04),
      new THREE.Vector3(-0.38, 0.73, 0.0),
    ]),
    12,
    0.005,
    5,
    false
  );
  const monRightCordGeo = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.19, 1.07, 0.68),
      new THREE.Vector3(-0.33, 1.06, 0.58),
      new THREE.Vector3(-0.36, 1.05, 0.04),
      new THREE.Vector3(-0.38, 0.73, 0.0),
    ]),
    12,
    0.005,
    5,
    false
  );

  // 2 Rows of Ergonomic Triple-Monitor NOC Consoles facing the Video Wall (West)
  const consolePositions = [
    [-14.2, -2.0],
    [-14.2, 1.3],
    [-11.4, -2.0],
    [-11.4, 1.3],
  ];
  consolePositions.forEach(([cx, cz], idx) => {
    const consoleGrp = new THREE.Group();
    consoleGrp.position.set(cx, 0.18, cz);

    // Beveled Desktop + Front Wrist Trim + Recessed Rear Cable Trough
    const table = new THREE.Mesh(sharedGeoPool.box(1.04, 0.05, 2.38), materials.darkSteelTrim);
    table.position.y = 0.75;
    table.receiveShadow = true;
    const wristEdge = new THREE.Mesh(sharedGeoPool.box(0.05, 0.055, 2.38), materials.aluCladding);
    wristEdge.position.set(0.51, 0.75, 0);
    const cableTrough = new THREE.Mesh(sharedGeoPool.box(0.16, 0.08, 2.1), materials.rackBody);
    cableTrough.position.set(-0.42, 0.68, 0);
    const modestyPanel = new THREE.Mesh(sharedGeoPool.box(0.03, 0.42, 2.0), materials.aluCladding);
    modestyPanel.position.set(-0.34, 0.5, 0);

    // Steel C-Legs with Floor Pads
    for (const lz of [-1.02, 1.02]) {
      const legV = new THREE.Mesh(sharedGeoPool.box(0.12, 0.72, 0.08), materials.aluCladding);
      legV.position.set(-0.14, 0.36, lz);
      const legFoot = new THREE.Mesh(sharedGeoPool.box(0.76, 0.045, 0.1), materials.darkSteelTrim);
      legFoot.position.set(0.02, 0.023, lz);
      consoleGrp.add(legV, legFoot);
    }

    // 2 Under-Desk SFF Workstation PCs + Complete Cable Curves into Floor Junction Box
    for (const pz of [-0.74, 0.74]) {
      const pc = new THREE.Mesh(sharedGeoPool.box(0.42, 0.32, 0.18), materials.rackBody);
      pc.position.set(-0.14, 0.24, pz);
      const pcLed = new THREE.Mesh(sharedGeoPool.box(0.02, 0.06, 0.02), materials.coldStrip);
      pcLed.position.set(0.075, 0.32, pz);
      consoleGrp.add(pc, pcLed);
    }

    const floorJBox = new THREE.Mesh(sharedGeoPool.box(0.24, 0.06, 0.24), materials.rackBody);
    floorJBox.position.set(-0.38, 0.04, 0);
    const pcCableL = new THREE.Mesh(pcRearLeftGeo, materials.cableCat6Blue);
    const pcCableR = new THREE.Mesh(pcRearRightGeo, materials.cableCat6Blue);

    // Floor-to-Desk Umbilical Cable Bundle into Rear Grommet
    const dropBlue = new THREE.Mesh(deskDropCableGeo, materials.cableCat6Blue);
    const dropDark = new THREE.Mesh(deskDropCableGeo, materials.cableDataDark);
    dropDark.position.z = -0.05;
    const grommetCap = new THREE.Mesh(sharedGeoPool.cyl(0.055, 0.055, 0.015, 12), materials.rackTrim);
    grommetCap.position.set(-0.38, 0.78, 0);
    consoleGrp.add(floorJBox, pcCableL, pcCableR, dropBlue, dropDark, grommetCap);

    // Triple Articulated Monitor Arm + VESA Extension Brackets + 3 Telemetry Screens
    const armPost = new THREE.Mesh(sharedGeoPool.cyl(0.028, 0.028, 0.42, 10), materials.chrome);
    armPost.position.set(-0.38, 0.96, 0);
    const armBar = new THREE.Mesh(sharedGeoPool.box(0.04, 0.04, 1.32), materials.rackTrim);
    armBar.position.set(-0.32, 1.07, 0);
    const centerBracket = new THREE.Mesh(sharedGeoPool.box(0.08, 0.035, 0.08), materials.rackTrim);
    centerBracket.position.set(-0.29, 1.07, 0);
    for (const sz of [-0.64, 0.64]) {
      const sideArm = new THREE.Mesh(sharedGeoPool.box(0.16, 0.035, 0.06), materials.rackTrim);
      sideArm.position.set(-0.24, 1.07, sz);
      consoleGrp.add(sideArm);
    }
    const monCordC = new THREE.Mesh(monCenterCordGeo, materials.cableDataDark);
    const monCordL = new THREE.Mesh(monLeftCordGeo, materials.cableDataDark);
    const monCordR = new THREE.Mesh(monRightCordGeo, materials.cableDataDark);
    consoleGrp.add(armPost, armBar, centerBracket, monCordC, monCordL, monCordR);

    const monitors = [
      { x: -0.26, z: 0, w: 0.68, h: 0.38, yaw: Math.PI / 2, matIdx: idx % 3 },
      { x: -0.17, z: -0.68, w: 0.54, h: 0.34, yaw: Math.PI / 2 - 0.34, matIdx: (idx + 1) % 3 },
      { x: -0.17, z: 0.68, w: 0.54, h: 0.34, yaw: Math.PI / 2 + 0.34, matIdx: (idx + 2) % 3 },
    ];
    monitors.forEach((m) => {
      const mGrp = new THREE.Group();
      mGrp.position.set(m.x, 1.09, m.z);
      mGrp.rotation.y = m.yaw;

      const bezel = new THREE.Mesh(sharedGeoPool.box(m.w, m.h, 0.03), materials.rackBody);
      const disp = new THREE.Mesh(sharedGeoPool.plane(m.w - 0.03, m.h - 0.03), monScreenMats[m.matIdx]);
      disp.position.z = 0.017;
      mGrp.add(bezel, disp);
      consoleGrp.add(mGrp);
    });

    // XL Desk Mousepad (centered under Keyboard Left & Mouse Right)
    const mousepad = new THREE.Mesh(sharedGeoPool.box(0.42, 0.008, 0.96), deskPadMat);
    mousepad.position.set(0.18, 0.78, 0.0);
    const padBorder = new THREE.Mesh(sharedGeoPool.box(0.43, 0.005, 0.97), padEdgeMat);
    padBorder.position.set(0.18, 0.778, 0.0);

    // Mechanical Backlit Keyboard slightly LEFT (+Z from operator facing -X) with correctly oriented keys
    const keyboard = new THREE.Mesh(sharedGeoPool.box(0.44, 0.022, 0.16), keyboardMat);
    keyboard.position.set(0.18, 0.796, 0.1);
    keyboard.rotation.set(0.06, Math.PI / 2, 0);
    const kbdCord = new THREE.Mesh(kbdCordGeo, materials.cableDataDark);

    // Ergonomic Mouse on RIGHT (-Z from operator facing -X) + Scroll Wheel + Complete Cable into Grommet
    const mouseBody = new THREE.Mesh(sharedGeoPool.box(0.11, 0.028, 0.064), materials.rackBody);
    mouseBody.position.set(0.2, 0.796, -0.28);
    const mouseWheel = new THREE.Mesh(sharedGeoPool.box(0.024, 0.014, 0.012), materials.coldStrip);
    mouseWheel.position.set(0.165, 0.811, -0.28);
    const mouseCord = new THREE.Mesh(mouseCordGeo, materials.cableDataDark);

    // VoIP NOC Hotline Phone + Complete Cable into Grommet + Coffee Mug
    const phoneBase = new THREE.Mesh(sharedGeoPool.box(0.18, 0.055, 0.22), materials.rackBody);
    phoneBase.position.set(-0.08, 0.805, -0.96);
    phoneBase.rotation.z = -0.15;
    const phoneHandset = new THREE.Mesh(sharedGeoPool.box(0.17, 0.035, 0.05), materials.darkSteelTrim);
    phoneHandset.position.set(-0.08, 0.835, -1.03);
    const phoneScreen = new THREE.Mesh(sharedGeoPool.box(0.08, 0.012, 0.09), materials.coldStrip);
    phoneScreen.position.set(-0.1, 0.832, -0.92);
    const phoneCord = new THREE.Mesh(phoneCordGeo, materials.cableCat6Blue);

    const mug = new THREE.Mesh(sharedGeoPool.cyl(0.042, 0.038, 0.095, 12), mugMat);
    mug.position.set(0.22, 0.825, 0.86);

    // Ergonomic Mesh Task Chair (5-Star Caster Base + Pneumatic Piston + Armrests + Mesh Back & Headrest)
    const chairGrp = new THREE.Group();
    chairGrp.position.set(0.76, 0, 0);
    chairGrp.rotation.y = idx % 2 === 0 ? 0.09 : -0.09;

    const hub = new THREE.Mesh(sharedGeoPool.cyl(0.045, 0.055, 0.06, 10), materials.chrome);
    hub.position.y = 0.09;
    chairGrp.add(hub);

    for (let s = 0; s < 5; s++) {
      const ang = (s * Math.PI * 2) / 5;
      const spoke = new THREE.Mesh(sharedGeoPool.box(0.29, 0.028, 0.036), materials.chrome);
      spoke.position.set(Math.cos(ang) * 0.145, 0.075, Math.sin(ang) * 0.145);
      spoke.rotation.y = -ang;
      const caster = new THREE.Mesh(sharedGeoPool.cyl(0.028, 0.028, 0.032, 10), materials.rackBody);
      caster.rotation.x = Math.PI / 2;
      caster.position.set(Math.cos(ang) * 0.27, 0.03, Math.sin(ang) * 0.27);
      chairGrp.add(spoke, caster);
    }

    const piston = new THREE.Mesh(sharedGeoPool.cyl(0.028, 0.032, 0.36, 10), materials.chrome);
    piston.position.y = 0.27;
    const seatCushion = new THREE.Mesh(sharedGeoPool.box(0.48, 0.075, 0.48), meshSeatMat);
    seatCushion.position.y = 0.48;

    for (const az of [-0.26, 0.26]) {
      const armV = new THREE.Mesh(sharedGeoPool.box(0.04, 0.18, 0.04), materials.chrome);
      armV.position.set(0.02, 0.56, az);
      const armPad = new THREE.Mesh(sharedGeoPool.box(0.28, 0.035, 0.07), meshSeatMat);
      armPad.position.set(-0.02, 0.65, az);
      chairGrp.add(armV, armPad);
    }

    const backSpine = new THREE.Mesh(sharedGeoPool.box(0.045, 0.52, 0.09), materials.darkSteelTrim);
    backSpine.position.set(0.24, 0.72, 0);
    const backMesh = new THREE.Mesh(sharedGeoPool.box(0.055, 0.54, 0.44), meshSeatMat);
    backMesh.position.set(0.22, 0.81, 0);
    backMesh.rotation.z = -0.1;
    const headrest = new THREE.Mesh(sharedGeoPool.box(0.06, 0.15, 0.26), meshSeatMat);
    headrest.position.set(0.26, 1.15, 0);
    headrest.rotation.z = -0.12;

    chairGrp.add(piston, seatCushion, backSpine, backMesh, headrest);

    consoleGrp.add(
      table,
      wristEdge,
      cableTrough,
      modestyPanel,
      mousepad,
      padBorder,
      keyboard,
      kbdCord,
      mouseBody,
      mouseWheel,
      mouseCord,
      phoneBase,
      phoneHandset,
      phoneScreen,
      phoneCord,
      mug,
      chairGrp
    );
    dcGroup.add(consoleGrp);
    addCollider(colliders, cx - 0.58, cx + 1.06, cz - 1.25, cz + 1.25);

    table.userData.inspect = {
      category: 'NOC Operatör Konsolu',
      name: `Operatör İstasyonu OP-0${idx + 1}`,
      specs: '3× 27" Monitör · Çift SFF İş İstasyonu · Mekanik Klavye & VoIP · Cat6a/Fiber Uplink',
    };
    inspectables.push(table);
  });

  // Perimeter NOC Storage: Archive File Cabinets, Equipment Locker & Documentation Credenza
  const fileCabMat = new THREE.MeshStandardMaterial({
    map: createFileCabinetTexture(),
    roughness: 0.46,
    metalness: 0.52,
  });
  const lockerFrontMat = new THREE.MeshStandardMaterial({
    map: createSafetyLockerTexture(),
    roughness: 0.48,
    metalness: 0.48,
  });
  const printerLcdMat = new THREE.MeshStandardMaterial({
    map: createPrinterPanelTexture(),
    roughness: 0.35,
  });
  const credDoorsMat = new THREE.MeshStandardMaterial({
    map: createCredenzaDoorsTexture(),
    roughness: 0.45,
    metalness: 0.52,
  });
  const paperMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.85 });

  // 1) South-West 4-Drawer Steel File Cabinets (z = +4.48, facing North -Z) + Stacked Archive Folders
  for (const [fi, fx] of [-16.35, -15.65].entries()) {
    const fCab = new THREE.Mesh(sharedGeoPool.box(0.62, 1.38, 0.56), materials.rackTrim);
    fCab.position.set(fx, 0.87, 4.48);
    const fFront = new THREE.Mesh(sharedGeoPool.plane(0.56, 1.32), fileCabMat);
    fFront.rotation.y = Math.PI;
    fFront.position.set(fx, 0.87, 4.195);
    // Detailed 3-tier folder & binder stack on top
    const folder1 = new THREE.Mesh(sharedGeoPool.box(0.32, 0.045, 0.36), materials.pipeSupply);
    folder1.position.set(fx, 1.585, 4.46);
    const folder2 = new THREE.Mesh(sharedGeoPool.box(0.3, 0.04, 0.34), fi === 0 ? paperMat : materials.fireRed);
    folder2.position.set(fx, 1.628, 4.46);
    folder2.rotation.y = fi === 0 ? 0.08 : -0.06;
    const folderLabel = new THREE.Mesh(sharedGeoPool.box(0.06, 0.025, 0.16), paperMat);
    folderLabel.position.set(fx, 1.59, 4.28);
    dcGroup.add(fCab, fFront, folder1, folder2, folderLabel);
  }
  addCollider(colliders, -16.8, -15.25, 4.12, 4.88);

  // 2) South-East Double-Door Steel NOC Equipment Locker (z = +4.46, facing North -Z) + Top Archive Box & OTDR Case
  const nocLocker = new THREE.Mesh(sharedGeoPool.box(1.55, 1.98, 0.58), materials.darkSteelTrim);
  nocLocker.position.set(-9.25, 1.17, 4.46);
  const lockerDoor = new THREE.Mesh(sharedGeoPool.plane(1.46, 1.9), lockerFrontMat);
  lockerDoor.rotation.y = Math.PI;
  lockerDoor.position.set(-9.25, 1.17, 4.165);
  const keyBox = new THREE.Mesh(sharedGeoPool.box(0.42, 0.52, 0.14), materials.fireRed);
  keyBox.position.set(-10.45, 1.62, 4.78);
  const archBox = new THREE.Mesh(sharedGeoPool.box(0.44, 0.28, 0.38), materials.cracBody);
  archBox.position.set(-9.6, 2.3, 4.45);
  const archBoxLid = new THREE.Mesh(sharedGeoPool.box(0.47, 0.05, 0.41), materials.pipeSupply);
  archBoxLid.position.set(-9.6, 2.45, 4.45);
  const otdrCase = new THREE.Mesh(sharedGeoPool.box(0.42, 0.16, 0.34), materials.generatorYellow);
  otdrCase.position.set(-8.88, 2.24, 4.45);
  dcGroup.add(nocLocker, lockerDoor, keyBox, archBox, archBoxLid, otdrCase);
  addCollider(colliders, -10.15, -8.35, 4.1, 4.88);

  // 3) North Wall Credenza with Sliding Cabinet Doors, Enterprise Laser Printer/MFP, Ring Binders & Document Trays
  const credenza = new THREE.Mesh(sharedGeoPool.box(3.4, 0.86, 0.62), materials.darkSteelTrim);
  credenza.position.set(-13.1, 0.61, -4.45);
  const credFront = new THREE.Mesh(sharedGeoPool.plane(3.32, 0.78), credDoorsMat);
  credFront.position.set(-13.1, 0.61, -4.135);
  const credTop = new THREE.Mesh(sharedGeoPool.box(3.48, 0.05, 0.66), materials.aluCladding);
  credTop.position.set(-13.1, 1.06, -4.45);
  dcGroup.add(credenza, credFront, credTop);

  // Detailed Enterprise A3 Multi-Function Laser Printer / Network Plotter (x = -14.0, z = -4.45)
  const printerGrp = new THREE.Group();
  printerGrp.position.set(-14.0, 1.085, -4.45);
  const prtBase = new THREE.Mesh(sharedGeoPool.box(0.76, 0.38, 0.54), materials.cracBody);
  prtBase.position.y = 0.19;
  const prtMidBin = new THREE.Mesh(sharedGeoPool.box(0.68, 0.1, 0.44), materials.darkSteelTrim);
  prtMidBin.position.set(0, 0.39, 0.05);
  const prtScanner = new THREE.Mesh(sharedGeoPool.box(0.76, 0.09, 0.52), materials.rackTrim);
  prtScanner.position.set(0, 0.485, 0);
  const prtAdf = new THREE.Mesh(sharedGeoPool.box(0.46, 0.06, 0.38), materials.darkSteelTrim);
  prtAdf.position.set(-0.1, 0.555, 0);
  // 2 Lower Paper Cassette Drawers (A3 / A4)
  for (const dy of [0.09, 0.21]) {
    const drawer = new THREE.Mesh(sharedGeoPool.box(0.62, 0.09, 0.03), materials.aluCladding);
    drawer.position.set(0, dy, 0.27);
    const dHandle = new THREE.Mesh(sharedGeoPool.box(0.24, 0.022, 0.02), materials.darkSteelTrim);
    dHandle.position.set(0, dy + 0.015, 0.285);
    printerGrp.add(drawer, dHandle);
  }
  // Tilted LCD Touchscreen Console + Printed Topology Sheet in Output Bin
  const prtLcd = new THREE.Mesh(sharedGeoPool.box(0.24, 0.12, 0.03), printerLcdMat);
  prtLcd.position.set(0.22, 0.47, 0.28);
  prtLcd.rotation.x = -0.55;
  const outSheet = new THREE.Mesh(sharedGeoPool.box(0.36, 0.01, 0.28), paperMat);
  outSheet.position.set(-0.06, 0.36, 0.24);
  outSheet.rotation.x = 0.1;
  // Network Cat6a & Power Cord from back of Printer straight to North Wall
  const prtCord = new THREE.Mesh(
    sharedGeoPool.cyl(0.012, 0.012, 0.22, 6),
    materials.cableCat6Blue
  );
  prtCord.rotation.x = Math.PI / 2;
  prtCord.position.set(-0.15, 0.14, -0.35);
  printerGrp.add(prtBase, prtMidBin, prtScanner, prtAdf, prtLcd, outSheet, prtCord);
  dcGroup.add(printerGrp);

  // Detailed Ring Binders with Spine Labels + Finger-Pull Rings & Horizontal Document Tray Stack
  const binderColors = [
    materials.pipeSupply,
    materials.fireRed,
    materials.rackBody,
    materials.fiberTray,
    materials.pipeSupply,
  ];
  binderColors.forEach((bMat, b) => {
    const bx = -12.65 + b * 0.095;
    const rb = new THREE.Mesh(sharedGeoPool.box(0.082, 0.33, 0.27), bMat);
    rb.position.set(bx, 1.25, -4.46);
    const spineLabel = new THREE.Mesh(sharedGeoPool.box(0.058, 0.14, 0.012), paperMat);
    spineLabel.position.set(bx, 1.31, -4.322);
    const ringHole = new THREE.Mesh(sharedGeoPool.cyl(0.014, 0.014, 0.014, 10), materials.chrome);
    ringHole.rotation.x = Math.PI / 2;
    ringHole.position.set(bx, 1.15, -4.322);
    dcGroup.add(rb, spineLabel, ringHole);
  });

  // 2-Tier Metal Document Tray with Stacked Files beside Binders
  const trayRack = new THREE.Mesh(sharedGeoPool.box(0.38, 0.16, 0.3), materials.rackTrim);
  trayRack.position.set(-11.82, 1.165, -4.44);
  const stackA = new THREE.Mesh(sharedGeoPool.box(0.32, 0.04, 0.24), paperMat);
  stackA.position.set(-11.82, 1.13, -4.42);
  const stackB = new THREE.Mesh(sharedGeoPool.box(0.31, 0.035, 0.23), materials.pipeSupply);
  stackB.position.set(-11.82, 1.22, -4.43);
  stackB.rotation.y = 0.05;
  const stackC = new THREE.Mesh(sharedGeoPool.box(0.3, 0.03, 0.22), paperMat);
  stackC.position.set(-11.82, 1.255, -4.43);
  dcGroup.add(trayRack, stackA, stackB, stackC);

  addCollider(colliders, -14.95, -11.25, -4.88, -4.05);

  nocLocker.userData.inspect = {
    category: 'NOC Arşiv & Donanım',
    name: 'NOC Yedek Parça ve Dokümantasyon Dolapları',
    specs: 'Yedek SFP+ Transceiverlar · Fiber Patch Kablolar · Acil Müdahale Kılavuzları',
  };
  inspectables.push(nocLocker);

  // 7. ROOM 3: Ana Sunucu Salonu (x: [-7..+9], z: [-13..+5])
  // 2 Cold Aisle Containment Pods oriented East-West so NOC looks straight down the aisles!
  const pods = [
    {
      name: 'Pod A',
      northZ: -9.6,
      aisleZ: -7.9,
      southZ: -6.2,
    },
    {
      name: 'Pod B',
      northZ: -2.6,
      aisleZ: -0.9,
      southZ: 0.8,
    },
  ];
  let swIdx = 1;
  let srvIdx = 1;
  let strIdx = 1;

  const coldAisleLightMat = materials.coldStrip;

  const savedCabMats = cabinetFactory.mats;
  cabinetFactory.mats = serverCabMats;
  const serverCabSpecs = [];

  pods.forEach((pod) => {
    // North Row (facing South into Cold Aisle): Switch at i=0, Servers at i=1..4, Storage at i=5
    for (let i = 0; i < 6; i++) {
      const rx = -3.0 + i * 1.05;
      const type = i === 0 ? 'switch' : i === 5 ? 'storage' : 'server';
      const code =
        type === 'switch'
          ? `NET-SW-0${swIdx++}`
          : type === 'storage'
          ? `STR-0${strIdx++}`
          : `SRV-${String(srvIdx++).padStart(2, '0')}`;

      serverCabSpecs.push({
        type,
        code,
        podName: pod.name,
        x: rx,
        y: 0.18,
        z: pod.northZ,
        rotY: 0,
        showLeftSide: i === 0,
        showRightSide: i === 5,
      });
    }
    addCollider(colliders, -3.55, 2.8, pod.northZ - 0.58, pod.northZ + 0.58);

    // South Row (facing North into Cold Aisle): Switch at i=0, Servers at i=1..4, Storage at i=5
    for (let i = 0; i < 6; i++) {
      const rx = -3.0 + i * 1.05;
      const type = i === 0 ? 'switch' : i === 5 ? 'storage' : 'server';
      const code =
        type === 'switch'
          ? `NET-SW-0${swIdx++}`
          : type === 'storage'
          ? `STR-0${strIdx++}`
          : `SRV-${String(srvIdx++).padStart(2, '0')}`;

      serverCabSpecs.push({
        type,
        code,
        podName: pod.name,
        x: rx,
        y: 0.18,
        z: pod.southZ,
        rotY: Math.PI,
        showLeftSide: i === 5, // rotated 180°, so local -X is East outer edge
        showRightSide: i === 0, // local +X is West outer edge
      });
    }
    addCollider(colliders, -3.55, 2.8, pod.southZ - 0.58, pod.southZ + 0.58);

    // Cold Aisle Containment Roof Canopy & LED Strips
    const canopyGlass = new THREE.Mesh(
      sharedGeoPool.box(6.35, 0.06, 2.25),
      materials.containmentGlass
    );
    canopyGlass.position.set(-0.375, 2.46, pod.aisleZ);
    dcGroup.add(canopyGlass);

    const aisleLight = new THREE.Mesh(
      sharedGeoPool.box(6.0, 0.04, 0.16),
      coldAisleLightMat
    );
    aisleLight.position.set(-0.375, 2.41, pod.aisleZ);
    dcGroup.add(aisleLight);

    // Automatic Containment Sliding Glass Doors at West (x=-3.55) & East (x=+2.8) ends
    createSlidingDoor({
      parent: dcGroup,
      doors,
      axis: 'z',
      centerX: -3.55,
      centerZ: pod.aisleZ,
      width: 2.15,
      height: 2.24,
      leafMat: materials.containmentGlass,
      frameMat: srvRackTrim,
    });
    createSlidingDoor({
      parent: dcGroup,
      doors,
      axis: 'z',
      centerX: 2.8,
      centerZ: pod.aisleZ,
      width: 2.15,
      height: 2.24,
      leafMat: materials.containmentGlass,
      frameMat: srvRackTrim,
    });

    // Overhead Fiber (Yellow) & Power (Steel) Ladder Trays aligned symmetrically with North (facingDir +1) & South (facingDir -1) rows
    const rowConfigs = [
      { rz: pod.northZ, facingDir: 1 },
      { rz: pod.southZ, facingDir: -1 },
    ];
    for (const { rz, facingDir } of rowConfigs) {
      const fiberZ = rz + facingDir * 0.26;
      const powerZ = rz - facingDir * 0.26;
      const trayCenterX = -0.375;
      const trayLen = 6.05;
      const cableLen = trayLen - 0.14;

      // Fiber Tray (side rails + base + closed end-caps)
      for (const sideZ of [-0.16, 0.16]) {
        const rail = new THREE.Mesh(sharedGeoPool.box(trayLen, 0.09, 0.03), srvFiberTray);
        rail.position.set(trayCenterX, 2.67, fiberZ + sideZ);
        dcGroup.add(rail);
      }
      for (const endX of [trayCenterX - trayLen / 2, trayCenterX + trayLen / 2]) {
        const fCap = new THREE.Mesh(sharedGeoPool.box(0.03, 0.09, 0.34), srvFiberTray);
        fCap.position.set(endX, 2.67, fiberZ);
        dcGroup.add(fCap);
      }
      const trayBase = new THREE.Mesh(sharedGeoPool.box(trayLen, 0.025, 0.34), srvFiberTray);
      trayBase.position.set(trayCenterX, 2.63, fiberZ);

      // Thick Yellow & Aqua Fiber Trunk Cables lying cleanly inside the fiber tray
      const trunkYellow = new THREE.Mesh(
        sharedGeoPool.cyl(0.03, 0.03, cableLen, 8),
        srvFiberYellow
      );
      trunkYellow.rotation.z = Math.PI / 2;
      trunkYellow.position.set(trayCenterX, 2.68, fiberZ - 0.06);

      const trunkAqua = new THREE.Mesh(
        sharedGeoPool.cyl(0.028, 0.028, cableLen, 8),
        srvFiberAqua
      );
      trunkAqua.rotation.z = Math.PI / 2;
      trunkAqua.position.set(trayCenterX, 2.68, fiberZ + 0.06);

      // Overhead Power Ladder Tray (side rails + base + closed end-caps) + Red/Blue Power Feeder Cables
      for (const sideZ of [-0.14, 0.14]) {
        const pRail = new THREE.Mesh(sharedGeoPool.box(trayLen, 0.08, 0.03), srvPowerTray);
        pRail.position.set(trayCenterX, 2.86, powerZ + sideZ);
        dcGroup.add(pRail);
      }
      for (const endX of [trayCenterX - trayLen / 2, trayCenterX + trayLen / 2]) {
        const pCap = new THREE.Mesh(sharedGeoPool.box(0.03, 0.08, 0.3), srvPowerTray);
        pCap.position.set(endX, 2.86, powerZ);
        dcGroup.add(pCap);
      }
      const powerTray = new THREE.Mesh(
        sharedGeoPool.box(trayLen, 0.025, 0.3),
        srvPowerTray
      );
      powerTray.position.set(trayCenterX, 2.83, powerZ);

      const powerCableA = new THREE.Mesh(
        sharedGeoPool.cyl(0.022, 0.022, cableLen, 8),
        srvCordRed
      );
      powerCableA.rotation.z = Math.PI / 2;
      powerCableA.position.set(trayCenterX, 2.86, powerZ - 0.05);

      const powerCableB = new THREE.Mesh(
        sharedGeoPool.cyl(0.022, 0.022, cableLen, 8),
        srvCordBlue
      );
      powerCableB.rotation.z = Math.PI / 2;
      powerCableB.position.set(trayCenterX, 2.86, powerZ + 0.05);

      // Steel threaded ceiling suspension rods anchored directly to tray side brackets
      for (const hx of [-2.85, -0.375, 2.15]) {
        const rodF = new THREE.Mesh(sharedGeoPool.cyl(0.014, 0.014, 2.55, 6), srvChrome);
        rodF.position.set(hx, 3.92, fiberZ);
        const rodP = new THREE.Mesh(sharedGeoPool.cyl(0.014, 0.014, 2.35, 6), srvChrome);
        rodP.position.set(hx, 4.02, powerZ);
        dcGroup.add(rodF, rodP);
      }

      dcGroup.add(trayBase, trunkYellow, trunkAqua, powerTray, powerCableA, powerCableB);
    }
  });

  // Build all 24 Server Hall cabinets using InstancedMesh batch while serverCabMats is active
  const serverBatch = cabinetFactory.createInstancedCabinetBatch(serverCabSpecs, {
    parent: dcGroup,
    inspectables,
    castUnitShadows: false,
  });

  // Edge & Core Network 3-Rack Cluster along South-East Wall of Server Hall (x = 8.15, facing West into room)
  const edgeCoreSpecs = [
    {
      code: 'BGP-EDGE-01',
      z: -0.1,
      showLeftSide: true,
      showRightSide: false,
      badgeLabel: 'BGP BORDER ROUTER',
      badgeAccent: '#38bdf8',
      inspectMeta: {
        category: 'İnternet Katmanı · Yönlendirme',
        name: 'BGP Border / Edge Router (BGP-EDGE-01)',
        specs: 'AS65100 Çift Homed BGP4 · ISP-A / ISP-B Otomatik Rota Seçimi & Anycast Anonsu',
      },
    },
    {
      code: 'FW-DDOS-01',
      z: 1.0,
      showLeftSide: false,
      showRightSide: false,
      badgeLabel: 'FIREWALL & DDOS',
      badgeAccent: '#f97316',
      inspectMeta: {
        category: 'İnternet Katmanı · Güvenlik',
        name: 'Firewall & DDoS Mitigation Kümesi (FW-DDOS-01)',
        specs: '1.2 Tbps L3–L7 DDoS Temizleme · SYN Flood / Botnet Engelleme · IPS/IDS',
      },
    },
    {
      code: 'CORE-SPINE-01',
      z: 2.1,
      showLeftSide: false,
      showRightSide: true,
      badgeLabel: '400G CORE SPINE',
      badgeAccent: '#22d3ee',
      inspectMeta: {
        category: 'İnternet Katmanı · Omurga',
        name: '400G Core Spine Switch (CORE-SPINE-01)',
        specs: 'Meet-Me (MMR-ODF-01) Trafiğini Tavan Fiber Köprüsü ile Pod Switchlerine İleten Ana Omurga',
      },
    },
  ];

  edgeCoreSpecs.forEach((spec) => {
    const netCab = cabinetFactory.createCabinet({
      type: 'switch',
      code: spec.code,
      podName: 'Core Network',
      showLeftSide: spec.showLeftSide,
      showRightSide: spec.showRightSide,
      inspectables,
      badgeLabel: spec.badgeLabel,
      badgeAccent: spec.badgeAccent,
      inspectMeta: spec.inspectMeta,
    });
    netCab.position.set(8.15, 0.18, spec.z);
    netCab.rotation.y = -Math.PI / 2;
    dcGroup.add(netCab);
    placedCabinets.push(netCab);
  });
  addCollider(colliders, 7.55, 8.75, -0.6, 2.6);

  // Overhead Fiber (x=7.89) & Power (x=8.41) Trays over Edge/Core Cluster -> linked to Server Hall Spine
  const coreFiberTrayNS = new THREE.Mesh(sharedGeoPool.box(0.36, 0.075, 3.1), srvFiberTray);
  coreFiberTrayNS.position.set(7.89, 2.66, 1.0);
  const coreFiberBridgeEW = new THREE.Mesh(sharedGeoPool.box(5.05, 0.075, 0.36), srvFiberTray);
  coreFiberBridgeEW.position.set(5.37, 2.66, 1.55);
  for (const [fx, fMat] of [
    [7.82, srvFiberYellow],
    [7.96, srvFiberAqua],
  ]) {
    const fcNS = new THREE.Mesh(sharedGeoPool.cyl(0.022, 0.022, 3.0, 8), fMat);
    fcNS.rotation.x = Math.PI / 2;
    fcNS.position.set(fx, 2.71, 1.0);
    dcGroup.add(fcNS);
  }
  for (const [fz, fMat] of [
    [1.48, srvFiberYellow],
    [1.62, srvFiberAqua],
  ]) {
    const fcEW = new THREE.Mesh(sharedGeoPool.cyl(0.022, 0.022, 4.95, 8), fMat);
    fcEW.rotation.z = Math.PI / 2;
    fcEW.position.set(5.37, 2.71, fz);
    dcGroup.add(fcEW);
  }

  const corePowerTrayNS = new THREE.Mesh(sharedGeoPool.box(0.34, 0.07, 3.1), srvPowerTray);
  corePowerTrayNS.position.set(8.41, 2.76, 1.0);
  const corePowerBridgeEW = new THREE.Mesh(sharedGeoPool.box(6.06, 0.07, 0.34), srvPowerTray);
  corePowerBridgeEW.position.set(5.38, 2.76, 0.0);
  for (const [px, pMat] of [
    [8.34, srvCordRed],
    [8.48, srvCordBlue],
  ]) {
    const pcNS = new THREE.Mesh(sharedGeoPool.cyl(0.02, 0.02, 3.0, 8), pMat);
    pcNS.rotation.x = Math.PI / 2;
    pcNS.position.set(px, 2.81, 1.0);
    dcGroup.add(pcNS);
  }
  for (const [pz, pMat] of [
    [-0.07, srvCordRed],
    [0.07, srvCordBlue],
  ]) {
    const pcEW = new THREE.Mesh(sharedGeoPool.cyl(0.02, 0.02, 5.95, 8), pMat);
    pcEW.rotation.z = Math.PI / 2;
    pcEW.position.set(5.38, 2.81, pz);
    dcGroup.add(pcEW);
  }

  for (const [rx, rz, ry] of [
    [7.89, -0.1, 2.7],
    [7.89, 2.1, 2.7],
    [5.37, 1.55, 2.7],
    [5.38, 0.0, 2.8],
  ]) {
    const rh = 5.18 - ry;
    const rod = new THREE.Mesh(sharedGeoPool.cyl(0.014, 0.014, rh, 6), srvChrome);
    rod.position.set(rx, ry + rh * 0.5, rz);
    dcGroup.add(rod);
  }
  dcGroup.add(coreFiberTrayNS, coreFiberBridgeEW, corePowerTrayNS, corePowerBridgeEW);

  cabinetFactory.mats = savedCabMats;

  // West Cross-Aisle Overhead Fiber Spine Bridge (x = -3.05 above Switch Cabinets) spanning Pod A north to Pod B south
  const bridgeLen = 10.2;
  const crossFiberTrayW = new THREE.Mesh(
    sharedGeoPool.box(0.38, 0.08, bridgeLen),
    srvFiberTray
  );
  crossFiberTrayW.position.set(-3.05, 2.66, -4.4);
  const crossAquaBundle = new THREE.Mesh(
    sharedGeoPool.cyl(0.032, 0.032, bridgeLen - 0.14, 8),
    srvFiberAqua
  );
  crossAquaBundle.rotation.x = Math.PI / 2;
  crossAquaBundle.position.set(-2.98, 2.71, -4.4);
  const crossYellowBundle = new THREE.Mesh(
    sharedGeoPool.cyl(0.032, 0.032, bridgeLen - 0.14, 8),
    srvFiberYellow
  );
  crossYellowBundle.rotation.x = Math.PI / 2;
  crossYellowBundle.position.set(-3.12, 2.71, -4.4);
  dcGroup.add(crossFiberTrayW, crossAquaBundle, crossYellowBundle);

  // East Cross-Aisle Fiber Bridge (x = +2.35 above Storage Cabinets) closing the overhead fiber loop
  const crossFiberTrayE = new THREE.Mesh(
    sharedGeoPool.box(0.34, 0.08, bridgeLen),
    srvFiberTray
  );
  crossFiberTrayE.position.set(2.35, 2.66, -4.4);
  const crossYellowEast = new THREE.Mesh(
    sharedGeoPool.cyl(0.028, 0.028, bridgeLen - 0.14, 8),
    srvFiberYellow
  );
  crossYellowEast.rotation.x = Math.PI / 2;
  crossYellowEast.position.set(2.35, 2.71, -4.4);
  dcGroup.add(crossFiberTrayE, crossYellowEast);

  // Fiber Trunk Spur running West from Switch Spine (x = -3.05) through firestop collar into NOC (x = -7.0)
  const nocSpurTray = new THREE.Mesh(sharedGeoPool.box(4.0, 0.08, 0.34), srvFiberTray);
  nocSpurTray.position.set(-5.05, 2.66, -4.7);
  const nocSpurCable = new THREE.Mesh(
    sharedGeoPool.cyl(0.032, 0.032, 3.9, 8),
    srvFiberAqua
  );
  nocSpurCable.rotation.z = Math.PI / 2;
  nocSpurCable.position.set(-5.05, 2.71, -4.7);
  const nocCollar = new THREE.Mesh(sharedGeoPool.box(0.32, 0.32, 0.56), materials.darkSteelTrim);
  nocCollar.position.set(-7.0, 2.68, -4.7);
  dcGroup.add(nocSpurTray, nocSpurCable, nocCollar);

  // 4 Perimeter CRAC / CRAH Cooling Units along North wall of Server Hall (z = -12.05)
  [-4.2, -1.2, 1.8, 4.8].forEach((cx, idx) => {
    const crac = createCracUnit(idx + 1, materials, inspectables, serverCracBodyMat);
    crac.position.set(cx, 0.18, -12.05);
    dcGroup.add(crac);
    if (crac.userData.panelMat) cracPanelMats.push(crac.userData.panelMat);
    addCollider(colliders, cx - 1.15, cx + 1.15, -12.6, -11.45);
  });

  // Server Hall inner wall liners (North, East, South) so Server Hall darkens cleanly without affecting NOC/Power/Staging
  const serverWallLiners = [
    { pos: [1.0, 2.68, -12.63], rotY: 0, w: 16.0, h: 5.0 },
    { pos: [8.87, 2.68, -9.0], rotY: -Math.PI / 2, w: 8.0, h: 5.0 },
    { pos: [8.87, 2.68, 1.1], rotY: -Math.PI / 2, w: 7.8, h: 5.0 },
    { pos: [8.87, 4.24, -3.9], rotY: -Math.PI / 2, w: 2.2, h: 1.88 },
    { pos: [-3.5, 2.68, 4.87], rotY: Math.PI, w: 7.0, h: 5.0 },
    { pos: [5.7, 2.68, 4.87], rotY: Math.PI, w: 6.6, h: 5.0 },
    { pos: [1.2, 4.24, 4.87], rotY: Math.PI, w: 2.4, h: 1.88 },
  ];
  serverWallLiners.forEach(({ pos, rotY, w, h }) => {
    const liner = new THREE.Mesh(sharedGeoPool.plane(w, h), serverInnerWallMat);
    liner.position.set(...pos);
    liner.rotation.y = rotY;
    liner.receiveShadow = true;
    dcGroup.add(liner);
  });

  // Meet-Me / Dual-ISP Underground Fiber Entry & Solid-Door Steel ODF Cabinet (MMR-ODF-01) at x = 6.65, z = -12.48
  const mmrGroup = new THREE.Group();
  mmrGroup.position.set(6.65, 0.18, -12.48);

  const mmrPlinth = new THREE.Mesh(sharedGeoPool.box(1.12, 0.1, 0.48), srvDarkSteel);
  mmrPlinth.position.y = 0.05;

  // Solid Powder-Coated Steel Cabinet Chassis
  const mmrShell = new THREE.Mesh(sharedGeoPool.box(1.06, 2.08, 0.42), srvRackBody);
  mmrShell.position.set(0, 1.14, -0.01);
  mmrShell.castShadow = true;
  mmrShell.receiveShadow = true;

  for (const sx of [-0.51, 0.51]) {
    const sideTrim = new THREE.Mesh(sharedGeoPool.box(0.045, 2.08, 0.45), srvDarkSteel);
    sideTrim.position.set(sx, 1.14, 0.0);
    sideTrim.castShadow = true;
    mmrGroup.add(sideTrim);
  }
  const mmrTop = new THREE.Mesh(sharedGeoPool.box(1.1, 0.08, 0.46), srvDarkSteel);
  mmrTop.position.set(0, 2.22, 0.0);

  // Top Header Sign & Cyan Optical Status Beacon Bar
  const odfHeaderSign = new THREE.Mesh(
    sharedGeoPool.plane(0.98, 0.16),
    new THREE.MeshBasicMaterial({
      map: createSignTexture('FİBER OMURGA PANOSU', 'MMR-ODF-01 · ISP-A + ISP-B', '#38bdf8'),
    })
  );
  odfHeaderSign.position.set(0, 2.22, 0.236);
  const odfBeacon = new THREE.Mesh(sharedGeoPool.box(0.86, 0.028, 0.025), materials.coldStrip);
  odfBeacon.position.set(0, 2.31, 0.19);

  // Solid Opaque Steel Front Door + Perimeter Frame + Exterior Placard
  const mmrDoorPanel = new THREE.Mesh(sharedGeoPool.box(0.94, 1.98, 0.024), srvRackTrim);
  mmrDoorPanel.position.set(0, 1.13, 0.2);

  const mmrFaceMat = new THREE.MeshStandardMaterial({
    map: createOdfPanelTexture(),
    roughness: 0.42,
    metalness: 0.25,
  });
  const mmrFace = new THREE.Mesh(sharedGeoPool.plane(0.92, 1.94), mmrFaceMat);
  mmrFace.position.set(0, 1.13, 0.214);

  for (const fx of [-0.475, 0.475]) {
    const stile = new THREE.Mesh(sharedGeoPool.box(0.035, 2.02, 0.028), srvDarkSteel);
    stile.position.set(fx, 1.13, 0.205);
    mmrGroup.add(stile);
  }
  for (const fy of [0.135, 2.125]) {
    const rail = new THREE.Mesh(sharedGeoPool.box(0.985, 0.035, 0.028), srvDarkSteel);
    rail.position.set(0, fy, 0.205);
    mmrGroup.add(rail);
  }

  // 3D Raised Steel Ventilation Louver Ribs on Lower Door
  for (let l = 0; l < 4; l++) {
    const louver = new THREE.Mesh(sharedGeoPool.box(0.76, 0.014, 0.012), srvDarkSteel);
    louver.position.set(0, 0.46 + l * 0.052, 0.216);
    mmrGroup.add(louver);
  }

  // Industrial 3-Point Chrome Swing Handle & Keyhole Escutcheon
  const odfEscutcheon = new THREE.Mesh(sharedGeoPool.box(0.044, 0.2, 0.014), srvDarkSteel);
  odfEscutcheon.position.set(0.43, 1.12, 0.218);
  const odfLatch = new THREE.Mesh(sharedGeoPool.box(0.026, 0.15, 0.026), srvChrome);
  odfLatch.position.set(0.43, 1.12, 0.228);
  mmrGroup.add(odfEscutcheon);

  // Top Fiber Chimney & Dual ISP-A (Yellow) / ISP-B (Aqua) Riser Conduits entering Overhead Tray
  const mmrChimney = new THREE.Mesh(sharedGeoPool.box(0.56, 0.12, 0.26), srvDarkSteel);
  mmrChimney.position.set(0, 2.3, 0);
  const mmrRiseA = new THREE.Mesh(sharedGeoPool.cyl(0.028, 0.028, 0.46, 8), srvFiberYellow);
  mmrRiseA.position.set(-0.1, 2.48, 0);
  const mmrRiseB = new THREE.Mesh(sharedGeoPool.cyl(0.028, 0.028, 0.46, 8), srvFiberAqua);
  mmrRiseB.position.set(0.1, 2.48, 0);

  // Rear underground wall-entry flange sleeves (aligned to North exterior wall conduits)
  for (const sx of [-0.22, 0.22]) {
    const sleeve = new THREE.Mesh(sharedGeoPool.cyl(0.055, 0.055, 0.16, 10), srvChrome);
    sleeve.rotation.x = Math.PI / 2;
    sleeve.position.set(sx, 0.42, -0.24);
    mmrGroup.add(sleeve);
  }

  // Dedicated invisible hit proxy for reliable clicking across the ODF cabinet front
  const mmrHitProxy = new THREE.Mesh(sharedGeoPool.box(1.08, 2.24, 0.48), materials.invisibleHitMat);
  mmrHitProxy.position.set(0, 1.14, 0);
  mmrHitProxy.userData.inspect = {
    category: 'Telekom & Meet-Me Girişi',
    name: 'MMR-ODF-01 Fiber Omurga Panosu',
    specs: 'ISP-A (Sarı OS2 · 144 Core) + ISP-B (Turkuaz · 144 Core) · Kilitli Çelik ODF Kapak · Yeraltı Menhol Girişi',
  };
  inspectables.push(mmrHitProxy);

  mmrGroup.add(
    mmrPlinth,
    mmrShell,
    mmrTop,
    odfHeaderSign,
    odfBeacon,
    mmrDoorPanel,
    mmrFace,
    odfLatch,
    mmrChimney,
    mmrRiseA,
    mmrRiseB,
    mmrHitProxy
  );
  dcGroup.add(mmrGroup);
  addCollider(colliders, 6.08, 7.22, -12.82, -12.2);

  // Overhead MMR Fiber Tray connecting MMR-ODF-01 (x=6.65, z=-12.48) -> Pod A North Fiber Tray (x=2.65, z=-9.34)
  const mmrTrayNS = new THREE.Mesh(sharedGeoPool.box(0.34, 0.075, 3.3), srvFiberTray);
  mmrTrayNS.position.set(6.65, 2.66, -10.91);
  const mmrTrayEW = new THREE.Mesh(sharedGeoPool.box(4.18, 0.075, 0.34), srvFiberTray);
  mmrTrayEW.position.set(4.65, 2.66, -9.34);
  for (const [ox, fMat] of [
    [6.58, srvFiberYellow],
    [6.72, srvFiberAqua],
  ]) {
    const cNS = new THREE.Mesh(sharedGeoPool.cyl(0.025, 0.025, 3.2, 8), fMat);
    cNS.rotation.x = Math.PI / 2;
    cNS.position.set(ox, 2.71, -10.91);
    dcGroup.add(cNS);
  }
  for (const [oz, fMat] of [
    [-9.4, srvFiberYellow],
    [-9.28, srvFiberAqua],
  ]) {
    const cEW = new THREE.Mesh(sharedGeoPool.cyl(0.025, 0.025, 4.05, 8), fMat);
    cEW.rotation.z = Math.PI / 2;
    cEW.position.set(4.65, 2.71, oz);
    dcGroup.add(cEW);
  }
  // Threaded ceiling suspension rods anchoring the MMR overhead fiber tray to ceiling (y = 5.18)
  for (const [rx, rz] of [
    [6.65, -10.9],
    [6.65, -9.34],
    [4.1, -9.34],
  ]) {
    const rh = 5.18 - 2.68;
    const rod = new THREE.Mesh(sharedGeoPool.cyl(0.014, 0.014, rh, 6), srvChrome);
    rod.position.set(rx, 2.68 + rh * 0.5, rz);
    dcGroup.add(rod);
  }
  dcGroup.add(mmrTrayNS, mmrTrayEW);

  // Complete FM-200 / Novec 1230 Clean Agent Fire Suppression Battery & Ceiling Manifold
  const fireGroup = new THREE.Group();
  fireGroup.position.set(8.05, 0.18, -11.15);

  // Hazard yellow-black floor pad
  const hazardPad = new THREE.Mesh(
    sharedGeoPool.box(1.15, 0.03, 2.45),
    new THREE.MeshStandardMaterial({ map: createHazardStripeTexture(), roughness: 0.75 })
  );
  hazardPad.position.set(0, 0.015, 0);
  fireGroup.add(hazardPad);

  // Heavy steel wall-braced cylinder retention frame & clamping straps
  const rackBackL = new THREE.Mesh(sharedGeoPool.box(0.08, 1.95, 0.08), srvDarkSteel);
  rackBackL.position.set(0.36, 0.98, -0.95);
  const rackBackR = new THREE.Mesh(sharedGeoPool.box(0.08, 1.95, 0.08), srvDarkSteel);
  rackBackR.position.set(0.36, 0.98, 0.95);
  const clampBar = new THREE.Mesh(sharedGeoPool.box(0.58, 0.08, 2.05), srvDarkSteel);
  clampBar.position.set(0.05, 1.15, 0);
  const headerBar = new THREE.Mesh(sharedGeoPool.box(0.14, 0.12, 2.05), srvDarkSteel);
  headerBar.position.set(0.28, 1.92, 0);
  fireGroup.add(rackBackL, rackBackR, clampBar, headerBar);

  const cylLabelMat = new THREE.MeshStandardMaterial({
    map: createFireCylinderLabelTexture(),
    roughness: 0.35,
    metalness: 0.32,
  });
  const srvCylLabelMat = cloneForServerDim(cylLabelMat, 0.04);
  const brassMat = materials.brassValve;
  const srvBrass = cloneForServerDim(brassMat, 0.05);

  // 3 Detailed FM-200 Cylinders with Domed Shoulders, Brass Valves, Gauges & Discharge Hoses
  for (let i = 0; i < 3; i++) {
    const cz = -0.68 + i * 0.68;
    const cylBody = new THREE.Mesh(sharedGeoPool.cyl(0.22, 0.22, 1.38, 18), srvCylLabelMat);
    cylBody.position.set(0, 0.71, cz);
    cylBody.rotation.y = -Math.PI / 2;
    cylBody.castShadow = true;

    const dome = new THREE.Mesh(
      sharedGeoPool.sphere(0.22, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      srvFireRed
    );
    dome.position.set(0, 1.4, cz);

    const valve = new THREE.Mesh(sharedGeoPool.cyl(0.055, 0.075, 0.22, 12), srvBrass);
    valve.position.set(0, 1.68, cz);

    const gauge = new THREE.Mesh(sharedGeoPool.cyl(0.045, 0.045, 0.03, 12), srvChrome);
    gauge.rotation.z = Math.PI / 2;
    gauge.position.set(-0.07, 1.7, cz);

    // Flexible black discharge hose curving up into the red collector manifold
    const hoseCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.76, cz),
      new THREE.Vector3(0.12, 1.92, cz),
      new THREE.Vector3(0.24, 1.98, cz),
    ]);
    const hose = new THREE.Mesh(
      new THREE.TubeGeometry(hoseCurve, 8, 0.025, 8, false),
      srvDarkSteel
    );

    fireGroup.add(cylBody, dome, valve, gauge, hose);

    if (i === 0) {
      cylBody.userData.inspect = {
        category: 'Yangın Söndürme Sistemi',
        name: 'FM-200 / Novec 1230 Gazlı Söndürme Bataryası',
        specs: '3× 120L 42 Bar Silindir · VESDA Erken Algılama · 10 Sn Otomatik Boşaltma',
      };
      inspectables.push(cylBody);
    }
  }

  // Horizontal Red Collector Manifold + Vertical Riser up to Ceiling Distribution Piping
  const collector = new THREE.Mesh(
    sharedGeoPool.cyl(0.055, 0.055, 1.85, 12),
    srvFireRed
  );
  collector.rotation.x = Math.PI / 2;
  collector.position.set(0.25, 2.0, 0);

  const fireRiser = new THREE.Mesh(
    sharedGeoPool.cyl(0.05, 0.05, 2.38, 12),
    srvFireRed
  );
  fireRiser.position.set(0.25, 3.16, 0.88);
  fireGroup.add(collector, fireRiser);

  // Wall-mounted Fire Suppression Control Panel next to Cylinders
  const firePanel = new THREE.Mesh(
    sharedGeoPool.box(0.14, 0.68, 0.54),
    new THREE.MeshStandardMaterial({ map: createFireControlPanelTexture(), roughness: 0.4 })
  );
  firePanel.position.set(0.76, 1.48, 1.55);
  firePanel.userData.inspect = {
    category: 'Yangın Kontrol Paneli',
    name: 'VESDA & FM-200 Otomatik Söndürme Paneli',
    specs: 'Çift Çapraz Bölge Algılama · 30 Sn Ön İkaz · Manuel Boşaltma Kilidi Hazır',
  };
  inspectables.push(firePanel);
  fireGroup.add(firePanel);

  dcGroup.add(fireGroup);
  addCollider(colliders, 7.4, 8.65, -12.4, -9.85);

  // Ceiling Fire-Suppression Distribution Pipe & Brass Nozzles spanning over Server Hall
  const fireCeilingMain = new THREE.Mesh(
    sharedGeoPool.cyl(0.042, 0.042, 10.6, 10),
    srvFireRed
  );
  fireCeilingMain.rotation.x = Math.PI / 2;
  fireCeilingMain.position.set(8.3, 4.5, -5.0);
  dcGroup.add(fireCeilingMain);

  for (const nz of [-7.9, -0.9]) {
    const branch = new THREE.Mesh(
      sharedGeoPool.cyl(0.032, 0.032, 11.4, 10),
      srvFireRed
    );
    branch.rotation.z = Math.PI / 2;
    branch.position.set(2.6, 4.5, nz);
    dcGroup.add(branch);

    for (const nx of [-2.0, 2.5]) {
      const nozzle = new THREE.Mesh(sharedGeoPool.cone(0.06, 0.14, 10), srvBrass);
      nozzle.rotation.x = Math.PI;
      nozzle.position.set(nx, 4.38, nz);
      dcGroup.add(nozzle);
    }
  }

  const hazardMat = new THREE.MeshStandardMaterial({ map: createHazardStripeTexture(), roughness: 0.78 });
  const darkCableMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.65, metalness: 0.12 });

  // 8. ROOM 4: Güvenlik & Staging Holü (x: [-5..+9], z: [+5..+13])
  const stgFloorStripMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.65 });
  const stgAisleMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.65 });
  const esdMatSurface = new THREE.MeshStandardMaterial({ color: 0x0f3b5c, roughness: 0.72, metalness: 0.08 });
  const benchTopMat = new THREE.MeshStandardMaterial({ color: 0x263142, roughness: 0.52, metalness: 0.35 });
  const orangeRackMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.45, metalness: 0.35 });

  // Floor Safety Walk-Corridor Striping (Security [-4.4..+2.35] & Staging [2.75..8.6], clear of dividing wall x=2.55)
  for (const [sx, sz, sw, sd, mat] of [
    [-1.025, 8.15, 6.75, 0.07, stgFloorStripMat],
    [-1.025, 10.05, 6.75, 0.07, stgFloorStripMat],
    [1.2, 6.65, 2.2, 0.06, stgAisleMat],
    [5.675, 8.15, 5.85, 0.07, stgFloorStripMat],
    [5.675, 10.05, 5.85, 0.07, stgFloorStripMat],
  ]) {
    const strip = new THREE.Mesh(sharedGeoPool.box(sw, 0.012, sd), mat);
    strip.position.set(sx, 0.187, sz);
    dcGroup.add(strip);
  }

  // A) Biometric Mantrap Security Gate Columns & Overhead Sensor Arch inside West Entry (x = -4.25, z = 7.72 & 10.48)
  for (const pz of [7.72, 10.48]) {
    const col = new THREE.Group();
    col.position.set(-4.25, 0.18, pz);
    const base = new THREE.Mesh(sharedGeoPool.box(0.38, 0.08, 0.38), materials.darkSteelTrim);
    base.position.y = 0.04;
    const pillar = new THREE.Mesh(sharedGeoPool.box(0.24, 2.22, 0.24), materials.chrome);
    pillar.position.y = 1.15;
    pillar.castShadow = true;
    const scannerHead = new THREE.Mesh(sharedGeoPool.box(0.26, 0.28, 0.14), materials.darkSteelTrim);
    scannerHead.position.set(0.14, 1.24, pz < 9 ? 0.12 : -0.12);
    const scanGlow = new THREE.Mesh(sharedGeoPool.box(0.03, 0.18, 0.1), materials.coldStrip);
    scanGlow.position.set(0.27, 1.24, pz < 9 ? 0.12 : -0.12);
    const topLed = new THREE.Mesh(sharedGeoPool.box(0.26, 0.05, 0.26), materials.greenLed);
    topLed.position.y = 2.28;
    col.add(base, pillar, scannerHead, scanGlow, topLed);
    dcGroup.add(col);
  }
  const mantrapArch = new THREE.Mesh(sharedGeoPool.box(0.32, 0.2, 3.04), materials.darkSteelTrim);
  mantrapArch.position.set(-4.25, 2.54, 9.1);
  const mantrapBadge = new THREE.Mesh(
    sharedGeoPool.plane(2.1, 0.34),
    new THREE.MeshBasicMaterial({ map: createSignTexture('BİYOMETRİK MANTRAP', 'KART + İRİS DOĞRULAMA', '#f59e0b') })
  );
  mantrapBadge.rotation.y = Math.PI / 2;
  mantrapBadge.position.set(-4.08, 2.54, 9.1);
  dcGroup.add(mantrapArch, mantrapBadge);
  addCollider(colliders, -4.5, -4.0, 7.45, 7.98);
  addCollider(colliders, -4.5, -4.0, 10.22, 10.75);

  // B) X-Ray Equipment & Bag Security Scanner (North-West corner: x = -2.2, z = 6.25)
  const xray = new THREE.Group();
  xray.position.set(-2.2, 0.18, 6.25);

  // 1) Leveling feet & recessed steel plinth
  for (const fx of [-0.9, 0.9]) {
    for (const fz of [-0.32, 0.32]) {
      const foot = new THREE.Mesh(sharedGeoPool.cyl(0.035, 0.042, 0.05, 8), materials.chrome);
      foot.position.set(fx, 0.025, fz);
      xray.add(foot);
    }
  }
  const xPlinth = new THREE.Mesh(sharedGeoPool.box(2.02, 0.06, 0.74), materials.rackBody);
  xPlinth.position.y = 0.08;
  xray.add(xPlinth);

  // 2) Lower industrial pedestal cabinet with dual recessed service doors & latches
  const xBase = new THREE.Mesh(sharedGeoPool.box(1.96, 0.56, 0.78), materials.cracBody);
  xBase.position.y = 0.39;
  xBase.castShadow = true;
  xBase.receiveShadow = true;
  xray.add(xBase);

  for (const px of [-0.5, 0.5]) {
    const svcDoor = new THREE.Mesh(sharedGeoPool.box(0.72, 0.42, 0.025), materials.aluCladding);
    svcDoor.position.set(px, 0.39, 0.392);
    const doorBorder = new THREE.Mesh(sharedGeoPool.box(0.76, 0.46, 0.015), materials.darkSteelTrim);
    doorBorder.position.set(px, 0.39, 0.386);
    const latch = new THREE.Mesh(sharedGeoPool.box(0.03, 0.08, 0.02), materials.chrome);
    latch.position.set(px > 0 ? px - 0.28 : px + 0.28, 0.41, 0.408);
    xray.add(doorBorder, svcDoor, latch);
  }
  const xCenterSeam = new THREE.Mesh(sharedGeoPool.box(0.14, 0.46, 0.024), materials.darkSteelTrim);
  xCenterSeam.position.set(0, 0.39, 0.39);
  xray.add(xCenterSeam);

  // 3) Conveyor bed, dark rubber belt, stainless guide rails, belt ribs & gravity end rollers
  const xBed = new THREE.Mesh(sharedGeoPool.box(2.38, 0.075, 0.72), materials.darkSteelTrim);
  xBed.position.y = 0.708;
  xBed.castShadow = true;
  const xBelt = new THREE.Mesh(sharedGeoPool.box(2.32, 0.024, 0.6), materials.rackBody);
  xBelt.position.y = 0.757;
  xray.add(xBed, xBelt);

  for (const rz of [-0.33, 0.33]) {
    const rail = new THREE.Mesh(sharedGeoPool.box(2.36, 0.055, 0.024), materials.chrome);
    rail.position.set(0, 0.765, rz);
    xray.add(rail);
  }
  for (const rx of [-1.04, -0.9, -0.76, -0.62, 0.62, 0.76, 0.9, 1.04]) {
    const rib = new THREE.Mesh(sharedGeoPool.box(0.018, 0.01, 0.58), materials.rackTrim);
    rib.position.set(rx, 0.772, 0);
    xray.add(rib);
  }
  for (const ex of [-1.18, 1.18]) {
    const roller = new THREE.Mesh(sharedGeoPool.cyl(0.022, 0.022, 0.62, 10), materials.chrome);
    roller.rotation.x = Math.PI / 2;
    roller.position.set(ex, 0.742, 0);
    const bumper = new THREE.Mesh(sharedGeoPool.box(0.035, 0.085, 0.68), materials.aluCladding);
    bumper.position.set(ex > 0 ? 1.205 : -1.205, 0.71, 0);
    xray.add(roller, bumper);
  }

  // Scanned rugged equipment case exiting onto right belt
  const scanCase = new THREE.Mesh(sharedGeoPool.box(0.36, 0.16, 0.28), materials.rackBody);
  scanCase.position.set(0.84, 0.85, 0.02);
  scanCase.castShadow = true;
  const scanCaseLid = new THREE.Mesh(sharedGeoPool.box(0.37, 0.022, 0.29), materials.darkSteelTrim);
  scanCaseLid.position.set(0.84, 0.92, 0.02);
  const scanTag = new THREE.Mesh(sharedGeoPool.box(0.08, 0.035, 0.012), materials.greenLed);
  scanTag.position.set(0.84, 0.855, 0.162);
  xray.add(scanCase, scanCaseLid, scanTag);
  for (const lx of [0.74, 0.94]) {
    const caseLatch = new THREE.Mesh(sharedGeoPool.box(0.024, 0.045, 0.015), materials.chrome);
    caseLatch.position.set(lx, 0.895, 0.164);
    xray.add(caseLatch);
  }

  // 4) Lead-shielded X-Ray tunnel hood + dark cavity core + crisp framed portals (no stretched stripes)
  const xCavity = new THREE.Mesh(sharedGeoPool.box(0.98, 0.68, 0.66), materials.rackBody);
  xCavity.position.y = 1.11;
  const xTunnel = new THREE.Mesh(sharedGeoPool.box(0.96, 0.72, 0.8), materials.cracBody);
  xTunnel.position.y = 1.13;
  xTunnel.castShadow = true;
  const xTunnelTopCap = new THREE.Mesh(sharedGeoPool.box(0.88, 0.055, 0.74), materials.darkSteelTrim);
  xTunnelTopCap.position.y = 1.515;
  const xTunnelBand = new THREE.Mesh(sharedGeoPool.box(0.98, 0.11, 0.82), materials.darkSteelTrim);
  xTunnelBand.position.y = 1.44;
  const xPowerGland = new THREE.Mesh(sharedGeoPool.cyl(0.045, 0.055, 0.05, 10), materials.chrome);
  xPowerGland.position.set(0, 1.56, 0);
  xray.add(xCavity, xTunnel, xTunnelTopCap, xTunnelBand, xPowerGland);

  // Entry & exit portal collars + segmented hanging lead-rubber curtain strips
  for (const sx of [-1, 1]) {
    const px = sx * 0.485;
    const lintel = new THREE.Mesh(sharedGeoPool.box(0.06, 0.075, 0.72), materials.darkSteelTrim);
    lintel.position.set(px, 1.435, 0);
    const accentTop = new THREE.Mesh(sharedGeoPool.box(0.018, 0.022, 0.7), materials.generatorYellow);
    accentTop.position.set(sx * 0.51, 1.44, 0);
    xray.add(lintel, accentTop);

    for (const sz of [-0.325, 0.325]) {
      const jamb = new THREE.Mesh(sharedGeoPool.box(0.06, 0.68, 0.07), materials.darkSteelTrim);
      jamb.position.set(px, 1.1, sz);
      const accentSide = new THREE.Mesh(sharedGeoPool.box(0.018, 0.64, 0.018), materials.generatorYellow);
      accentSide.position.set(sx * 0.51, 1.1, sz > 0 ? 0.345 : -0.345);
      xray.add(jamb, accentSide);
    }

    for (const cz of [-0.24, -0.144, -0.048, 0.048, 0.144, 0.24]) {
      const strip = new THREE.Mesh(sharedGeoPool.box(0.016, 0.58, 0.082), darkCableMat);
      strip.position.set(sx * 0.455, 1.09, cz);
      xray.add(strip);
    }
  }

  // 5) Front operator control fascia: X-RAY sign plaque, status LEDs, Emergency Stop & top beacon
  const xCtrlPanel = new THREE.Mesh(sharedGeoPool.box(0.76, 0.14, 0.03), materials.darkSteelTrim);
  xCtrlPanel.position.set(0, 1.32, 0.405);
  const xPlaque = new THREE.Mesh(
    sharedGeoPool.plane(0.44, 0.11),
    new THREE.MeshBasicMaterial({ map: createSignTexture('X-RAY TARAMA', '140 kV · ÇİFT ENERJİ', '#facc15') })
  );
  xPlaque.position.set(-0.13, 1.32, 0.423);
  const eStopCollar = new THREE.Mesh(sharedGeoPool.cyl(0.026, 0.028, 0.015, 10), materials.generatorYellow);
  eStopCollar.rotation.x = Math.PI / 2;
  eStopCollar.position.set(0.28, 1.32, 0.425);
  const eStopBtn = new THREE.Mesh(sharedGeoPool.cyl(0.018, 0.018, 0.024, 10), materials.fireRed);
  eStopBtn.rotation.x = Math.PI / 2;
  eStopBtn.position.set(0.28, 1.32, 0.44);
  const ledReady = new THREE.Mesh(sharedGeoPool.box(0.022, 0.022, 0.014), materials.greenLed);
  ledReady.position.set(0.17, 1.34, 0.422);
  const ledXray = new THREE.Mesh(sharedGeoPool.box(0.022, 0.022, 0.014), materials.generatorYellow);
  ledXray.position.set(0.17, 1.298, 0.422);

  const beaconMast = new THREE.Mesh(sharedGeoPool.cyl(0.022, 0.028, 0.08, 8), materials.darkSteelTrim);
  beaconMast.position.set(-0.34, 1.58, 0.24);
  const beaconDome = new THREE.Mesh(sharedGeoPool.cyl(0.022, 0.022, 0.06, 10), materials.greenLed);
  beaconDome.position.set(-0.34, 1.65, 0.24);
  xray.add(xCtrlPanel, xPlaque, eStopCollar, eStopBtn, ledReady, ledXray, beaconMast, beaconDome);

  // 6) Articulated Dual-Energy X-Ray inspection monitor (distinct screen plane on dark bezel)
  const xMonStand = new THREE.Mesh(sharedGeoPool.cyl(0.028, 0.038, 0.36, 10), materials.chrome);
  xMonStand.position.set(0.06, 1.71, 0.24);
  const xMonKnuckle = new THREE.Mesh(sharedGeoPool.box(0.08, 0.06, 0.07), materials.darkSteelTrim);
  xMonKnuckle.position.set(0.06, 1.88, 0.25);

  const xMonPivot = new THREE.Group();
  xMonPivot.position.set(0.06, 1.94, 0.28);
  xMonPivot.rotation.set(-0.08, 0.14, 0);
  const xMonBezel = new THREE.Mesh(sharedGeoPool.box(0.62, 0.39, 0.036), materials.darkSteelTrim);
  const xMonTex = createXrayScanTexture();
  const xMonScreen = new THREE.Mesh(
    sharedGeoPool.plane(0.57, 0.345),
    new THREE.MeshStandardMaterial({
      map: xMonTex,
      emissiveMap: xMonTex,
      emissive: 0xffffff,
      emissiveIntensity: 0.9,
      roughness: 0.28,
    })
  );
  xMonScreen.position.z = 0.02;
  xMonPivot.add(xMonBezel, xMonScreen);
  xray.add(xMonStand, xMonKnuckle, xMonPivot);

  xTunnel.userData.inspect = {
    category: 'Fiziksel Güvenlik Tarama',
    name: 'X-Ray Donanım & Çanta Tarayıcı',
    specs: '140 kV Çift Enerjili · Sunucu Salonu Öncesi Donanım & Taşıma Güvenliği',
  };
  inspectables.push(xTunnel);
  dcGroup.add(xray);
  addCollider(colliders, -3.45, -0.95, 5.75, 6.75);

  // C) Security Guard Monitoring Desk (x = -1.95, z = 11.05, facing North -Z into room) + PPE Locker
  const secDesk = new THREE.Group();
  secDesk.position.set(-1.95, 0.18, 11.05);
  secDesk.rotation.y = Math.PI;
  const sTop = new THREE.Mesh(sharedGeoPool.box(2.05, 0.06, 0.92), benchTopMat);
  sTop.position.y = 0.76;
  sTop.castShadow = true;
  for (const lx of [-0.94, 0.94]) {
    const leg = new THREE.Mesh(sharedGeoPool.box(0.08, 0.74, 0.84), materials.darkSteelTrim);
    leg.position.set(lx, 0.37, 0);
    secDesk.add(leg);
  }
  const secMonTex = createSecurityControlTexture();
  const secMonMat = new THREE.MeshStandardMaterial({
    map: secMonTex,
    emissiveMap: secMonTex,
    emissive: 0xffffff,
    emissiveIntensity: 0.85,
    roughness: 0.35,
  });
  for (const mx of [-0.42, 0.38]) {
    const post = new THREE.Mesh(sharedGeoPool.cyl(0.02, 0.025, 0.28, 8), materials.chrome);
    post.position.set(mx, 0.92, 0.2);
    const frame = new THREE.Mesh(sharedGeoPool.box(0.68, 0.42, 0.04), materials.rackBody);
    frame.position.set(mx, 1.12, 0.18);
    const screen = new THREE.Mesh(sharedGeoPool.plane(0.63, 0.37), secMonMat);
    screen.rotation.y = Math.PI;
    screen.position.set(mx, 1.12, 0.156);
    secDesk.add(post, frame, screen);
  }
  // RFID Card Encoder Pad + Keyboard (left in facing North = +X) & Mouse (right = -X)
  const rfidPad = new THREE.Mesh(sharedGeoPool.box(0.16, 0.04, 0.22), materials.darkSteelTrim);
  rfidPad.position.set(-0.78, 0.81, -0.15);
  const rfidGlow = new THREE.Mesh(sharedGeoPool.box(0.1, 0.01, 0.14), materials.coldStrip);
  rfidGlow.position.set(-0.78, 0.835, -0.15);
  const secKb = new THREE.Mesh(
    sharedGeoPool.box(0.42, 0.02, 0.15),
    new THREE.MeshStandardMaterial({ map: createKeyboardTexture(), roughness: 0.5 })
  );
  secKb.rotation.y = Math.PI;
  secKb.position.set(0.12, 0.8, -0.18);
  const secMouse = new THREE.Mesh(sharedGeoPool.box(0.06, 0.025, 0.1), materials.rackBody);
  secMouse.position.set(-0.22, 0.8, -0.18);
  // Security Guard Ergonomic Chair (matching NOC 5-Star Mesh Task Chair)
  const secChair = createErgonomicTaskChair(materials, meshSeatMat);
  secChair.position.set(0, 0, -0.82);
  secChair.rotation.y = Math.PI / 2 - 0.08;
  secDesk.add(sTop, rfidPad, rfidGlow, secKb, secMouse, secChair);
  // Wall CCTV & Access Control Screen above Security Desk
  const wallSecFrame = new THREE.Mesh(sharedGeoPool.box(1.78, 1.08, 0.1), materials.darkSteelTrim);
  wallSecFrame.position.set(-1.95, 2.08, 12.56);
  const wallSecScreen = new THREE.Mesh(sharedGeoPool.plane(1.68, 0.98), secMonMat);
  wallSecScreen.rotation.y = Math.PI;
  wallSecScreen.position.set(-1.95, 2.08, 12.5);
  // Power (z_world=11.61 -> z_local=-0.04) & Data/Fiber conduit connecting Security Desk to overhead trays
  const secRiserConduit = new THREE.Mesh(sharedGeoPool.cyl(0.028, 0.028, 2.02, 8), materials.chrome);
  secRiserConduit.position.set(-0.96, 1.78, -0.04);
  secDesk.add(secRiserConduit);
  dcGroup.add(secDesk, wallSecFrame, wallSecScreen);
  addCollider(colliders, -3.05, -0.85, 10.45, 12.15);

  // PPE / Anti-Static Coat & Access Locker inside Security Room (x = 0.35, z = 11.8) before entering Server Hall / Staging
  const ppeLocker = new THREE.Mesh(
    sharedGeoPool.box(0.92, 1.98, 0.62),
    new THREE.MeshStandardMaterial({ map: createSafetyLockerTexture(), roughness: 0.45 })
  );
  ppeLocker.position.set(0.35, 1.17, 11.8);
  ppeLocker.rotation.y = Math.PI;
  ppeLocker.castShadow = true;
  dcGroup.add(ppeLocker);
  addCollider(colliders, -0.17, 0.87, 11.4, 12.2);

  // D) Detailed ESD Hardware Burn-In & Staging Workbench (shifted to x = 4.55 inside Staging Room)
  const bench = new THREE.Group();
  bench.position.set(4.55, 0.18, 11.45);
  // Tubular Steel Frame + Under-Bench Shelf + 3-Drawer ESD Tool Cabinet
  const bTop = new THREE.Mesh(sharedGeoPool.box(3.1, 0.07, 1.12), benchTopMat);
  bTop.position.y = 0.9;
  bTop.castShadow = true;
  const esdMat = new THREE.Mesh(sharedGeoPool.box(2.76, 0.015, 0.88), esdMatSurface);
  esdMat.position.set(0, 0.942, -0.04);
  for (const lx of [-1.46, 1.46]) {
    for (const lz of [-0.48, 0.48]) {
      const bLeg = new THREE.Mesh(sharedGeoPool.box(0.07, 0.88, 0.07), materials.darkSteelTrim);
      bLeg.position.set(lx, 0.44, lz);
      bLeg.castShadow = true;
      bench.add(bLeg);
    }
  }
  const lowerShelf = new THREE.Mesh(sharedGeoPool.box(2.86, 0.04, 0.92), materials.rackTrim);
  lowerShelf.position.set(0, 0.24, 0);
  const underBoxMat = new THREE.MeshStandardMaterial({
    map: createLogisticsBoxTexture('SUNUCU YEDEK', 'TEST KİTİ'),
    roughness: 0.65,
  });
  for (const bx of [-0.85, -0.15]) {
    const uBox = new THREE.Mesh(sharedGeoPool.box(0.54, 0.28, 0.56), underBoxMat);
    uBox.position.set(bx, 0.4, 0);
    bench.add(uBox);
  }
  const toolDrawers = new THREE.Mesh(
    sharedGeoPool.box(0.68, 0.62, 0.86),
    new THREE.MeshStandardMaterial({ map: createFileCabinetTexture(), roughness: 0.45 })
  );
  toolDrawers.rotation.y = Math.PI;
  toolDrawers.position.set(1.02, 0.56, 0);

  // Overhead Technical Riser Bridge + Top Shelf + 8-Socket AC PDU Strip + LED Task Light
  for (const px of [-1.38, 1.38]) {
    const post = new THREE.Mesh(sharedGeoPool.box(0.06, 0.96, 0.06), materials.darkSteelTrim);
    post.position.set(px, 1.41, 0.44);
    bench.add(post);
  }
  const riserShelf = new THREE.Mesh(sharedGeoPool.box(2.88, 0.05, 0.42), materials.darkSteelTrim);
  riserShelf.position.set(0, 1.86, 0.28);
  const benchLedLight = new THREE.Mesh(sharedGeoPool.box(2.4, 0.03, 0.08), materials.coldStrip);
  benchLedLight.position.set(0, 1.82, 0.14);
  const benchPduBar = new THREE.Mesh(sharedGeoPool.box(2.5, 0.07, 0.08), materials.rackBody);
  benchPduBar.position.set(0, 1.18, 0.46);
  for (let ox = -1.0; ox <= 1.0; ox += 0.28) {
    const socket = new THREE.Mesh(sharedGeoPool.box(0.05, 0.04, 0.02), materials.fireRed);
    socket.position.set(ox, 1.18, 0.415);
    bench.add(socket);
  }

  // KVM Test Monitor (showing Burn-In Screen) + Keyboard (left = +X facing North) & Mouse (right = -X)
  const kvmStand = new THREE.Mesh(sharedGeoPool.cyl(0.024, 0.03, 0.34, 8), materials.chrome);
  kvmStand.position.set(-0.78, 1.1, 0.24);
  const kvmFrame = new THREE.Mesh(sharedGeoPool.box(0.76, 0.46, 0.045), materials.rackBody);
  kvmFrame.position.set(-0.78, 1.34, 0.22);
  const kvmTex = createStagingScreenTexture();
  const kvmScreen = new THREE.Mesh(
    sharedGeoPool.plane(0.7, 0.41),
    new THREE.MeshStandardMaterial({
      map: kvmTex,
      emissiveMap: kvmTex,
      emissive: 0xffffff,
      emissiveIntensity: 0.88,
      roughness: 0.3,
    })
  );
  kvmScreen.rotation.y = Math.PI;
  kvmScreen.position.set(-0.78, 1.34, 0.195);
  const testKb = new THREE.Mesh(
    sharedGeoPool.box(0.44, 0.02, 0.16),
    new THREE.MeshStandardMaterial({ map: createKeyboardTexture(), roughness: 0.5 })
  );
  testKb.rotation.y = Math.PI;
  testKb.position.set(-0.62, 0.96, -0.18);
  const testMouse = new THREE.Mesh(sharedGeoPool.box(0.065, 0.025, 0.11), materials.rackBody);
  testMouse.position.set(-0.98, 0.96, -0.18);
  const esdGroundBox = new THREE.Mesh(sharedGeoPool.box(0.14, 0.05, 0.12), materials.coldStrip);
  esdGroundBox.position.set(-1.24, 0.975, -0.32);

  // 2 Rackmount Servers / Switches under Burn-In Test on the right side of the ESD Mat (+X)
  for (const [sx, sy, sh, colMat] of [
    [0.52, 0.995, 0.09, cabinetFactory.mats.srv2U],
    [0.52, 1.075, 0.06, cabinetFactory.mats.switch1U],
  ]) {
    const dut = new THREE.Mesh(sharedGeoPool.box(0.74, sh, 0.52), colMat);
    dut.position.set(sx, sy, 0.02);
    dut.castShadow = true;
    const ledStrip = new THREE.Mesh(sharedGeoPool.box(0.18, 0.015, 0.02), materials.greenLed);
    ledStrip.position.set(sx + 0.2, sy, -0.245);
    bench.add(dut, ledStrip);
  }
  // Curved Power & Fiber Test Cords connecting Test Devices -> Bench PDU -> Overhead Riser Conduits (z=11.61 power & 11.09 fiber)
  const benchRiserConduit = new THREE.Mesh(sharedGeoPool.cyl(0.034, 0.034, 1.72, 10), materials.chrome);
  benchRiserConduit.position.set(1.22, 1.8, 0.16);
  const benchFiberRiser = new THREE.Mesh(
    sharedGeoPool.cyl(0.024, 0.024, 1.56, 8),
    cabinetFactory.mats.fiberYellow
  );
  benchFiberRiser.position.set(1.06, 1.72, -0.36);
  bench.add(benchFiberRiser);
  const testFiberCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.75, 1.08, -0.22),
    new THREE.Vector3(0.95, 1.12, -0.32),
    new THREE.Vector3(1.06, 1.24, -0.36),
  ]);
  const testFiberPatch = new THREE.Mesh(
    new THREE.TubeGeometry(testFiberCurve, 12, 0.012, 6, false),
    cabinetFactory.mats.fiberYellow
  );
  const testPowerCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.45, 1.0, 0.28),
    new THREE.Vector3(0.35, 1.08, 0.42),
    new THREE.Vector3(0.35, 1.18, 0.44),
  ]);
  const testPowerCord = new THREE.Mesh(
    new THREE.TubeGeometry(testPowerCurve, 10, 0.013, 6, false),
    cabinetFactory.mats.powerCordRed
  );

  // Ergonomic Task Chair in front of ESD Workbench (matching NOC chairs)
  const benchChair = createErgonomicTaskChair(materials, meshSeatMat);
  benchChair.position.set(-0.65, 0, -0.92);
  benchChair.rotation.y = Math.PI / 2 + 0.08;

  bench.add(
    bTop,
    esdMat,
    lowerShelf,
    toolDrawers,
    riserShelf,
    benchLedLight,
    benchPduBar,
    kvmStand,
    kvmFrame,
    kvmScreen,
    testKb,
    testMouse,
    esdGroundBox,
    benchRiserConduit,
    testFiberPatch,
    testPowerCord,
    benchChair
  );
  bTop.userData.inspect = {
    category: 'Donanım Test & Hazırlık',
    name: 'ESD Burn-In & Ön Kurulum Tezgahı',
    specs: 'Antistatik ESD Mat · KVM Tanılama · 8-Port PDU · TST-01 & Sunucu Salonu Fiber Bağlantısı',
  };
  inspectables.push(bTop);
  dcGroup.add(bench);

  // E) TST-01 Test & Burn-In Cabinet (x = 7.45, z = 11.35) + SEC-NVR-01 Security NVR Cabinet (North-West Staging: x = 3.45, z = 5.85)
  const secNvrCab = cabinetFactory.createCabinet({
    type: 'security',
    code: 'SEC-NVR-01',
    podName: 'Donanım Hazırlık',
    showLeftSide: true,
    showRightSide: true,
    inspectables,
  });
  secNvrCab.position.set(3.45, 0.18, 5.85);
  dcGroup.add(secNvrCab);
  placedCabinets.push(secNvrCab);
  addCollider(colliders, 2.85, 4.05, 5.25, 6.45);

  const spareRack = cabinetFactory.createCabinet({
    type: 'staging',
    code: 'TST-01',
    podName: 'Staging',
    showLeftSide: true,
    showRightSide: true,
    inspectables,
  });
  spareRack.position.set(7.45, 0.18, 11.35);
  spareRack.rotation.y = Math.PI;
  dcGroup.add(spareRack);
  placedCabinets.push(spareRack);
  addCollider(colliders, 2.95, 8.05, 10.65, 12.15);

  // F) Industrial Spare Parts & Server Logistics Rack (North-East: x = 6.4, z = 5.85) + Rolling ESD Server Lift Cart
  const logRack = new THREE.Group();
  logRack.position.set(6.4, 0.18, 5.85);
  for (const rx of [-1.25, 0.0, 1.25]) {
    for (const rz of [-0.42, 0.42]) {
      const upright = new THREE.Mesh(sharedGeoPool.box(0.07, 2.25, 0.07), materials.darkSteelTrim);
      upright.position.set(rx, 1.125, rz);
      upright.castShadow = true;
      logRack.add(upright);
    }
  }
  const boxTexA = new THREE.MeshStandardMaterial({
    map: createLogisticsBoxTexture('SUNUCU DONANIM', '2U BLADE KASA'),
    roughness: 0.65,
  });
  const boxTexB = new THREE.MeshStandardMaterial({
    map: createLogisticsBoxTexture('YEDEK PSU & FAN', '1200W PLATINUM'),
    roughness: 0.65,
  });
  for (const [sy, hasBoxes] of [
    [0.25, 'boxesA'],
    [1.05, 'boxesB'],
    [1.85, 'spools'],
  ]) {
    const beamF = new THREE.Mesh(sharedGeoPool.box(2.58, 0.07, 0.05), orangeRackMat);
    beamF.position.set(0, sy, 0.42);
    const beamB = new THREE.Mesh(sharedGeoPool.box(2.58, 0.07, 0.05), orangeRackMat);
    beamB.position.set(0, sy, -0.42);
    const deck = new THREE.Mesh(sharedGeoPool.box(2.48, 0.03, 0.82), materials.rackTrim);
    deck.position.set(0, sy + 0.04, 0);
    logRack.add(beamF, beamB, deck);

    if (hasBoxes === 'boxesA') {
      for (const bx of [-0.72, 0.05, 0.78]) {
        const box = new THREE.Mesh(sharedGeoPool.box(0.62, 0.42, 0.66), boxTexA);
        box.position.set(bx, sy + 0.27, 0);
        box.castShadow = true;
        logRack.add(box);
      }
    } else if (hasBoxes === 'boxesB') {
      for (const bx of [-0.75, 0.0, 0.75]) {
        const box = new THREE.Mesh(sharedGeoPool.box(0.56, 0.36, 0.6), boxTexB);
        box.position.set(bx, sy + 0.24, 0);
        box.castShadow = true;
        logRack.add(box);
      }
    } else {
      // Coiled Yellow & Aqua Fiber Cable Spools on top shelf
      for (const [sx, sMat] of [
        [-0.75, cabinetFactory.mats.fiberYellow],
        [-0.2, cabinetFactory.mats.fiberAqua],
        [0.45, cabinetFactory.mats.powerCordBlue],
      ]) {
        const drum = new THREE.Mesh(sharedGeoPool.cyl(0.2, 0.2, 0.28, 14), sMat);
        drum.rotation.z = Math.PI / 2;
        drum.position.set(sx, sy + 0.25, 0);
        logRack.add(drum);
      }
    }
  }
  logRack.userData.inspect = {
    category: 'Lojistik & Yedek Parça',
    name: 'Yedek Sunucu & Optik Kablo Rafı',
    specs: 'Yedek 2U Sunucu Kasaları · Hot-Swap PSU/Fan Modülleri · OM4/OS2 Fiber Makaraları',
  };
  inspectables.push(logRack);
  dcGroup.add(logRack);
  addCollider(colliders, 5.05, 7.75, 5.32, 6.38);

  // Rolling ESD Server Lift / Staging Transport Cart (x = 4.65, z = 7.15)
  const cart = new THREE.Group();
  cart.position.set(4.65, 0.18, 7.15);
  const cDeck = new THREE.Mesh(sharedGeoPool.box(1.05, 0.05, 0.68), materials.darkSteelTrim);
  cDeck.position.y = 0.22;
  const cPlatform = new THREE.Mesh(sharedGeoPool.box(0.95, 0.04, 0.62), materials.chrome);
  cPlatform.position.y = 0.72;
  for (const cx of [-0.44, 0.44]) {
    for (const cz of [-0.28, 0.28]) {
      const wheel = new THREE.Mesh(sharedGeoPool.cyl(0.06, 0.06, 0.04, 10), darkCableMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(cx, 0.06, cz);
      const post = new THREE.Mesh(sharedGeoPool.cyl(0.02, 0.02, 0.56, 8), materials.chrome);
      post.position.set(cx, 0.48, cz);
      cart.add(wheel, post);
    }
  }
  const cHandle = new THREE.Mesh(sharedGeoPool.box(0.04, 0.32, 0.62), materials.darkSteelTrim);
  cHandle.position.set(-0.46, 0.92, 0);
  const cServer = new THREE.Mesh(sharedGeoPool.box(0.76, 0.16, 0.5), cabinetFactory.mats.srv2U);
  cServer.position.set(0.04, 0.82, 0);
  cServer.castShadow = true;
  cart.add(cDeck, cPlatform, cHandle, cServer);
  dcGroup.add(cart);
  addCollider(colliders, 4.05, 5.25, 6.7, 7.6);

  // Detailed Wall-Mounted CO2 Fire Extinguisher Station beside Server Hall Door (z = 5.13 flush on North partition)
  const extGroup = new THREE.Group();
  extGroup.position.set(-0.55, 0.18, 5.13);

  const extBackSign = new THREE.Mesh(
    sharedGeoPool.box(0.42, 0.72, 0.025),
    new THREE.MeshStandardMaterial({ map: createExtinguisherSignTexture(), roughness: 0.35 })
  );
  extBackSign.position.set(0, 1.05, 0.012);

  // Steel wall mounting bracket + retention clamp strap holding cylinder securely to wall
  const extBracketV = new THREE.Mesh(sharedGeoPool.box(0.06, 0.44, 0.06), materials.darkSteelTrim);
  extBracketV.position.set(0, 0.78, 0.045);
  const extStrap = new THREE.Mesh(sharedGeoPool.cyl(0.092, 0.092, 0.032, 16), materials.chrome);
  extStrap.position.set(0, 0.68, 0.14);

  // Base boot, Domed CO2 Tank with instruction label, Brass Valve + Pressure Gauge + Handles + Snow Horn Hose
  const extBoot = new THREE.Mesh(sharedGeoPool.cyl(0.09, 0.092, 0.07, 16), darkCableMat);
  extBoot.position.set(0, 0.455, 0.14);
  const extBody = new THREE.Mesh(
    sharedGeoPool.cyl(0.086, 0.086, 0.46, 18),
    new THREE.MeshStandardMaterial({ map: createExtinguisherBodyTexture(), roughness: 0.3, metalness: 0.25 })
  );
  extBody.position.set(0, 0.72, 0.14);
  extBody.rotation.y = Math.PI;
  extBody.castShadow = true;

  const extDome = new THREE.Mesh(
    sharedGeoPool.sphere(0.086, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    materials.fireRed
  );
  extDome.position.set(0, 0.95, 0.14);

  const extValve = new THREE.Mesh(sharedGeoPool.cyl(0.024, 0.03, 0.075, 10), brassMat);
  extValve.position.set(0, 1.05, 0.14);
  const extGauge = new THREE.Mesh(sharedGeoPool.cyl(0.022, 0.022, 0.018, 12), materials.chrome);
  extGauge.rotation.x = Math.PI / 2;
  extGauge.position.set(0, 1.06, 0.172);
  const extGaugeGreen = new THREE.Mesh(sharedGeoPool.cyl(0.015, 0.015, 0.006, 10), materials.greenLed);
  extGaugeGreen.rotation.x = Math.PI / 2;
  extGaugeGreen.position.set(0, 1.06, 0.181);

  // Carry handle & squeeze trigger + safety pull ring
  const extHandleLower = new THREE.Mesh(sharedGeoPool.box(0.018, 0.015, 0.1), darkCableMat);
  extHandleLower.position.set(0, 1.085, 0.1);
  const extLeverUpper = new THREE.Mesh(sharedGeoPool.box(0.018, 0.015, 0.11), materials.chrome);
  extLeverUpper.rotation.x = -0.22;
  extLeverUpper.position.set(0, 1.11, 0.1);
  const extPinRing = new THREE.Mesh(sharedGeoPool.torus(0.015, 0.003, 6, 12), stgFloorStripMat);
  extPinRing.position.set(0.03, 1.07, 0.14);

  // Flexible discharge hose curving down the right side into a flared CO2 snow horn nozzle
  const extHoseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.024, 1.05, 0.14),
    new THREE.Vector3(-0.11, 1.02, 0.14),
    new THREE.Vector3(-0.13, 0.84, 0.14),
    new THREE.Vector3(-0.125, 0.65, 0.16),
  ]);
  const extHose = new THREE.Mesh(new THREE.TubeGeometry(extHoseCurve, 12, 0.012, 7, false), darkCableMat);
  const extHorn = new THREE.Mesh(sharedGeoPool.cyl(0.016, 0.038, 0.16, 12), darkCableMat);
  extHorn.position.set(-0.125, 0.56, 0.16);
  const extClip = new THREE.Mesh(sharedGeoPool.box(0.04, 0.025, 0.03), materials.chrome);
  extClip.position.set(-0.11, 0.68, 0.15);

  extGroup.add(
    extBackSign,
    extBracketV,
    extStrap,
    extBoot,
    extBody,
    extDome,
    extValve,
    extGauge,
    extGaugeGreen,
    extHandleLower,
    extLeverUpper,
    extPinRing,
    extHose,
    extHorn,
    extClip
  );
  extBody.userData.inspect = {
    category: 'Yangın Güvenliği',
    name: 'Duvar Tipi CO2 Yangın Söndürücü (5 KG)',
    specs: 'Elektrik & Sunucu Yangınları (B/E Sınıfı) · Basınç Göstergesi Normal · Duvar Askılı',
  };
  inspectables.push(extBody);
  dcGroup.add(extGroup);

  for (const [cx, cz] of [
    [-4.2, 5.8],
    [8.2, 5.8],
  ]) {
    const camMount = new THREE.Mesh(sharedGeoPool.cyl(0.09, 0.11, 0.08, 12), materials.darkSteelTrim);
    camMount.position.set(cx, 5.14, cz);
    const camDome = new THREE.Mesh(
      sharedGeoPool.sphere(0.085, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      darkCableMat
    );
    camDome.position.set(cx, 5.1, cz);
    dcGroup.add(camMount, camDome);
  }

  // G) Clean Overhead Power & Fiber Trays aligned to Donanım Hazırlık (SEC-NVR-01 @ x=3.45, TST-01 @ x=7.45) & Security (X-Ray @ x=-2.2)
  // 1) Donanım Hazırlık East-West Fiber Tray along z = 11.09 (from trunk x=3.27 to TST-01 x=7.85; no excess run in Security room)
  const stgFiberTrayEW = new THREE.Mesh(sharedGeoPool.box(4.58, 0.07, 0.36), materials.fiberTray);
  stgFiberTrayEW.position.set(5.56, 2.66, 11.09);
  for (const [fz, fMat] of [
    [11.02, cabinetFactory.mats.fiberYellow],
    [11.16, cabinetFactory.mats.fiberAqua],
  ]) {
    const fCable = new THREE.Mesh(sharedGeoPool.cyl(0.024, 0.024, 4.46, 8), fMat);
    fCable.rotation.z = Math.PI / 2;
    fCable.position.set(5.56, 2.71, fz);
    dcGroup.add(fCable);
  }
  dcGroup.add(stgFiberTrayEW);

  // 2) Server Hall -> Donanım Hazırlık Fiber Uplink Trunk aligned to SEC-NVR-01 center (x = 3.45)
  // Split at wall z = 5.0 so the Server Hall side uses srvFiberTray/srvFiber* and dims with Server Hall lights
  const stgFiberJogE = new THREE.Mesh(sharedGeoPool.box(1.46, 0.07, 0.36), srvFiberTray);
  stgFiberJogE.position.set(2.9, 2.66, 1.55);
  const stgFiberBridgeE = new THREE.Mesh(sharedGeoPool.box(0.36, 0.07, 1.15), srvFiberTray);
  stgFiberBridgeE.position.set(2.35, 2.66, 1.12);
  for (const [fz, fMat] of [
    [1.48, srvFiberYellow],
    [1.62, srvFiberAqua],
  ]) {
    const fcJog = new THREE.Mesh(sharedGeoPool.cyl(0.024, 0.024, 0.66, 8), fMat);
    fcJog.rotation.z = Math.PI / 2;
    fcJog.position.set(2.6, 2.71, fz);
    dcGroup.add(fcJog);
  }
  const stgFiberBranchE_Srv = new THREE.Mesh(sharedGeoPool.box(0.36, 0.07, 3.63), srvFiberTray);
  stgFiberBranchE_Srv.position.set(3.45, 2.66, 3.185);
  const stgFiberBranchE_Stg = new THREE.Mesh(sharedGeoPool.box(0.36, 0.07, 6.27), materials.fiberTray);
  stgFiberBranchE_Stg.position.set(3.45, 2.66, 8.135);
  const stgFiberCollarE = new THREE.Mesh(sharedGeoPool.box(0.5, 0.28, 0.34), materials.darkSteelTrim);
  stgFiberCollarE.position.set(3.45, 2.66, 5.0);
  for (const [fx, fMatStg, fMatSrv] of [
    [3.38, cabinetFactory.mats.fiberYellow, srvFiberYellow],
    [3.52, cabinetFactory.mats.fiberAqua, srvFiberAqua],
  ]) {
    const fcStg = new THREE.Mesh(sharedGeoPool.cyl(0.024, 0.024, 6.15, 8), fMatStg);
    fcStg.rotation.x = Math.PI / 2;
    fcStg.position.set(fx, 2.71, 8.075);
    const fcSrv = new THREE.Mesh(sharedGeoPool.cyl(0.024, 0.024, 3.55, 8), fMatSrv);
    fcSrv.rotation.x = Math.PI / 2;
    fcSrv.position.set(fx, 2.71, 3.225);
    dcGroup.add(fcStg, fcSrv);
  }
  dcGroup.add(stgFiberJogE, stgFiberBridgeE, stgFiberBranchE_Srv, stgFiberBranchE_Stg, stgFiberCollarE);

  // 3) Security & Staging Overhead Power Ladder Tray (z = 11.61, x: -2.35 .. +11.9 -> into Güç & UPS Odası!)
  const stgPowerTrayEW = new THREE.Mesh(sharedGeoPool.box(14.25, 0.075, 0.38), materials.powerTray);
  stgPowerTrayEW.position.set(4.775, 2.78, 11.61);
  const stgPowerDivCollar = new THREE.Mesh(sharedGeoPool.box(0.34, 0.3, 0.52), materials.darkSteelTrim);
  stgPowerDivCollar.position.set(2.55, 2.78, 11.61);
  const stgPowerCollarE = new THREE.Mesh(sharedGeoPool.box(0.34, 0.3, 0.52), materials.darkSteelTrim);
  stgPowerCollarE.position.set(9.0, 2.78, 11.61);
  // Power Room North-South tie connecting Staging Power Tray (z = 11.61) straight into BAT-A / UPS Tray (x = 11.8, z = 7.6)
  const stgPowerTieInPowerRoom = new THREE.Mesh(sharedGeoPool.box(0.38, 0.075, 4.2), materials.powerTray);
  stgPowerTieInPowerRoom.position.set(11.8, 2.78, 9.65);
  // Branch feeding X-Ray Scanner (x = -2.2, z: 6.25..11.61) + short wall feed for SEC-NVR-01 rear power drops (x = 3.45, z = 5.59)
  const secPowerSpurN = new THREE.Mesh(sharedGeoPool.box(0.3, 0.065, 5.45), materials.powerTray);
  secPowerSpurN.position.set(-2.2, 2.78, 8.92);
  const xrayPowerDrop = new THREE.Mesh(sharedGeoPool.cyl(0.026, 0.026, 1.38, 8), darkCableMat);
  xrayPowerDrop.position.set(-2.2, 2.1, 6.25);
  const secNvrPowerSpur = new THREE.Mesh(sharedGeoPool.box(0.28, 0.06, 0.68), materials.powerTray);
  secNvrPowerSpur.position.set(3.45, 2.78, 5.38);
  const secNvrPowerCollar = new THREE.Mesh(sharedGeoPool.box(0.4, 0.2, 0.16), materials.darkSteelTrim);
  secNvrPowerCollar.position.set(3.45, 2.78, 5.06);

  for (const [pz, pMat] of [
    [11.53, cabinetFactory.mats.powerCordRed],
    [11.69, cabinetFactory.mats.powerCordBlue],
  ]) {
    const pc = new THREE.Mesh(sharedGeoPool.cyl(0.024, 0.024, 14.1, 8), pMat);
    pc.rotation.z = Math.PI / 2;
    pc.position.set(4.775, 2.83, pz);
    dcGroup.add(pc);
  }
  for (const [px, pMat] of [
    [11.72, cabinetFactory.mats.powerCordRed],
    [11.88, cabinetFactory.mats.powerCordBlue],
  ]) {
    const pc = new THREE.Mesh(sharedGeoPool.cyl(0.024, 0.024, 4.05, 8), pMat);
    pc.rotation.x = Math.PI / 2;
    pc.position.set(px, 2.83, 9.65);
    dcGroup.add(pc);
  }
  // Wall Sub-Distribution Panel (STG-PANO-01) mounted on East Partition inside Staging (x = 8.80, z = 11.61)
  const stgSubPanel = new THREE.Mesh(sharedGeoPool.box(0.16, 0.96, 0.68), materials.darkSteelTrim);
  stgSubPanel.position.set(8.8, 1.62, 11.61);
  const stgSubFace = new THREE.Mesh(
    sharedGeoPool.plane(0.62, 0.88),
    new THREE.MeshStandardMaterial({
      map: createSwitchgearPanelTexture('STG-PANO', 'STAGİNG & GÜVENLİK'),
      roughness: 0.4,
    })
  );
  stgSubFace.rotation.y = -Math.PI / 2;
  stgSubFace.position.set(8.715, 1.62, 11.61);
  const stgPanelRiser = new THREE.Mesh(sharedGeoPool.cyl(0.032, 0.032, 0.72, 8), materials.chrome);
  stgPanelRiser.position.set(8.8, 2.42, 11.61);

  // Ceiling Suspension Rods aligned directly onto remaining Room 4 Overhead Trays
  for (const [rx, rz, ry] of [
    [5.56, 11.09, 2.7],
    [3.45, 8.2, 2.7],
    [0.5, 11.61, 2.82],
    [6.2, 11.61, 2.82],
    [-2.2, 8.9, 2.82],
    [11.8, 9.65, 2.82],
  ]) {
    const h = 5.18 - ry;
    const rod = new THREE.Mesh(sharedGeoPool.cyl(0.014, 0.014, h, 6), materials.chrome);
    rod.position.set(rx, ry + h / 2, rz);
    dcGroup.add(rod);
  }
  dcGroup.add(
    stgPowerTrayEW,
    stgPowerDivCollar,
    stgPowerCollarE,
    stgPowerTieInPowerRoom,
    secPowerSpurN,
    xrayPowerDrop,
    secNvrPowerSpur,
    secNvrPowerCollar,
    stgSubPanel,
    stgSubFace,
    stgPanelRiser
  );

  // 9. ROOM 5: Güç ve UPS Odası (x: [+9..+18], z: [-13..+13])
  const batModMat = new THREE.MeshStandardMaterial({
    map: createBatteryModuleTexture(),
    roughness: 0.44,
    metalness: 0.48,
  });
  const powerScadaTex = createPowerScadaTexture();
  const powerScadaMat = new THREE.MeshStandardMaterial({
    map: powerScadaTex,
    emissiveMap: powerScadaTex,
    emissive: 0xffffff,
    emissiveIntensity: 0.85,
    roughness: 0.3,
  });

  // A) 3 Modular 500 kVA UPS Cabinets along East Wall (x = 16.4, z = -9.2, -6.0, -2.8, facing West -X)
  [-9.2, -6.0, -2.8].forEach((uz, idx) => {
    const upsGrp = new THREE.Group();
    upsGrp.position.set(16.4, 0.18, uz);

    const plinth = new THREE.Mesh(sharedGeoPool.box(1.26, 0.14, 2.16), materials.darkSteelTrim);
    plinth.position.y = 0.07;
    const body = new THREE.Mesh(sharedGeoPool.box(1.2, 2.12, 2.08), materials.rackBody);
    body.position.y = 1.2;
    body.castShadow = true;
    const topHood = new THREE.Mesh(sharedGeoPool.box(1.06, 0.18, 1.9), materials.darkSteelTrim);
    topHood.position.y = 2.35;

    const upsFrontMat = new THREE.MeshStandardMaterial({
      map: createUpsPanelTexture(`UPS-0${idx + 1} · 500 kVA`),
      roughness: 0.38,
      metalness: 0.42,
    });
    const frontFace = new THREE.Mesh(sharedGeoPool.plane(2.0, 2.06), upsFrontMat);
    frontFace.rotation.y = -Math.PI / 2;
    frontFace.position.set(-0.606, 1.2, 0);

    // Chrome handles & Green online status beacon bar
    for (const hz of [-0.08, 0.08]) {
      const handle = new THREE.Mesh(sharedGeoPool.box(0.03, 0.22, 0.035), materials.chrome);
      handle.position.set(-0.62, 1.15, hz);
      upsGrp.add(handle);
    }
    const statusLed = new THREE.Mesh(sharedGeoPool.box(0.04, 0.04, 1.8), materials.greenLed);
    statusLed.position.set(-0.56, 2.34, 0);

    // Top AC/DC Cable Feeder Risers into Overhead Power Tray (x_local = +0.18 -> world x = 16.58)
    for (const [cz, cMat] of [
      [-0.25, cabinetFactory.mats.powerCordRed],
      [0.0, cabinetFactory.mats.powerCordBlue],
      [0.25, darkCableMat],
    ]) {
      const riser = new THREE.Mesh(sharedGeoPool.cyl(0.028, 0.028, 0.42, 8), cMat);
      riser.position.set(0.18, 2.55, cz);
      upsGrp.add(riser);
    }

    // Top Copper Busbar Output Tap connecting UPS West (-X) into Output Collector Bus Spine (world x = 15.45)
    const upsTapBox = new THREE.Mesh(sharedGeoPool.box(0.28, 0.2, 0.44), materials.darkSteelTrim);
    upsTapBox.position.set(-0.95, 2.94, 0);
    const upsTapBar = new THREE.Mesh(sharedGeoPool.box(1.1, 0.12, 0.24), materials.copperBus);
    upsTapBar.position.set(-0.4, 2.94, 0);
    const upsVertBus = new THREE.Mesh(sharedGeoPool.box(0.18, 0.65, 0.24), materials.copperBus);
    upsVertBus.position.set(0.1, 2.68, 0);

    upsGrp.add(plinth, body, topHood, frontFace, statusLed, upsTapBox, upsTapBar, upsVertBus);
    dcGroup.add(upsGrp);

    body.userData.inspect = {
      category: 'Kesintisiz Güç Kaynağı',
      name: `Modüler UPS-0${idx + 1} (500 kVA)`,
      specs: 'Çift Çevrim Online · Giriş 400V AC / Akü 480V DC · Verim %96.8 · N+1 Yedeklilik',
    };
    inspectables.push(body);
  });
  addCollider(colliders, 15.7, 17.1, -10.35, -1.7);

  // B) 4 Main LV Switchgear / ATS Cubicles along North Wall (z = -11.85, facing South +Z)
  const swgDefs = [
    { x: 10.6, code: 'ATS-01', role: 'ŞEBEKE / JENERATÖR' },
    { x: 12.15, code: 'AG-PANO-A', role: 'BESLEME A DAĞITIM' },
    { x: 13.7, code: 'AG-PANO-B', role: 'BESLEME B DAĞITIM' },
    { x: 15.25, code: 'BYPASS-01', role: 'UPS MERKEZİ ŞALTER' },
  ];
  swgDefs.forEach((sd) => {
    const swgGrp = new THREE.Group();
    swgGrp.position.set(sd.x, 0.18, -11.85);

    const plinth = new THREE.Mesh(sharedGeoPool.box(1.34, 0.14, 1.08), materials.darkSteelTrim);
    plinth.position.y = 0.07;
    const swg = new THREE.Mesh(sharedGeoPool.box(1.3, 2.12, 1.02), materials.rackBody);
    swg.position.y = 1.2;
    swg.castShadow = true;
    const busHood = new THREE.Mesh(sharedGeoPool.box(1.22, 0.2, 0.92), materials.darkSteelTrim);
    busHood.position.y = 2.36;

    const swgPanelMat = new THREE.MeshStandardMaterial({
      map: createSwitchgearPanelTexture(sd.code, sd.role),
      roughness: 0.4,
      metalness: 0.45,
    });
    const front = new THREE.Mesh(sharedGeoPool.plane(1.22, 2.04), swgPanelMat);
    front.position.set(0, 1.2, 0.515);

    // 3D MCCB Breaker Handle Lever & Green Status LED
    const lever = new THREE.Mesh(sharedGeoPool.box(0.09, 0.04, 0.06), materials.fireRed);
    lever.position.set(-0.34, 1.05, 0.54);
    const swgLed = new THREE.Mesh(sharedGeoPool.box(0.32, 0.04, 0.03), materials.greenLed);
    swgLed.position.set(0.28, 2.12, 0.52);

    // Top Copper Busbar Riser connecting into Overhead Switchgear Collector
    const busRiser = new THREE.Mesh(sharedGeoPool.box(0.28, 0.28, 0.24), materials.copperBus);
    busRiser.position.set(0, 2.55, 0);

    swgGrp.add(plinth, swg, busHood, front, lever, swgLed, busRiser);
    dcGroup.add(swgGrp);

    swg.userData.inspect = {
      category: 'Alçak Gerilim Dağıtım & ATS',
      name: `${sd.code} (${sd.role})`,
      specs: '400V AC / 2500A Ana Bara · Motorlu Şalter · Otomatik Jeneratör Transferi',
    };
    inspectables.push(swg);
  });
  addCollider(colliders, 9.85, 16.0, -12.45, -11.25);

  // Dielectric Insulating Safety Floor Mat in front of Switchgear
  const swgFloorMat = new THREE.Mesh(sharedGeoPool.box(6.2, 0.02, 1.05), hazardMat);
  swgFloorMat.position.set(12.92, 0.195, -10.68);
  dcGroup.add(swgFloorMat);

  // Switchgear Top Copper Collector + Exterior Generator & Utility Transformer Incoming Feeder Bridges
  const swgTopBus = new THREE.Mesh(sharedGeoPool.box(6.6, 0.14, 0.3), materials.copperBus);
  swgTopBus.position.set(13.28, 2.86, -11.85);
  const genInCollar = new THREE.Mesh(sharedGeoPool.box(0.38, 0.5, 0.82), materials.darkSteelTrim);
  genInCollar.position.set(17.75, 2.86, -11.85);
  const genInTray = new THREE.Mesh(sharedGeoPool.box(1.45, 0.075, 0.68), materials.powerTray);
  genInTray.position.set(17.22, 2.78, -11.85);
  for (const [dz, cMat] of [
    [-0.22, materials.copperBus],
    [-0.14, cabinetFactory.mats.powerCordBlue],
    [-0.06, darkCableMat],
    [0.02, materials.fiberTray],
    [0.1, materials.copperBus],
    [0.18, cabinetFactory.mats.powerCordBlue],
    [0.25, darkCableMat],
  ]) {
    const genFeeder = new THREE.Mesh(sharedGeoPool.cyl(0.026, 0.026, 1.48, 8), cMat);
    genFeeder.rotation.z = Math.PI / 2;
    genFeeder.position.set(17.22, 2.84, -11.85 + dz);
    dcGroup.add(genFeeder);
  }

  // Incoming 400V AC Utility Transformer Feeder Bridges from TR-01 (x=10.6) & TR-02 (x=15.0) via North Wall (z=-12.64)
  for (const txIn of [10.6, 15.0]) {
    const trInCollar = new THREE.Mesh(sharedGeoPool.box(0.84, 0.48, 0.32), materials.darkSteelTrim);
    trInCollar.position.set(txIn, 2.84, -12.56);
    const trInTray = new THREE.Mesh(sharedGeoPool.box(0.66, 0.075, 0.96), materials.powerTray);
    trInTray.position.set(txIn, 2.78, -12.22);
    dcGroup.add(trInCollar, trInTray);
    for (const [dx, cMat] of [
      [-0.2, materials.copperBus],
      [-0.07, cabinetFactory.mats.powerCordBlue],
      [0.07, darkCableMat],
      [0.2, materials.copperBus],
    ]) {
      const trFeeder = new THREE.Mesh(sharedGeoPool.cyl(0.028, 0.028, 0.96, 8), cMat);
      trFeeder.rotation.x = Math.PI / 2;
      trFeeder.position.set(txIn + dx, 2.84, -12.24);
      dcGroup.add(trFeeder);
    }
  }

  dcGroup.add(swgTopBus, genInCollar, genInTray);

  // C) Overhead Power Ladder Tray Loop inside Power Room (Switchgear <-> UPS <-> Battery Banks)
  // 1) Switchgear to UPS East Tray (z = -11.85 -> x: 10.4..16.58)
  const powerTrayN = new THREE.Mesh(sharedGeoPool.box(6.35, 0.075, 0.56), materials.powerTray);
  powerTrayN.position.set(13.55, 2.78, -11.85);
  for (const [cz, cMat] of [
    [-12.01, cabinetFactory.mats.powerCordRed],
    [-11.85, cabinetFactory.mats.powerCordBlue],
    [-11.69, darkCableMat],
  ]) {
    const nCable = new THREE.Mesh(sharedGeoPool.cyl(0.026, 0.026, 6.2, 8), cMat);
    nCable.rotation.z = Math.PI / 2;
    nCable.position.set(13.55, 2.83, cz);
    dcGroup.add(nCable);
  }
  // 2) North-South UPS Overhead Feeder Tray (x = 16.58, z: -12.0..-2.2)
  const powerTrayUps = new THREE.Mesh(sharedGeoPool.box(0.58, 0.075, 9.9), materials.powerTray);
  powerTrayUps.position.set(16.58, 2.78, -7.1);
  for (const [cx, cMat] of [
    [16.44, cabinetFactory.mats.powerCordRed],
    [16.58, cabinetFactory.mats.powerCordBlue],
    [16.72, darkCableMat],
  ]) {
    const cable = new THREE.Mesh(sharedGeoPool.cyl(0.028, 0.028, 9.75, 8), cMat);
    cable.rotation.x = Math.PI / 2;
    cable.position.set(cx, 2.83, -7.1);
    dcGroup.add(cable);
  }
  dcGroup.add(powerTrayN, powerTrayUps);

  // D) Copper Output Busbar Collector Spine (x = 15.45, z: -9.3..-2.7) -> BusMain -> Server Hall
  const upsBusSpine = new THREE.Mesh(sharedGeoPool.box(0.32, 0.16, 6.75), materials.copperBus);
  upsBusSpine.position.set(15.45, 3.12, -6.0);
  const mainBusHub = new THREE.Mesh(sharedGeoPool.box(0.56, 0.28, 0.56), materials.darkSteelTrim);
  mainBusHub.position.set(15.45, 3.12, -6.5);
  dcGroup.add(upsBusSpine, mainBusHub);

  // Feed-A Overhead Copper Busbar Trunking (split at x = 9.0 so Server Hall span dims independently)
  const busMainPower = new THREE.Mesh(sharedGeoPool.box(6.45, 0.16, 0.34), materials.copperBus);
  busMainPower.position.set(12.225, 3.12, -6.5);
  const busMainServer = new THREE.Mesh(sharedGeoPool.box(6.8, 0.16, 0.34), srvCopperBus);
  busMainServer.position.set(5.6, 3.12, -6.5);
  const busWallCollar = new THREE.Mesh(sharedGeoPool.box(0.34, 0.36, 0.54), materials.darkSteelTrim);
  busWallCollar.position.set(9.0, 3.12, -6.5);
  // North-South Busway Spine at x = 2.35 aligned directly above every row's Power Tray!
  const busSpine = new THREE.Mesh(sharedGeoPool.box(0.34, 0.16, 11.4), srvCopperBus);
  busSpine.position.set(2.35, 3.12, -4.4);
  dcGroup.add(busMainPower, busMainServer, busWallCollar, busSpine);

  // Feed-B Redundant Power Cable Ladder Tray (split at x = 9.0 between Power Room and Server Hall)
  const feedBTrayPower = new THREE.Mesh(sharedGeoPool.box(7.65, 0.075, 0.44), materials.powerTray);
  feedBTrayPower.position.set(12.825, 2.76, -5.4);
  const feedBTrayServer = new THREE.Mesh(sharedGeoPool.box(6.7, 0.075, 0.44), srvPowerTray);
  feedBTrayServer.position.set(5.65, 2.76, -5.4);
  const feedBCollar = new THREE.Mesh(sharedGeoPool.box(0.34, 0.3, 0.58), materials.darkSteelTrim);
  feedBCollar.position.set(9.0, 2.78, -5.4);
  const feedBEndBox = new THREE.Mesh(sharedGeoPool.box(0.46, 0.24, 0.52), srvDarkSteel);
  feedBEndBox.position.set(2.35, 2.8, -5.4);
  const feedBSpine = new THREE.Mesh(sharedGeoPool.box(0.42, 0.07, 11.2), srvPowerTray);
  feedBSpine.position.set(2.35, 2.76, -4.4);
  for (const [cx, cMat] of [
    [2.27, srvCordBlue],
    [2.43, srvCordRed],
  ]) {
    const spineCable = new THREE.Mesh(sharedGeoPool.cyl(0.022, 0.022, 11.05, 8), cMat);
    spineCable.rotation.x = Math.PI / 2;
    spineCable.position.set(cx, 2.81, -4.4);
    dcGroup.add(spineCable);
  }
  for (const [cz, cMatP, cMatS] of [
    [-5.48, cabinetFactory.mats.powerCordBlue, srvCordBlue],
    [-5.32, cabinetFactory.mats.powerCordRed, srvCordRed],
  ]) {
    const fCableP = new THREE.Mesh(sharedGeoPool.cyl(0.028, 0.028, 7.55, 8), cMatP);
    fCableP.rotation.z = Math.PI / 2;
    fCableP.position.set(12.8, 2.81, cz);
    const fCableS = new THREE.Mesh(sharedGeoPool.cyl(0.028, 0.028, 6.65, 8), cMatS);
    fCableS.rotation.z = Math.PI / 2;
    fCableS.position.set(5.68, 2.81, cz);
    dcGroup.add(fCableP, fCableS);
  }
  dcGroup.add(feedBTrayPower, feedBTrayServer, feedBCollar, feedBEndBox, feedBSpine);

  // Busway Tap-Off Boxes & Vertical Feeder Conduits dropping directly onto each Power Tray (y = 2.86)
  for (const [rz, facingDir] of [
    [-9.6, 1],
    [-6.2, -1],
    [-2.6, 1],
    [0.8, -1],
  ]) {
    const powerZ = rz - facingDir * 0.26;
    const tapBox = new THREE.Mesh(sharedGeoPool.box(0.42, 0.22, 0.38), srvDarkSteel);
    tapBox.position.set(2.35, 3.04, powerZ);
    const dropConduit = new THREE.Mesh(
      sharedGeoPool.cyl(0.045, 0.045, 0.24, 10),
      srvChrome
    );
    dropConduit.position.set(2.35, 2.94, powerZ);
    dcGroup.add(tapBox, dropConduit);
  }

  // E) 2 Modular Lithium-Ion Battery Rack Banks (BAT-A at x = 11.8, BAT-B at x = 15.4) + Overhead DC Cable Trays to UPS!
  [11.8, 15.4].forEach((bx, bIdx) => {
    const bankName = bIdx === 0 ? 'BAT-A' : 'BAT-B';
    const batGroup = new THREE.Group();
    batGroup.position.set(bx, 0.18, 0);

    // Hazard safety floor mat under entire Battery Bank
    const batPad = new THREE.Mesh(sharedGeoPool.box(1.36, 0.025, 6.2), hazardMat);
    batPad.position.set(0, 0.012, 5.15);
    batGroup.add(batPad);

    // North-end DC Disconnect Breaker & BMS Telemetry Cabinet (z = 2.40)
    const bmsCab = new THREE.Mesh(sharedGeoPool.box(1.02, 2.08, 0.84), materials.darkSteelTrim);
    bmsCab.position.set(0, 1.06, 2.4);
    bmsCab.castShadow = true;
    const bmsFront = new THREE.Mesh(
      sharedGeoPool.plane(0.92, 1.98),
      new THREE.MeshStandardMaterial({
        map: createSwitchgearPanelTexture(`${bankName} DC`, '480V AKÜ ŞALTER'),
        roughness: 0.4,
      })
    );
    bmsFront.rotation.y = Math.PI;
    bmsFront.position.set(0, 1.06, 1.975);
    // Vertical Red (+) & Black (-) Heavy DC Power Risers straight into Overhead DC Tray
    const dcRiserPos = new THREE.Mesh(
      sharedGeoPool.cyl(0.032, 0.032, 0.56, 8),
      cabinetFactory.mats.powerCordRed
    );
    dcRiserPos.position.set(-0.14, 2.34, 2.4);
    const dcRiserNeg = new THREE.Mesh(sharedGeoPool.cyl(0.032, 0.032, 0.56, 8), darkCableMat);
    dcRiserNeg.position.set(0.14, 2.34, 2.4);
    batGroup.add(bmsCab, bmsFront, dcRiserPos, dcRiserNeg);

    // 4 Modular Li-Ion Battery Rack Bays behind BMS Cabinet (z = 3.55, 4.85, 6.15, 7.45)
    for (const bz of [3.55, 4.85, 6.15, 7.45]) {
      const bay = new THREE.Mesh(sharedGeoPool.box(1.0, 2.02, 1.2), materials.rackBody);
      bay.position.set(0, 1.03, bz);
      bay.castShadow = true;
      const sideW = new THREE.Mesh(sharedGeoPool.plane(1.12, 1.94), batModMat);
      sideW.rotation.y = -Math.PI / 2;
      sideW.position.set(-0.505, 1.03, bz);
      const sideE = new THREE.Mesh(sharedGeoPool.plane(1.12, 1.94), batModMat);
      sideE.rotation.y = Math.PI / 2;
      sideE.position.set(0.505, 1.03, bz);
      // DC tie cables linking bay up into the overhead DC tray
      const bayDc = new THREE.Mesh(
        sharedGeoPool.cyl(0.022, 0.022, 0.58, 7),
        cabinetFactory.mats.powerCordRed
      );
      bayDc.position.set(0, 2.31, bz);
      batGroup.add(bay, sideW, sideE, bayDc);
    }

    // Overhead DC Battery Cable Tray running North from z = +7.6 all the way to UPS Cross-Tray at z = -2.8
    const dcTrayRun = new THREE.Mesh(sharedGeoPool.box(0.42, 0.07, 10.6), materials.powerTray);
    dcTrayRun.position.set(0, 2.6, 2.4);
    const dcCableRed = new THREE.Mesh(
      sharedGeoPool.cyl(0.028, 0.028, 10.45, 8),
      cabinetFactory.mats.powerCordRed
    );
    dcCableRed.rotation.x = Math.PI / 2;
    dcCableRed.position.set(-0.1, 2.65, 2.4);
    const dcCableBlk = new THREE.Mesh(
      sharedGeoPool.cyl(0.028, 0.028, 10.45, 8),
      darkCableMat
    );
    dcCableBlk.rotation.x = Math.PI / 2;
    dcCableBlk.position.set(0.1, 2.65, 2.4);
    batGroup.add(dcTrayRun, dcCableRed, dcCableBlk);

    bmsCab.userData.inspect = {
      category: 'Enerji Depolama',
      name: `Lityum-İyon Akü Grubu ${bankName}`,
      specs: '4× Modüler Raf · 480V DC Bara · 15 Dk Tam Yük Otonomi · BMS Aktif',
    };
    inspectables.push(bmsCab);
    dcGroup.add(batGroup);
    addCollider(colliders, bx - 0.58, bx + 0.58, 1.9, 8.15);
  });

  // Cross-Over DC Bus Tray at z = -2.8 linking BAT-A (x=11.8) & BAT-B (x=15.4) into UPS Tray (x=16.58)
  const dcCrossTray = new THREE.Mesh(sharedGeoPool.box(5.1, 0.07, 0.42), materials.powerTray);
  dcCrossTray.position.set(14.15, 2.78, -2.8);
  const dcCrossRed = new THREE.Mesh(
    sharedGeoPool.cyl(0.028, 0.028, 4.95, 8),
    cabinetFactory.mats.powerCordRed
  );
  dcCrossRed.rotation.z = Math.PI / 2;
  dcCrossRed.position.set(14.15, 2.83, -2.88);
  const dcCrossBlk = new THREE.Mesh(
    sharedGeoPool.cyl(0.028, 0.028, 4.95, 8),
    darkCableMat
  );
  dcCrossBlk.rotation.z = Math.PI / 2;
  dcCrossBlk.position.set(14.15, 2.83, -2.72);
  dcGroup.add(dcCrossTray, dcCrossRed, dcCrossBlk);

  // Ceiling Threaded Suspension Rods anchoring Power Room Overhead Trays & Busways
  for (const [rx, rz, ry] of [
    [11.2, -11.85, 2.82],
    [15.4, -11.85, 2.82],
    [16.58, -9.2, 2.82],
    [16.58, -4.0, 2.82],
    [15.45, -8.5, 3.16],
    [15.45, -3.5, 3.16],
    [12.0, -5.4, 2.8],
    [11.8, 0.5, 2.82],
    [11.8, 6.2, 2.82],
    [15.4, 0.5, 2.82],
    [15.4, 6.2, 2.82],
  ]) {
    const h = 5.18 - ry;
    const rod = new THREE.Mesh(sharedGeoPool.cyl(0.015, 0.015, h, 6), materials.chrome);
    rod.position.set(rx, ry + h / 2, rz);
    dcGroup.add(rod);
  }

  // F) Critical Step-Down / Isolation PDU Cabinet (x = 10.15, z = -0.25) + Wall SCADA Display & EPO
  const pduCab = new THREE.Group();
  pduCab.position.set(10.15, 0.18, -0.25);
  const pduBody = new THREE.Mesh(sharedGeoPool.box(1.05, 2.02, 1.1), materials.rackBody);
  pduBody.position.y = 1.01;
  pduBody.castShadow = true;
  const pduFront = new THREE.Mesh(
    sharedGeoPool.plane(0.98, 1.92),
    new THREE.MeshStandardMaterial({
      map: createSwitchgearPanelTexture('PDU-KRİTİK', 'İZOLASYON TRAFO'),
      roughness: 0.4,
    })
  );
  pduFront.rotation.y = Math.PI / 2;
  pduFront.position.set(0.53, 1.01, 0);
  const pduDropSpur = new THREE.Mesh(sharedGeoPool.box(0.36, 0.07, 5.35), materials.powerTray);
  pduDropSpur.position.set(0, 2.58, -2.55);
  const pduSpurCableA = new THREE.Mesh(
    sharedGeoPool.cyl(0.024, 0.024, 5.15, 8),
    cabinetFactory.mats.powerCordRed
  );
  pduSpurCableA.rotation.x = Math.PI / 2;
  pduSpurCableA.position.set(-0.08, 2.63, -2.55);
  const pduSpurCableB = new THREE.Mesh(
    sharedGeoPool.cyl(0.024, 0.024, 5.15, 8),
    cabinetFactory.mats.powerCordBlue
  );
  pduSpurCableB.rotation.x = Math.PI / 2;
  pduSpurCableB.position.set(0.08, 2.63, -2.55);
  const pduRiserA = new THREE.Mesh(
    sharedGeoPool.cyl(0.026, 0.026, 0.62, 8),
    cabinetFactory.mats.powerCordRed
  );
  pduRiserA.position.set(-0.08, 2.3, 0);
  const pduRiserB = new THREE.Mesh(
    sharedGeoPool.cyl(0.026, 0.026, 0.62, 8),
    cabinetFactory.mats.powerCordBlue
  );
  pduRiserB.position.set(0.08, 2.3, 0);
  pduCab.add(pduBody, pduFront, pduDropSpur, pduSpurCableA, pduSpurCableB, pduRiserA, pduRiserB);
  pduBody.userData.inspect = {
    category: 'Güç Dağıtım Ünitesi',
    name: 'PDU-KRİTİK İzolasyon Trafosu',
    specs: '400V / 230V K-13 Harmonik Filtreli · A+B Çift Besleme İzleme',
  };
  inspectables.push(pduBody);
  dcGroup.add(pduCab);
  addCollider(colliders, 9.55, 10.75, -0.9, 0.4);

  // Power Room Wall SCADA One-Line Diagram Screen + Emergency EPO Button
  const scadaFrame = new THREE.Mesh(sharedGeoPool.box(0.14, 1.48, 2.3), materials.darkSteelTrim);
  scadaFrame.position.set(9.18, 2.05, 3.0);
  const scadaScreen = new THREE.Mesh(sharedGeoPool.plane(2.18, 1.36), powerScadaMat);
  scadaScreen.rotation.y = Math.PI / 2;
  scadaScreen.position.set(9.26, 2.05, 3.0);
  const epoBtn = new THREE.Mesh(sharedGeoPool.box(0.12, 0.28, 0.24), materials.fireRed);
  epoBtn.position.set(9.18, 1.42, -2.35);
  dcGroup.add(scadaFrame, scadaScreen, epoBtn);

  // 10. ROOM 6: Mekanik ve Soğutma Odası (x: [-18..-7], z: [-13..-5])
  // A) Merkezi Elektrik Yangını Söndürme Deposu (Novec 1230 / FM-200 + N2 Pilot & CO2/Kuru Kimyevi) at SW Corner (-16.1, -6.75) — NO EXTERNAL PIPING YET!
  const cleanFireDepot = new THREE.Group();
  cleanFireDepot.position.set(-16.1, 0.18, -6.75);

  const depotPad = new THREE.Mesh(sharedGeoPool.box(2.68, 0.035, 2.38), hazardMat);
  depotPad.position.y = 0.017;
  depotPad.receiveShadow = true;
  cleanFireDepot.add(depotPad);

  // Heavy Wall-Anchored Steel Cylinder Containment Rack & Clamping Beams
  for (const [px, pz] of [
    [-1.18, -1.04],
    [-1.18, 1.04],
    [0.18, -1.04],
    [0.18, 1.04],
  ]) {
    const post = new THREE.Mesh(sharedGeoPool.box(0.08, 2.15, 0.08), materials.darkSteelTrim);
    post.position.set(px, 1.09, pz);
    post.castShadow = true;
    cleanFireDepot.add(post);
  }
  for (const bx of [-1.14, 0.14]) {
    const clampBeam = new THREE.Mesh(sharedGeoPool.box(0.07, 0.08, 2.14), materials.darkSteelTrim);
    clampBeam.position.set(bx, 1.12, 0);
    const topBeam = new THREE.Mesh(sharedGeoPool.box(0.12, 0.1, 2.14), materials.darkSteelTrim);
    topBeam.position.set(bx, 2.08, 0);
    cleanFireDepot.add(clampBeam, topBeam);
  }
  for (const bz of [-1.04, 1.04]) {
    const sideRail = new THREE.Mesh(sharedGeoPool.box(1.42, 0.07, 0.07), materials.generatorYellow);
    sideRail.position.set(-0.5, 1.12, bz);
    cleanFireDepot.add(sideRail);
  }

  // 6 High-Capacity FK-5-1-12 (Novec 1230) / FM-200 Clean Agent Cylinders (2 rows × 3) + Local Rack Header (closed caps)
  const depotCylMat = new THREE.MeshStandardMaterial({
    map: createFireCylinderLabelTexture(),
    roughness: 0.34,
    metalness: 0.32,
  });
  for (const rowX of [-0.82, -0.18]) {
    for (const cz of [-0.68, 0.0, 0.68]) {
      const cyl = new THREE.Mesh(sharedGeoPool.cyl(0.23, 0.23, 1.44, 18), depotCylMat);
      cyl.position.set(rowX, 0.75, cz);
      cyl.rotation.y = -Math.PI / 2;
      cyl.castShadow = true;

      const shoulder = new THREE.Mesh(
        sharedGeoPool.sphere(0.23, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
        materials.fireRed
      );
      shoulder.position.set(rowX, 1.47, cz);

      const strap = new THREE.Mesh(sharedGeoPool.torus(0.242, 0.018, 6, 18), materials.darkSteelTrim);
      strap.rotation.x = Math.PI / 2;
      strap.position.set(rowX, 1.12, cz);

      const valve = new THREE.Mesh(sharedGeoPool.cyl(0.055, 0.075, 0.22, 12), brassMat);
      valve.position.set(rowX, 1.75, cz);

      const gauge = new THREE.Mesh(sharedGeoPool.cyl(0.045, 0.045, 0.032, 12), materials.chrome);
      gauge.rotation.z = Math.PI / 2;
      gauge.position.set(rowX + 0.07, 1.77, cz);
      const gaugeFace = new THREE.Mesh(sharedGeoPool.cyl(0.03, 0.03, 0.008, 10), materials.greenLed);
      gaugeFace.rotation.z = Math.PI / 2;
      gaugeFace.position.set(rowX + 0.088, 1.77, cz);

      const flexCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(rowX, 1.84, cz),
        new THREE.Vector3(rowX + 0.02, 2.02, cz),
        new THREE.Vector3(-0.5, 2.12, cz),
      ]);
      const flexHose = new THREE.Mesh(
        new THREE.TubeGeometry(flexCurve, 8, 0.024, 7, false),
        materials.darkSteelTrim
      );

      cleanFireDepot.add(cyl, shoulder, strap, valve, gauge, gaugeFace, flexHose);
      if (rowX === -0.18 && cz === 0.0) {
        cyl.userData.inspect = {
          category: 'Merkezi Gazlı Yangın Söndürme',
          name: 'Novec 1230 / FM-200 Merkezi Söndürme Deposu (N+1)',
          specs: '6× 140L 42 Bar İletken Olmayan Gaz · 5 Zon Seçici Vana Kolektörü · Güç/NOC/Lobi/Staging & Sunucu Yedek Hattı',
        };
        inspectables.push(cyl);
      }
    }
  }

  // Local Internal Manifold Header above the 6 Cylinders (North blind-capped, South feeds Vertical Selector Riser)
  const localManifold = new THREE.Mesh(sharedGeoPool.cyl(0.06, 0.06, 1.86, 12), materials.fireRed);
  localManifold.rotation.x = Math.PI / 2;
  localManifold.position.set(-0.5, 2.14, 0);
  const northBlindCap = new THREE.Mesh(sharedGeoPool.cyl(0.085, 0.085, 0.04, 12), brassMat);
  northBlindCap.rotation.x = Math.PI / 2;
  northBlindCap.position.set(-0.5, 2.14, -0.94);
  cleanFireDepot.add(northBlindCap, localManifold);

  // 2× Nitrogen Pilot Actuation Cylinders (North side) + 50 KG Wheeled CO2/Dry-Chemical Cart (South side)
  for (const pz of [-0.82, -0.56]) {
    const n2Body = new THREE.Mesh(sharedGeoPool.cyl(0.1, 0.1, 1.18, 14), materials.darkSteelTrim);
    n2Body.position.set(0.58, 0.62, pz);
    n2Body.castShadow = true;
    const n2Dome = new THREE.Mesh(
      sharedGeoPool.sphere(0.1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
      materials.pipeSupply
    );
    n2Dome.position.set(0.58, 1.21, pz);
    const n2Valve = new THREE.Mesh(sharedGeoPool.cyl(0.032, 0.042, 0.14, 10), brassMat);
    n2Valve.position.set(0.58, 1.36, pz);
    cleanFireDepot.add(n2Body, n2Dome, n2Valve);
  }

  // 50 KG Wheeled Dry-Chemical Powder / CO2 Electrical Extinguisher Trolley (x_local = +0.72, z_local = +0.72)
  const cartGrp = new THREE.Group();
  cartGrp.position.set(0.72, 0.035, 0.72);
  for (const wz of [-0.24, 0.24]) {
    const wheel = new THREE.Mesh(sharedGeoPool.cyl(0.13, 0.13, 0.045, 14), darkCableMat);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(0, 0.13, wz);
    cartGrp.add(wheel);
  }
  const cartAxle = new THREE.Mesh(sharedGeoPool.cyl(0.02, 0.02, 0.52, 8), materials.chrome);
  cartAxle.rotation.x = Math.PI / 2;
  cartAxle.position.set(0, 0.13, 0);
  const cartFrame = new THREE.Mesh(sharedGeoPool.box(0.04, 1.12, 0.34), materials.darkSteelTrim);
  cartFrame.position.set(-0.14, 0.62, 0);
  const cartTank = new THREE.Mesh(sharedGeoPool.cyl(0.18, 0.18, 0.88, 16), materials.fireRed);
  cartTank.position.set(0.04, 0.56, 0);
  cartTank.castShadow = true;
  const cartDome = new THREE.Mesh(
    sharedGeoPool.sphere(0.18, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    materials.fireRed
  );
  cartDome.position.set(0.04, 1.0, 0);
  const cartValve = new THREE.Mesh(sharedGeoPool.cyl(0.04, 0.05, 0.14, 10), brassMat);
  cartValve.position.set(0.04, 1.22, 0);
  const cartHose = new THREE.Mesh(sharedGeoPool.torus(0.16, 0.018, 6, 14, Math.PI * 1.3), darkCableMat);
  cartHose.position.set(0.08, 0.78, 0.18);
  cartGrp.add(cartAxle, cartFrame, cartTank, cartDome, cartValve, cartHose);
  cleanFireDepot.add(cartGrp);

  // Digital Telemetry & Pressure Status Cabinet centered cleanly in middle bay (facing +X into Cooling Room)
  const depotPanelBox = new THREE.Mesh(sharedGeoPool.box(0.14, 0.78, 0.88), materials.darkSteelTrim);
  depotPanelBox.position.set(0.28, 1.56, 0.04);
  const depotPanelFace = new THREE.Mesh(
    sharedGeoPool.plane(0.82, 0.7),
    new THREE.MeshStandardMaterial({
      map: createCleanAgentDepotTexture(),
      emissive: 0x1e1b18,
      emissiveIntensity: 0.32,
      roughness: 0.35,
    })
  );
  depotPanelFace.rotation.y = Math.PI / 2;
  depotPanelFace.position.set(0.355, 1.56, 0.04);
  cleanFireDepot.add(depotPanelBox, depotPanelFace);

  // Wall-mounted Overhead Sign on West Wall (-17.58) facing East (+X)
  const depotSign = new THREE.Mesh(
    sharedGeoPool.plane(2.35, 0.58),
    new THREE.MeshBasicMaterial({
      map: createSignTexture('ELEKTRİK YANGIN SÖNDÜRME', 'NOVEC 1230 · ÇOK BÖLGELİ HAT (N+1)', '#ef4444'),
    })
  );
  depotSign.rotation.y = Math.PI / 2;
  depotSign.position.set(-17.56, 2.86, -6.75);

  dcGroup.add(cleanFireDepot, depotSign);
  addCollider(colliders, -17.45, -14.85, -8.0, -5.45);

  // B) Exterior Chiller Wall Penetration Collars & Primary Collector Manifold (z = -12.35, x = -14.0..-8.0)
  for (const [cx, cMat] of [
    [-13.85, materials.pipeSupply],
    [-13.15, materials.pipeReturn],
    [-8.85, materials.pipeSupply],
    [-8.15, materials.pipeReturn],
  ]) {
    const wallFlange = new THREE.Mesh(sharedGeoPool.cyl(0.2, 0.2, 0.16, 14), materials.darkSteelTrim);
    wallFlange.rotation.x = Math.PI / 2;
    wallFlange.position.set(cx, 1.35, -12.6);
    const stub = new THREE.Mesh(sharedGeoPool.cyl(0.12, 0.12, 0.55, 12), cMat);
    stub.rotation.x = Math.PI / 2;
    stub.position.set(cx, 1.35, -12.42);
    dcGroup.add(wallFlange, stub);
  }
  // Horizontal Primary Chiller Header along North wall (z = -12.2, y = 1.35 & 1.72) feeding PHE-01
  const primSupCol = new THREE.Mesh(sharedGeoPool.cyl(0.13, 0.13, 6.2, 12), materials.pipeSupply);
  primSupCol.rotation.z = Math.PI / 2;
  primSupCol.position.set(-11.0, 1.35, -12.18);
  const primRetCol = new THREE.Mesh(sharedGeoPool.cyl(0.13, 0.13, 5.4, 12), materials.pipeReturn);
  primRetCol.rotation.z = Math.PI / 2;
  primRetCol.position.set(-10.65, 1.72, -12.18);
  for (const cx of [-13.15, -8.15]) {
    const rLift = new THREE.Mesh(sharedGeoPool.cyl(0.11, 0.11, 0.42, 10), materials.pipeReturn);
    rLift.position.set(cx, 1.54, -12.18);
    dcGroup.add(rLift);
  }
  for (const sx of [-13.2, -9.2]) {
    const pStand = new THREE.Mesh(sharedGeoPool.box(0.12, 1.22, 0.14), materials.darkSteelTrim);
    pStand.position.set(sx, 0.79, -12.18);
    dcGroup.add(pStand);
  }
  dcGroup.add(primSupCol, primRetCol);

  // C) Thermal Buffer Tank (BUFFER-01 · 3000 L) at x = -16.5, z = -11.2 & Expansion Tank at x = -15.25, z = -11.4
  const bufGrp = new THREE.Group();
  bufGrp.position.set(-16.5, 0.18, -11.2);
  for (const [lx, lz] of [
    [-0.36, -0.32],
    [0.36, -0.32],
    [0, 0.42],
  ]) {
    const leg = new THREE.Mesh(sharedGeoPool.cyl(0.06, 0.08, 0.34, 8), materials.darkSteelTrim);
    leg.position.set(lx, 0.17, lz);
    bufGrp.add(leg);
  }
  const bufVessel = new THREE.Mesh(
    sharedGeoPool.cyl(0.56, 0.56, 2.1, 20),
    new THREE.MeshStandardMaterial({ map: createBufferTankLabelTexture(), roughness: 0.42, metalness: 0.3 })
  );
  bufVessel.position.y = 1.38;
  bufVessel.rotation.y = Math.PI;
  bufVessel.castShadow = true;
  const bufDome = new THREE.Mesh(
    sharedGeoPool.sphere(0.56, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    materials.pipeSupply
  );
  bufDome.scale.y = 0.45;
  bufDome.position.y = 2.43;
  const bufVent = new THREE.Mesh(sharedGeoPool.cyl(0.05, 0.06, 0.25, 10), brassMat);
  bufVent.position.y = 2.75;
  // Tie Buffer Tank cleanly into overhead Supply (y_world=3.2 -> 3.02 local) & Return (3.55 -> 3.37 local) headers
  const bufSupRiser = new THREE.Mesh(sharedGeoPool.cyl(0.11, 0.11, 0.72, 10), materials.pipeSupply);
  bufSupRiser.position.set(0.25, 2.75, -0.2);
  const bufRetRiser = new THREE.Mesh(sharedGeoPool.cyl(0.11, 0.11, 1.05, 10), materials.pipeReturn);
  bufRetRiser.position.set(0.25, 2.9, 0.2);
  bufGrp.add(bufVessel, bufDome, bufVent, bufSupRiser, bufRetRiser);
  bufVessel.userData.inspect = {
    category: 'Termal Kütle & Depolama',
    name: 'Termal Tampon Tankı (BUFFER-01 · 3000 L)',
    specs: 'İzoleli Çelik Gövde · Elektrik Kesintisinde 12 Dk Termal Ride-Through Kapasitesi',
  };
  inspectables.push(bufVessel);
  dcGroup.add(bufGrp);
  addCollider(colliders, -17.15, -15.85, -11.85, -10.55);

  // Pressurized Diaphragm Expansion Tank (x = -15.25, z = -11.4) tied straight into Lower Suction Header
  const expGrp = new THREE.Group();
  expGrp.position.set(-15.25, 0.18, -11.4);
  const expSkirt = new THREE.Mesh(sharedGeoPool.cyl(0.28, 0.34, 0.28, 14), materials.darkSteelTrim);
  expSkirt.position.y = 0.14;
  const expTank = new THREE.Mesh(sharedGeoPool.cyl(0.34, 0.34, 1.32, 16), materials.pipeSupply);
  expTank.position.y = 0.94;
  expTank.castShadow = true;
  const expTopCap = new THREE.Mesh(
    sharedGeoPool.sphere(0.34, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    materials.pipeSupply
  );
  expTopCap.scale.y = 0.4;
  expTopCap.position.y = 1.6;
  const expPipe = new THREE.Mesh(sharedGeoPool.cyl(0.055, 0.055, 0.65, 10), materials.pipeReturn);
  expPipe.position.set(0.2, 0.72, -0.35);
  const expArm = new THREE.Mesh(sharedGeoPool.cyl(0.055, 0.055, 0.42, 10), materials.pipeReturn);
  expArm.rotation.x = Math.PI / 2;
  expArm.position.set(0.2, 0.7, -0.2);
  expGrp.add(expSkirt, expTank, expTopCap, expPipe, expArm);
  dcGroup.add(expGrp);
  addCollider(colliders, -15.65, -14.85, -11.8, -11.0);

  // D) Plate Heat Exchanger (PHE-01 · Free Cooling / Isolation) at North-East (x = -8.25, z = -11.35)
  const pheGrp = new THREE.Group();
  pheGrp.position.set(-8.25, 0.18, -11.35);
  const pheBase = new THREE.Mesh(sharedGeoPool.box(1.38, 0.12, 0.86), materials.darkSteelTrim);
  pheBase.position.y = 0.06;
  const phePlateF = new THREE.Mesh(sharedGeoPool.box(0.1, 1.58, 0.76), materials.pipeSupply);
  phePlateF.position.set(-0.56, 0.91, 0);
  phePlateF.castShadow = true;
  const phePlateR = new THREE.Mesh(sharedGeoPool.box(0.1, 1.58, 0.76), materials.pipeSupply);
  phePlateR.position.set(0.56, 0.91, 0);
  phePlateR.castShadow = true;
  for (let i = -4; i <= 4; i++) {
    const fin = new THREE.Mesh(sharedGeoPool.box(0.035, 1.42, 0.68), materials.chrome);
    fin.position.set(i * 0.09, 0.91, 0);
    pheGrp.add(fin);
  }
  for (const [ty, tz] of [
    [1.62, -0.34],
    [1.62, 0.34],
    [0.24, -0.34],
    [0.24, 0.34],
  ]) {
    const tieBar = new THREE.Mesh(sharedGeoPool.cyl(0.022, 0.022, 1.32, 8), materials.darkSteelTrim);
    tieBar.rotation.z = Math.PI / 2;
    tieBar.position.set(0, ty, tz);
    pheGrp.add(tieBar);
  }
  // Piping tying PHE-01 directly to Primary Chiller Collector (z = -12.18) & Overhead Headers (y_world = 3.2/3.55)
  const pheSupOut = new THREE.Mesh(sharedGeoPool.cyl(0.1, 0.1, 1.58, 10), materials.pipeSupply);
  pheSupOut.position.set(-0.35, 2.26, -0.05);
  const pheRetIn = new THREE.Mesh(sharedGeoPool.cyl(0.1, 0.1, 1.92, 10), materials.pipeReturn);
  pheRetIn.position.set(0.35, 2.43, 0.35);
  const phePrimTap = new THREE.Mesh(sharedGeoPool.cyl(0.09, 0.09, 0.85, 10), materials.pipeSupply);
  phePrimTap.rotation.x = Math.PI / 2;
  phePrimTap.position.set(-0.25, 1.18, -0.42);
  pheGrp.add(pheBase, phePlateF, phePlateR, pheSupOut, pheRetIn, phePrimTap);
  phePlateF.userData.inspect = {
    category: 'Isı Transferi & Free-Cooling',
    name: 'Plakalı Eşanjör (PHE-01 · 2.4 MW)',
    specs: '316L Paslanmaz Plaka Paketi · Chiller Primer/Sekonder Devre İzolasyonu & Economizer',
  };
  inspectables.push(phePlateF);
  dcGroup.add(pheGrp);
  addCollider(colliders, -9.0, -7.5, -11.85, -10.85);

  // E) 3 Detailed VFD Chilled-Water Centrifugal Pumps (P-01, P-02, P-03) + Suction Header & Valves
  const suctionHeader = new THREE.Mesh(sharedGeoPool.cyl(0.13, 0.13, 7.6, 14), materials.pipeReturn);
  suctionHeader.rotation.z = Math.PI / 2;
  suctionHeader.position.set(-12.2, 0.88, -11.65);
  for (const sx of [-15.2, -12.2, -9.2]) {
    const stanchion = new THREE.Mesh(sharedGeoPool.box(0.12, 0.68, 0.16), materials.darkSteelTrim);
    stanchion.position.set(sx, 0.52, -11.65);
    dcGroup.add(stanchion);
  }
  dcGroup.add(suctionHeader);

  [-13.9, -11.9, -9.9].forEach((px, idx) => {
    const pump = new THREE.Group();
    pump.position.set(px, 0.18, -9.45);

    // Concrete inertia pad + 4 spring vibration isolators + steel skid frame
    const pad = new THREE.Mesh(sharedGeoPool.box(1.02, 0.18, 1.52), materials.darkSteelTrim);
    pad.position.y = 0.09;
    pad.receiveShadow = true;
    const skid = new THREE.Mesh(sharedGeoPool.box(0.88, 0.08, 1.38), materials.rackBody);
    skid.position.y = 0.25;
    for (const ix of [-0.4, 0.4]) {
      for (const iz of [-0.62, 0.62]) {
        const spring = new THREE.Mesh(sharedGeoPool.cyl(0.04, 0.04, 0.07, 8), materials.fireRed);
        spring.position.set(ix, 0.2, iz);
        pump.add(spring);
      }
    }

    // Finned AC Electric Drive Motor + Rear Cooling Cowl + Shaft Coupling Guard + Volute Pump Casing
    const motorBody = new THREE.Mesh(sharedGeoPool.cyl(0.26, 0.26, 0.66, 16), materials.pipeSupply);
    motorBody.rotation.x = Math.PI / 2;
    motorBody.position.set(0, 0.56, 0.22);
    motorBody.castShadow = true;
    for (let f = -2; f <= 2; f++) {
      const fin = new THREE.Mesh(sharedGeoPool.box(0.56, 0.03, 0.54), materials.darkSteelTrim);
      fin.position.set(0, 0.56 + f * 0.08, 0.22);
      pump.add(fin);
    }
    const jBox = new THREE.Mesh(sharedGeoPool.box(0.16, 0.14, 0.16), materials.darkSteelTrim);
    jBox.position.set(0.22, 0.78, 0.24);
    const fanCowl = new THREE.Mesh(sharedGeoPool.cyl(0.27, 0.24, 0.16, 16), materials.darkSteelTrim);
    fanCowl.rotation.x = Math.PI / 2;
    fanCowl.position.set(0, 0.56, 0.58);
    const couplingGuard = new THREE.Mesh(sharedGeoPool.box(0.22, 0.22, 0.26), stgFloorStripMat);
    couplingGuard.position.set(0, 0.52, -0.2);
    const volute = new THREE.Mesh(sharedGeoPool.cyl(0.32, 0.32, 0.26, 18), materials.pipeSupply);
    volute.rotation.x = Math.PI / 2;
    volute.position.set(0, 0.58, -0.44);
    volute.castShadow = true;

    // Suction Pipe with Y-Strainer + Butterfly Valve connecting to Lower Suction Header (z_local = -2.2)
    const sucPipe = new THREE.Mesh(sharedGeoPool.cyl(0.085, 0.085, 1.72, 10), materials.pipeReturn);
    sucPipe.rotation.x = Math.PI / 2;
    sucPipe.position.set(0, 0.7, -1.36);
    const yStrainer = new THREE.Mesh(sharedGeoPool.cyl(0.11, 0.11, 0.22, 10), materials.darkSteelTrim);
    yStrainer.rotation.x = Math.PI / 4;
    yStrainer.position.set(0, 0.58, -1.15);
    const valveWheelIn = new THREE.Mesh(sharedGeoPool.torus(0.09, 0.015, 6, 12), materials.fireRed);
    valveWheelIn.position.set(0.14, 0.7, -0.95);
    valveWheelIn.rotation.y = Math.PI / 2;

    // Vertical Discharge Riser + Check Valve Flange + Isolation Valve + Dial Pressure Gauge -> Overhead Supply Header (y=3.02 local, z=-1.95 local)
    const disUp = new THREE.Mesh(sharedGeoPool.cyl(0.085, 0.085, 2.38, 10), materials.pipeSupply);
    disUp.position.set(0, 1.85, -0.44);
    const disBack = new THREE.Mesh(sharedGeoPool.cyl(0.085, 0.085, 1.56, 10), materials.pipeSupply);
    disBack.rotation.x = Math.PI / 2;
    disBack.position.set(0, 3.02, -1.2);
    const checkFlange = new THREE.Mesh(sharedGeoPool.cyl(0.14, 0.14, 0.08, 12), materials.darkSteelTrim);
    checkFlange.position.set(0, 1.35, -0.44);
    const valveWheelOut = new THREE.Mesh(sharedGeoPool.torus(0.09, 0.015, 6, 12), materials.fireRed);
    valveWheelOut.position.set(0.14, 1.72, -0.44);
    valveWheelOut.rotation.y = Math.PI / 2;
    const gaugeDial = new THREE.Mesh(sharedGeoPool.cyl(0.065, 0.065, 0.03, 12), materials.chrome);
    gaugeDial.rotation.x = Math.PI / 2;
    gaugeDial.position.set(-0.1, 1.98, -0.4);

    // Overhead Motor Electrical Conduit running South to VFD Drive Panel
    const vfdConduit = new THREE.Mesh(sharedGeoPool.cyl(0.022, 0.022, 2.25, 8), darkCableMat);
    vfdConduit.position.set(0.22, 1.9, 0.24);

    pump.add(
      pad,
      skid,
      motorBody,
      jBox,
      fanCowl,
      couplingGuard,
      volute,
      sucPipe,
      yStrainer,
      valveWheelIn,
      disUp,
      disBack,
      checkFlange,
      valveWheelOut,
      gaugeDial,
      vfdConduit
    );
    dcGroup.add(pump);
    addCollider(colliders, px - 0.56, px + 0.56, -10.25, -8.65);

    volute.userData.inspect = {
      category: 'Soğutma Pompası',
      name: `Chilled-Water VFD Pompa P-0${idx + 1}`,
      specs: 'Frekans Kontrollü · Pislik Tutucu + Çekvalf + Kelebek Vana · Debi 42 L/sn · 4.2 Bar',
    };
    inspectables.push(volute);
  });

  // F) VFD Pump Drive & BMS Cabinet + Glycol Dosing Unit (South Wall: z = -5.6) + East Wall Cooling SCADA
  const vfdGrp = new THREE.Group();
  vfdGrp.position.set(-11.8, 0.18, -5.62);
  const vfdBody = new THREE.Mesh(sharedGeoPool.box(2.35, 1.96, 0.68), materials.rackBody);
  vfdBody.position.y = 0.98;
  vfdBody.castShadow = true;
  const vfdFace = new THREE.Mesh(
    sharedGeoPool.plane(2.24, 1.84),
    new THREE.MeshStandardMaterial({ map: createVfdPanelTexture(), roughness: 0.38 })
  );
  vfdFace.rotation.y = Math.PI;
  vfdFace.position.set(0, 0.98, -0.345);
  const vfdTray = new THREE.Mesh(sharedGeoPool.box(4.4, 0.07, 0.34), materials.powerTray);
  vfdTray.position.set(-0.1, 2.84, -3.58);
  const vfdSpur = new THREE.Mesh(sharedGeoPool.box(0.36, 0.07, 3.65), materials.powerTray);
  vfdSpur.position.set(0, 2.84, -1.78);
  const vfdRiser = new THREE.Mesh(sharedGeoPool.cyl(0.036, 0.036, 1.05, 8), darkCableMat);
  vfdRiser.position.set(0, 2.42, 0);
  for (const [rx, rz] of [
    [0, -1.78],
    [-1.8, -3.58],
    [1.8, -3.58],
  ]) {
    const vRod = new THREE.Mesh(sharedGeoPool.cyl(0.014, 0.014, 2.16, 6), materials.chrome);
    vRod.position.set(rx, 3.92, rz);
    vfdGrp.add(vRod);
  }
  vfdGrp.add(vfdBody, vfdFace, vfdTray, vfdSpur, vfdRiser);
  vfdBody.userData.inspect = {
    category: 'Pompa Otomasyonu',
    name: 'VFD Pompa Sürücü & Soğutma BMS Panosu',
    specs: '3× Frekans İnvertörü · ΔP Basınç Kontrollü · N+1 Otomatik Rotasyon',
  };
  inspectables.push(vfdBody);
  dcGroup.add(vfdGrp);
  addCollider(colliders, -13.05, -10.55, -6.05, -5.2);

  // Glycol Makeup & Water Treatment Station (x = -13.7, z = -5.75) piped into Return Header (z = -11.0, y = 3.55)
  const glyGrp = new THREE.Group();
  glyGrp.position.set(-13.7, 0.18, -5.75);
  const glyBund = new THREE.Mesh(sharedGeoPool.box(0.95, 0.14, 0.85), stgFloorStripMat);
  glyBund.position.y = 0.07;
  const glyDrum = new THREE.Mesh(sharedGeoPool.cyl(0.28, 0.28, 0.92, 14), materials.pipeSupply);
  glyDrum.position.set(-0.14, 0.6, 0);
  const glyPump = new THREE.Mesh(sharedGeoPool.box(0.24, 0.26, 0.28), materials.darkSteelTrim);
  glyPump.position.set(0.26, 0.27, 0);
  const glyTube = new THREE.Mesh(sharedGeoPool.cyl(0.018, 0.018, 3.12, 6), materials.chrome);
  glyTube.position.set(0.26, 1.82, 0);
  const glyFeedN = new THREE.Mesh(sharedGeoPool.cyl(0.018, 0.018, 5.26, 6), materials.chrome);
  glyFeedN.rotation.x = Math.PI / 2;
  glyFeedN.position.set(0.26, 3.37, -2.625);
  glyGrp.add(glyBund, glyDrum, glyPump, glyTube, glyFeedN);
  dcGroup.add(glyGrp);
  addCollider(colliders, -14.25, -13.15, -6.25, -5.25);

  // Cooling Room Wall SCADA Display on East Partition (x = -7.18, z = -6.5, facing West -X)
  const coolScadaFrame = new THREE.Mesh(sharedGeoPool.box(0.12, 1.24, 1.96), materials.darkSteelTrim);
  coolScadaFrame.position.set(-7.18, 2.05, -6.5);
  const coolScadaTex = createCoolingScadaTexture();
  const coolScadaScreen = new THREE.Mesh(
    sharedGeoPool.plane(1.86, 1.14),
    new THREE.MeshStandardMaterial({
      map: coolScadaTex,
      emissiveMap: coolScadaTex,
      emissive: 0xffffff,
      emissiveIntensity: 0.85,
      roughness: 0.3,
    })
  );
  coolScadaScreen.rotation.y = -Math.PI / 2;
  coolScadaScreen.position.set(-7.25, 2.05, -6.5);
  dcGroup.add(coolScadaFrame, coolScadaScreen);

  // Floor Safety Walkway Lines in Cooling Room
  for (const [fx, fz, fw, fd] of [
    [-10.8, -8.35, 7.2, 0.06],
    [-10.8, -6.7, 7.2, 0.06],
  ]) {
    const fStrip = new THREE.Mesh(sharedGeoPool.box(fw, 0.012, fd), stgAisleMat);
    fStrip.position.set(fx, 0.187, fz);
    dcGroup.add(fStrip);
  }

  // Main Chilled Water Headers (split at x = -7.0 so Server Hall span dims independently)
  const supMech = new THREE.Mesh(sharedGeoPool.cyl(0.16, 0.16, 9.5, 14), materials.pipeSupply);
  supMech.rotation.z = Math.PI / 2;
  supMech.position.set(-11.75, 3.2, -11.4);
  const supServer = new THREE.Mesh(sharedGeoPool.cyl(0.16, 0.16, 12.35, 14), srvPipeSupply);
  supServer.rotation.z = Math.PI / 2;
  supServer.position.set(-0.825, 3.2, -11.4);

  const retMech = new THREE.Mesh(sharedGeoPool.cyl(0.16, 0.16, 9.5, 14), materials.pipeReturn);
  retMech.rotation.z = Math.PI / 2;
  retMech.position.set(-11.75, 3.55, -11.0);
  const retServer = new THREE.Mesh(sharedGeoPool.cyl(0.16, 0.16, 12.35, 14), srvPipeReturn);
  retServer.rotation.z = Math.PI / 2;
  retServer.position.set(-0.825, 3.55, -11.0);
  dcGroup.add(supMech, supServer, retMech, retServer);

  // Blind End-Cap Flanges + Wall Sleeve Collars + Pipe Support Brackets
  for (const endX of [-16.5, 5.35]) {
    const capMat = endX > 0 ? srvDarkSteel : materials.darkSteelTrim;
    const capS = new THREE.Mesh(sharedGeoPool.cyl(0.22, 0.22, 0.08, 16), capMat);
    capS.rotation.z = Math.PI / 2;
    capS.position.set(endX, 3.2, -11.4);

    const capR = new THREE.Mesh(sharedGeoPool.cyl(0.22, 0.22, 0.08, 16), capMat);
    capR.rotation.z = Math.PI / 2;
    capR.position.set(endX, 3.55, -11.0);
    dcGroup.add(capS, capR);
  }
  // Wall penetration collars at x = -7.0 (Mechanical -> Server Hall wall)
  for (const [py, pz] of [
    [3.2, -11.4],
    [3.55, -11.0],
  ]) {
    const collar = new THREE.Mesh(sharedGeoPool.cyl(0.24, 0.24, 0.34, 16), materials.darkSteelTrim);
    collar.rotation.z = Math.PI / 2;
    collar.position.set(-7.0, py, pz);
    dcGroup.add(collar);
  }
  // Copper Busway ceiling hanger rods (Server Hall + Power Room)
  for (const [bx, bz] of [
    [2.35, -9.0],
    [2.35, -4.4],
    [2.35, 0.2],
    [5.8, -6.5],
    [13.0, -6.5],
  ]) {
    const rodMat = bx < 9.0 ? srvChrome : materials.chrome;
    const busRod = new THREE.Mesh(sharedGeoPool.cyl(0.016, 0.016, 2.0, 6), rodMat);
    busRod.position.set(bx, 4.18, bz);
    dcGroup.add(busRod);
  }

  // North-wall cantilevered steel pipe support brackets along both Cooling Room & Server Hall
  for (const bx of [-15.2, -12.6, -10.0, -7.8, -5.2, -2.5, 0.5, 3.5, 5.1]) {
    const isSrv = bx > -7.0;
    const bracketArm = new THREE.Mesh(
      sharedGeoPool.box(0.12, 0.1, 2.2),
      isSrv ? srvDarkSteel : materials.darkSteelTrim
    );
    bracketArm.position.set(bx, 3.0, -11.8);
    const hangerRod = new THREE.Mesh(
      sharedGeoPool.cyl(0.018, 0.018, 2.2, 8),
      isSrv ? srvChrome : materials.chrome
    );
    hangerRod.position.set(bx, 4.1, -10.85);
    dcGroup.add(bracketArm, hangerRod);
  }

  // Building-Wide Clean-Agent (Novec 1230) Multi-Zone Fire Suppression Piping (InstancedMesh batched)
  const firePipeGroup = new THREE.Group();
  const pipeMatrices = [];
  const jointMatrices = [];
  const nozDropMatrices = [];
  const nozConeMatrices = [];
  const hangerMatrices = [];
  const _fpUp = new THREE.Vector3(0, 1, 0);
  const _fpDir = new THREE.Vector3();
  const _fpPos = new THREE.Vector3();
  const _fpQuat = new THREE.Quaternion();
  const _fpScale = new THREE.Vector3();
  const _fpNozQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI, 0, 0));

  const addFirePipe = (x1, y1, z1, x2, y2, z2, r = 0.036) => {
    const p1 = new THREE.Vector3(x1, y1, z1);
    const p2 = new THREE.Vector3(x2, y2, z2);
    _fpDir.subVectors(p2, p1);
    const len = _fpDir.length();
    if (len < 0.001) return;
    _fpPos.copy(p1).addScaledVector(_fpDir, 0.5);
    _fpQuat.setFromUnitVectors(_fpUp, _fpDir.divideScalar(len));
    pipeMatrices.push(new THREE.Matrix4().compose(_fpPos, _fpQuat, _fpScale.set(r, len, r)));
    const jr = r * 1.24;
    _fpQuat.identity();
    jointMatrices.push(new THREE.Matrix4().compose(p1, _fpQuat, _fpScale.set(jr, jr, jr)));
    jointMatrices.push(new THREE.Matrix4().compose(p2, _fpQuat, _fpScale.set(jr, jr, jr)));
  };
  const addFireNozzle = (x, y, z) => {
    nozDropMatrices.push(new THREE.Matrix4().makeTranslation(x, y - 0.07, z));
    nozConeMatrices.push(
      new THREE.Matrix4().compose(_fpPos.set(x, y - 0.15, z), _fpNozQuat, _fpScale.set(1, 1, 1))
    );
  };
  const addFirestopCollar = (x, y, z, axis = 'z') => {
    const col = new THREE.Mesh(sharedGeoPool.box(0.24, 0.24, 0.34), materials.darkSteelTrim);
    if (axis === 'x') col.rotation.y = Math.PI / 2;
    col.position.set(x, y, z);
    const seal = new THREE.Mesh(sharedGeoPool.box(0.18, 0.18, 0.38), materials.fireRed);
    if (axis === 'x') seal.rotation.y = Math.PI / 2;
    seal.position.set(x, y, z);
    firePipeGroup.add(col, seal);
  };
  const addFireHanger = (x, y, z) => {
    const h = 5.12 - y;
    _fpQuat.identity();
    _fpPos.set(x, y + h * 0.5, z);
    _fpScale.set(1, h, 1);
    hangerMatrices.push(new THREE.Matrix4().compose(_fpPos, _fpQuat, _fpScale));
  };

  // 1) Central Depot Riser (-16.6, 2.32 -> 4.28, -5.81) + 5-Zone Directional Selector Valve Manifold (x = -16.6 .. -13.2)
  addFirePipe(-16.6, 2.32, -5.81, -16.6, 4.28, -5.81, 0.052);
  addFirePipe(-16.6, 4.28, -5.81, -13.2, 4.28, -5.81, 0.052);

  for (const vx of [-15.95, -15.3, -14.6, -13.9, -13.3]) {
    const vBody = new THREE.Mesh(sharedGeoPool.cyl(0.068, 0.068, 0.18, 10), brassMat);
    vBody.rotation.z = Math.PI / 2;
    vBody.position.set(vx, 4.28, -5.81);
    const actuator = new THREE.Mesh(sharedGeoPool.box(0.14, 0.18, 0.14), materials.darkSteelTrim);
    actuator.position.set(vx, 4.44, -5.81);
    const vLed = new THREE.Mesh(sharedGeoPool.box(0.06, 0.04, 0.04), materials.greenLed);
    vLed.position.set(vx, 4.46, -5.73);
    firePipeGroup.add(vBody, actuator, vLed);
  }
  const manifoldProxy = new THREE.Mesh(
    sharedGeoPool.box(3.6, 0.45, 0.45),
    materials.invisibleHitMat
  );
  manifoldProxy.position.set(-14.9, 4.32, -5.81);
  manifoldProxy.userData.inspect = {
    category: 'Çok Bölgeli Yangın Dağıtımı',
    name: 'Novec 1230 Yön Seçici Vana Kolektörü (5 Zon)',
    specs: 'Zon 1: Soğutma · Zon 2: NOC · Zon 3: Lobi · Zon 4: Güvenlik & Staging · Zon 5: Güç & UPS · Sunucu Salonu Çekvalfli N+1 Yedek',
  };
  firePipeGroup.add(manifoldProxy);
  inspectables.push(manifoldProxy);

  // 2) ZONE 1 — Soğutma Odası Local Electrical & Pump Protection
  addFirePipe(-13.9, 4.28, -5.81, -13.9, 4.28, -8.8, 0.036);
  addFirePipe(-13.9, 4.28, -8.8, -8.8, 4.28, -8.8, 0.034);
  for (const nx of [-13.9, -11.4, -8.8]) addFireNozzle(nx, 4.28, -8.8);
  addFireHanger(-11.4, 4.28, -8.8);

  // 3) ZONE 2 & ZONE 3 — Kontrol Merkezi (NOC) & Giriş Lobisi
  addFirePipe(-15.3, 4.28, -5.81, -15.3, 4.28, -3.9, 0.038);
  addFirestopCollar(-15.3, 4.28, -5.0, 'z');
  addFirePipe(-15.3, 4.28, -3.9, -12.5, 4.28, -3.9, 0.038);
  addFirePipe(-12.5, 4.28, -3.9, -12.5, 4.28, 9.4, 0.036);
  addFirestopCollar(-12.5, 4.28, 5.0, 'z');
  // NOC IDF-01 + Dual Console Cross-Branches
  addFirePipe(-12.5, 4.28, -3.9, -8.35, 4.28, -3.9, 0.03);
  addFireNozzle(-8.35, 4.28, -3.9);
  for (const nz of [-2.0, 1.4]) {
    addFirePipe(-15.2, 4.28, nz, -9.8, 4.28, nz, 0.03);
    addFireNozzle(-14.6, 4.28, nz);
    addFireNozzle(-10.4, 4.28, nz);
  }
  addFireHanger(-12.5, 4.28, -2.0);
  addFireHanger(-12.5, 4.28, 1.4);
  // Lobby Branch (Reception, Lounge, Turnstiles)
  addFirePipe(-14.8, 4.28, 9.4, -7.2, 4.28, 9.4, 0.03);
  for (const nx of [-14.4, -11.5, -7.6]) addFireNozzle(nx, 4.28, 9.4);
  addFireHanger(-11.5, 4.28, 9.4);

  // 4) MAIN EAST TRUNK — Cooling Room -> Sunucu Salonu (split at -7 & +9) -> Güç & UPS
  addFirePipe(-14.6, 4.28, -5.81, -14.6, 4.28, -10.25, 0.044);
  addFirePipe(-14.6, 4.28, -10.25, -14.6, 4.34, -10.25, 0.044);
  addFirePipe(-14.6, 4.34, -10.25, -7.0, 4.34, -10.25, 0.044);
  // Server Hall segment of fire trunk uses srvFireRed so it darkens with Server Hall
  const srvFireTrunk = new THREE.Mesh(sharedGeoPool.cyl(0.044, 0.044, 16.0, 10), srvFireRed);
  srvFireTrunk.rotation.z = Math.PI / 2;
  srvFireTrunk.position.set(1.0, 4.34, -10.25);
  firePipeGroup.add(srvFireTrunk);
  addFirePipe(9.0, 4.34, -10.25, 13.5, 4.34, -10.25, 0.044);
  addFirestopCollar(-7.0, 4.34, -10.25, 'x');
  addFirestopCollar(9.0, 4.34, -10.25, 'x');
  addFireHanger(-11.5, 4.34, -10.25);
  for (const hx of [-3.5, 2.5, 7.5]) {
    const rod = new THREE.Mesh(sharedGeoPool.cyl(0.014, 0.014, 5.12 - 4.34, 6), srvChrome);
    rod.position.set(hx, 4.34 + (5.12 - 4.34) * 0.5, -10.25);
    firePipeGroup.add(rod);
  }

  // N+1 Redundant Check-Valve & Motorized Isolation Cross-Tie into Sunucu Salonu's Independent FM-200 Header (x = 8.3, y = 4.50)
  addFirePipe(8.3, 4.34, -10.25, 8.3, 4.5, -10.25, 0.034);
  const checkTieValve = new THREE.Mesh(sharedGeoPool.cyl(0.065, 0.065, 0.14, 12), materials.chrome);
  checkTieValve.position.set(8.3, 4.42, -10.25);
  const tieActuator = new THREE.Mesh(sharedGeoPool.box(0.14, 0.12, 0.14), materials.fireRed);
  tieActuator.position.set(8.3, 4.42, -10.08);
  firePipeGroup.add(checkTieValve, tieActuator);
  checkTieValve.userData.inspect = {
    category: 'N+1 Yedek Söndürme Bağlantısı',
    name: 'Sunucu Salonu Çekvalfli Yedek Giriş Vanası',
    specs: 'Sunucu Salonu 3×120L FM-200 Hattı Bağımsızdır · Boşalma Halinde Merkezi 6×140L Depodan N+1 Takviye Sağlar',
  };
  inspectables.push(checkTieValve);

  // 5) ZONE 5 — Güç & UPS Odası Spine & Branches (ATS/Switchgear, UPS-01..03, BAT-A/B, PDU)
  addFirePipe(13.5, 4.34, -11.35, 13.5, 4.34, 9.2, 0.042);
  addFirePipe(10.6, 4.34, -11.35, 15.4, 4.34, -11.35, 0.032);
  for (const nx of [10.8, 13.5, 15.2]) addFireNozzle(nx, 4.34, -11.35);

  addFirePipe(12.2, 4.34, -6.0, 16.2, 4.34, -6.0, 0.032);
  for (const nx of [12.4, 16.0]) addFireNozzle(nx, 4.34, -6.0);

  addFirePipe(11.8, 4.34, 4.8, 15.4, 4.34, 4.8, 0.032);
  for (const nx of [11.8, 15.4]) addFireNozzle(nx, 4.34, 4.8);

  addFirePipe(11.5, 4.34, 9.2, 15.4, 4.34, 9.2, 0.032);
  for (const nx of [11.8, 15.2]) addFireNozzle(nx, 4.34, 9.2);
  for (const hz of [-8.0, -2.0, 4.8, 8.2]) addFireHanger(13.5, 4.34, hz);

  // 6) ZONE 4 — Güvenlik & Staging Holü (SEC-NVR-01, X-Ray, ESD Test Bench, TST-01)
  addFirePipe(13.5, 4.34, 8.2, -3.6, 4.34, 8.2, 0.036);
  addFirestopCollar(9.0, 4.34, 8.2, 'x');
  addFirestopCollar(2.55, 4.34, 8.2, 'x');
  addFirePipe(-3.6, 4.34, 8.2, -3.6, 4.34, 10.8, 0.03);
  addFirePipe(-2.2, 4.34, 8.2, -2.2, 4.34, 7.2, 0.03);
  addFirePipe(3.4, 4.34, 8.2, 3.4, 4.34, 10.6, 0.03);
  addFirePipe(6.4, 4.34, 8.2, 6.4, 4.34, 10.6, 0.03);
  addFireNozzle(-3.6, 4.34, 10.8);
  addFireNozzle(-2.2, 4.34, 7.2);
  addFireNozzle(3.4, 4.34, 10.6);
  addFireNozzle(6.4, 4.34, 10.6);
  addFireHanger(4.0, 4.34, 8.2);
  addFireHanger(-1.0, 4.34, 8.2);

  const addInstBatch = (geo, mat, matsArr) => {
    if (matsArr.length === 0) return;
    const inst = new THREE.InstancedMesh(geo, mat, matsArr.length);
    for (let i = 0; i < matsArr.length; i++) inst.setMatrixAt(i, matsArr[i]);
    inst.computeBoundingSphere();
    firePipeGroup.add(inst);
  };
  addInstBatch(sharedGeoPool.cyl(1, 1, 1, 10), materials.fireRed, pipeMatrices);
  addInstBatch(sharedGeoPool.sphere(1, 8, 8), materials.fireRed, jointMatrices);
  addInstBatch(sharedGeoPool.cyl(0.018, 0.018, 0.14, 8), materials.fireRed, nozDropMatrices);
  addInstBatch(sharedGeoPool.cone(0.055, 0.13, 10), brassMat, nozConeMatrices);
  addInstBatch(sharedGeoPool.cyl(0.014, 0.014, 1, 6), materials.chrome, hangerMatrices);

  dcGroup.add(firePipeGroup);

  // 10B. Acil Çıkış Kapısı (East Wall: x = 17.82, z = 9.8) & Işıklı Acil Çıkış Yönlendirme Levhaları
  const exitDoorLeafMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.42,
    metalness: 0.65,
  });
  const panicBarMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x16a34a,
    emissiveIntensity: 0.35,
    roughness: 0.3,
    metalness: 0.45,
  });

  const emExitGrp = new THREE.Group();
  emExitGrp.position.set(17.82, 0.18, 9.8);

  // Door frame posts & header
  const emPostN = new THREE.Mesh(sharedGeoPool.box(0.38, 2.57, 0.12), materials.darkSteelTrim);
  emPostN.position.set(0, 1.285, -0.86);
  const emPostS = new THREE.Mesh(sharedGeoPool.box(0.38, 2.57, 0.12), materials.darkSteelTrim);
  emPostS.position.set(0, 1.285, 0.86);
  const emHeader = new THREE.Mesh(sharedGeoPool.box(0.42, 0.16, 1.84), materials.darkSteelTrim);
  emHeader.position.set(0, 2.52, 0);
  emExitGrp.add(emPostN, emPostS, emHeader);

  // Double fire-rated steel leaves with vision slits & green panic push-bars (slides open in Walk mode)
  const makeEmLeaf = (zOff) => {
    const leaf = new THREE.Group();
    leaf.position.set(0, 1.24, zOff);
    const slab = new THREE.Mesh(sharedGeoPool.box(0.06, 2.44, 0.78), exitDoorLeafMat);
    slab.castShadow = true;
    const vision = new THREE.Mesh(sharedGeoPool.box(0.07, 0.62, 0.2), materials.archGlass);
    vision.position.set(0, 0.44, zOff < 0 ? 0.14 : -0.14);
    const bar = new THREE.Mesh(sharedGeoPool.box(0.05, 0.07, 0.56), panicBarMat);
    bar.position.set(-0.05, -0.16, 0);
    const warnStrip = new THREE.Mesh(sharedGeoPool.box(0.068, 0.12, 0.76), materials.fireRed);
    warnStrip.position.set(0, -1.08, 0);
    leaf.add(slab, vision, bar, warnStrip);
    return leaf;
  };
  const emLeafN = makeEmLeaf(-0.4);
  const emLeafS = makeEmLeaf(0.4);
  emExitGrp.add(emLeafN, emLeafS);

  // Exterior concrete landing & hazard step outside East Emergency Exit
  const emLanding = new THREE.Mesh(sharedGeoPool.box(1.45, 0.18, 2.6), materials.sidewalk);
  emLanding.position.set(0.88, -0.09, 0);
  emLanding.receiveShadow = true;
  const emStepEdge = new THREE.Mesh(sharedGeoPool.box(0.16, 0.04, 2.6), hazardMat);
  emStepEdge.position.set(1.52, 0.005, 0);
  const emSignExt = new THREE.Mesh(
    sharedGeoPool.plane(1.1, 0.34),
    new THREE.MeshBasicMaterial({ map: createExitSignTexture('none') })
  );
  emSignExt.rotation.y = Math.PI / 2;
  emSignExt.position.set(0.22, 2.86, 0);
  emExitGrp.add(emLanding, emStepEdge, emSignExt);

  const emHitProxy = new THREE.Mesh(
    sharedGeoPool.box(0.4, 2.5, 1.75),
    materials.invisibleHitMat
  );
  emHitProxy.position.set(0, 1.25, 0);
  emHitProxy.userData.inspect = {
    category: 'Yangın & Acil Tahliye',
    name: 'Acil Çıkış Kapısı (Doğu Cephe · Panik Barlı)',
    specs: 'EN 1125 Panik Barlı Çift Kanatlı Yangın Kapısı · Akü Destekli Işıklı Çıkış Tabelası · Yaklaşınca Otomatik Açılır',
  };
  emExitGrp.add(emHitProxy);
  inspectables.push(emHitProxy);
  dcGroup.add(emExitGrp);

  doors.push({
    axis: 'z',
    x: 17.82,
    z: 9.8,
    leafA: emLeafN,
    leafB: emLeafS,
    closedOffset: 0.4,
    openOffset: 1.15,
    openAmount: 0,
  });

  // Illuminated Green "ACİL ÇIKIŞ" Signs (stay glowing even when room lights are turned OFF!)
  const exitTexNone = createExitSignTexture('none');
  const exitTexLeft = createExitSignTexture('left');
  const exitTexRight = createExitSignTexture('right');

  const exitSignDefs = [
    { pos: [17.56, 3.02, 9.8], rotY: -Math.PI / 2, tex: exitTexNone }, // Emergency Exit (Inside)
    { pos: [8.82, 3.36, 9.1], rotY: -Math.PI / 2, tex: exitTexRight }, // Staging -> Power/Exit
    { pos: [8.82, 3.36, -3.9], rotY: -Math.PI / 2, tex: exitTexRight }, // Server Hall -> Power
    { pos: [1.2, 3.36, 4.82], rotY: Math.PI, tex: exitTexNone }, // Server Hall -> Staging
    { pos: [-7.18, 3.36, -9.0], rotY: -Math.PI / 2, tex: exitTexRight }, // Mechanical -> Server Hall
    { pos: [-12.5, 3.36, 4.82], rotY: Math.PI, tex: exitTexNone }, // NOC -> Lobby
    { pos: [-11.5, 3.55, 12.56], rotY: Math.PI, tex: exitTexNone }, // Main Lobby Exit
  ];
  exitSignDefs.forEach(({ pos, rotY, tex }) => {
    const signBox = new THREE.Group();
    signBox.position.set(...pos);
    signBox.rotation.y = rotY;
    const housing = new THREE.Mesh(sharedGeoPool.box(0.92, 0.28, 0.08), materials.darkSteelTrim);
    const face = new THREE.Mesh(
      sharedGeoPool.plane(0.86, 0.24),
      new THREE.MeshStandardMaterial({
        map: tex,
        emissiveMap: tex,
        emissive: 0xffffff,
        emissiveIntensity: 0.92,
        roughness: 0.3,
      })
    );
    face.position.z = 0.044;
    signBox.add(housing, face);
    dcGroup.add(signBox);
  });

  // 10C. Physical Ceiling LED Troffer Panels (no PointLights for high FPS & low shader RAM)
  const zoneFixtureConfigs = {
    lobby: {
      emissive: 0xf8fafc,
      fixtures: [
        [-14.2, 7.6, 2.4, 0.55],
        [-14.2, 10.6, 2.4, 0.55],
        [-8.8, 7.6, 2.4, 0.55],
        [-8.8, 10.6, 2.4, 0.55],
      ],
    },
    staging: {
      emissive: 0xe2e8f0,
      fixtures: [
        [-2.0, 7.5, 2.6, 0.5],
        [-2.0, 10.5, 2.6, 0.5],
        [4.8, 7.5, 2.6, 0.5],
        [4.8, 10.5, 2.6, 0.5],
      ],
    },
    noc: {
      emissive: 0xe0f2fe,
      fixtures: [
        [-13.8, -2.0, 3.2, 0.45],
        [-13.8, 1.8, 3.2, 0.45],
        [-9.8, -2.0, 2.8, 0.45],
        [-9.8, 1.8, 2.8, 0.45],
      ],
    },
    server: {
      emissive: 0xe0f2fe,
      fixtures: [
        [-1.0, -10.8, 11.0, 0.36],
        [-1.0, -4.4, 11.0, 0.36],
        [-1.0, 2.8, 11.0, 0.36],
        [6.4, -7.2, 0.45, 5.2],
        [6.4, 0.2, 0.45, 5.2],
      ],
    },
    power: {
      emissive: 0xfef3c7,
      fixtures: [
        [13.5, -8.5, 4.2, 0.45],
        [13.5, -2.5, 4.2, 0.45],
        [13.5, 3.5, 4.2, 0.45],
        [13.5, 9.2, 4.2, 0.45],
      ],
    },
    mech: {
      emissive: 0xf1f5f9,
      fixtures: [
        [-14.2, -9.0, 0.45, 4.8],
        [-10.2, -9.0, 0.45, 4.8],
      ],
    },
  };

  // 11. Removable Roof Assembly (for "Çatı Kesiti" Cutaway Inspection!)
  const roofGroup = new THREE.Group();
  roofGroup.name = 'DataCenterRoof';

  const trofferFrameMat = materials.darkSteelTrim;
  const diffuserMatCache = new Map();

  Object.values(zoneFixtureConfigs).forEach((cfg) => {
    let diffuserMat = diffuserMatCache.get(cfg.emissive);
    if (!diffuserMat) {
      diffuserMat = new THREE.MeshStandardMaterial({
        color: cfg.emissive,
        emissive: cfg.emissive,
        emissiveIntensity: 1.35,
        roughness: 0.25,
      });
      diffuserMatCache.set(cfg.emissive, diffuserMat);
    }

    // Ceiling-mounted LED troffer panels attached to roofGroup underside (y = 5.14)
    cfg.fixtures.forEach(([fx, fz, fw, fd]) => {
      const housing = new THREE.Mesh(sharedGeoPool.box(fw + 0.08, 0.06, fd + 0.08), trofferFrameMat);
      housing.position.set(fx, 5.15, fz);
      const panel = new THREE.Mesh(sharedGeoPool.box(fw, 0.03, fd), diffuserMat);
      panel.position.set(fx, 5.12, fz);
      roofGroup.add(housing, panel);
    });
  });

  const roofDeck = new THREE.Mesh(sharedGeoPool.box(36.6, 0.28, 26.6), materials.concreteExt);
  roofDeck.position.set(0, 5.32, 0);
  roofDeck.castShadow = true;
  roofDeck.receiveShadow = true;
  roofGroup.add(roofDeck);

  const serverCeilingPanel = new THREE.Mesh(sharedGeoPool.plane(16, 18), serverCeilingMat);
  serverCeilingPanel.rotation.x = Math.PI / 2;
  serverCeilingPanel.position.set(1.0, 5.175, -4.0);
  roofGroup.add(serverCeilingPanel);

  // Parapet edge trim
  const parapetN = new THREE.Mesh(sharedGeoPool.box(36.8, 0.55, 0.35), materials.darkSteelTrim);
  parapetN.position.set(0, 5.7, -13.15);
  const parapetS = new THREE.Mesh(sharedGeoPool.box(36.8, 0.55, 0.35), materials.darkSteelTrim);
  parapetS.position.set(0, 5.7, 13.15);
  const parapetW = new THREE.Mesh(sharedGeoPool.box(0.35, 0.55, 26.6), materials.darkSteelTrim);
  parapetW.position.set(-18.2, 5.7, 0);
  const parapetE = new THREE.Mesh(sharedGeoPool.box(0.35, 0.55, 26.6), materials.darkSteelTrim);
  parapetE.position.set(18.2, 5.7, 0);
  roofGroup.add(parapetN, parapetS, parapetW, parapetE);

  // Rooftop HVAC & Paratoner Equipment Group (automatically hidden when inside closed rooms!)
  const roofTopProps = new THREE.Group();
  roofTopProps.name = 'DataCenterRoofTopProps';
  roofGroup.add(roofTopProps);

  const hvacMat = materials.cracBody;
  const ductMat = materials.powerTray;
  const roofDuctGeos = [];
  const roofTrimGeos = [];
  const addBoxGeoTo = (arr, w, h, d, x, y, z) => {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(x, y, z);
    arr.push(g);
  };

  // Helper to collect flanged rectangular sheet-metal HVAC duct geometry for merged single-draw-call rendering
  function addRoofDuct(x1, z1, x2, z2, w, h, yCenter, withCurb = false) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    const len = Math.max(Math.abs(dx), Math.abs(dz));
    const alongX = Math.abs(dx) >= Math.abs(dz);
    const sx = alongX ? len : w;
    const sz = alongX ? w : len;
    addBoxGeoTo(roofDuctGeos, sx, h, sz, (x1 + x2) * 0.5, yCenter, (z1 + z2) * 0.5);

    const spanSteps = Math.max(2, Math.floor(len / 3.4));
    for (let s = 0; s <= spanSteps; s++) {
      const frac = s / spanSteps;
      const fx = x1 + dx * frac;
      const fz = z1 + dz * frac;
      addBoxGeoTo(
        roofTrimGeos,
        alongX ? 0.06 : w + 0.08,
        h + 0.08,
        alongX ? w + 0.08 : 0.06,
        fx,
        yCenter,
        fz
      );

      if (s > 0 && s < spanSteps && yCenter > 5.75) {
        const legH = yCenter - h * 0.5 - 5.46;
        if (legH > 0.08) {
          for (const side of [-1, 1]) {
            addBoxGeoTo(
              roofTrimGeos,
              0.06,
              legH,
              0.06,
              fx + (alongX ? 0 : side * (w * 0.45)),
              5.46 + legH * 0.5,
              fz + (alongX ? side * (w * 0.45) : 0)
            );
          }
        }
      }
    }

    if (withCurb) {
      addBoxGeoTo(roofDuctGeos, w, 0.52, w, x2, 5.72, z2);
      addBoxGeoTo(roofTrimGeos, w + 0.28, 0.24, w + 0.28, x2, 5.56, z2);
    }
  }

  // 1) 3 Detailed Fresh-Air Makeup & Pressurization AHU Units (x = -11, -3, +5; z = -6.5)
  [-11, -3, 5].forEach((rx, idx) => {
    const ahuGrp = new THREE.Group();
    ahuGrp.position.set(rx, 5.46, -6.5);

    // Insulated structural steel roof curb
    const curb = new THREE.Mesh(sharedGeoPool.box(4.36, 0.18, 2.96), materials.darkSteelTrim);
    curb.position.y = 0.09;
    curb.castShadow = true;

    // Main double-skin insulated HVAC cabinet + corner steel framing + cornice rim
    const body = new THREE.Mesh(sharedGeoPool.box(4.2, 1.42, 2.8), hvacMat);
    body.position.y = 0.89;
    body.castShadow = true;
    body.receiveShadow = true;
    const topRim = new THREE.Mesh(sharedGeoPool.box(4.32, 0.08, 2.92), materials.darkSteelTrim);
    topRim.position.y = 1.62;
    ahuGrp.add(curb, body, topRim);

    for (const cx of [-2.08, 2.08]) {
      for (const cz of [-1.38, 1.38]) {
        const post = new THREE.Mesh(sharedGeoPool.box(0.08, 1.44, 0.08), materials.darkSteelTrim);
        post.position.set(cx, 0.89, cz);
        ahuGrp.add(post);
      }
    }

    // 3 South-facing inspection doors, viewport portholes & handles
    for (const dx of [-1.3, 0.0, 1.3]) {
      const door = new THREE.Mesh(sharedGeoPool.box(1.16, 1.14, 0.04), materials.aluCladding);
      door.position.set(dx, 0.86, 1.41);
      const port = new THREE.Mesh(sharedGeoPool.cyl(0.11, 0.11, 0.05, 14), materials.archGlass);
      port.rotation.x = Math.PI / 2;
      port.position.set(dx, 1.06, 1.42);
      const handle = new THREE.Mesh(sharedGeoPool.box(0.04, 0.16, 0.04), materials.chrome);
      handle.position.set(dx + 0.44, 0.82, 1.44);
      ahuGrp.add(door, port, handle);
    }

    const ahuSign = new THREE.Mesh(
      sharedGeoPool.plane(1.36, 0.28),
      new THREE.MeshBasicMaterial({
        map: createSignTexture(`KLİMA SANTRALİ AHU-0${idx + 1}`, 'TAZE HAVA · HEPA H13', '#38bdf8'),
      })
    );
    ahuSign.position.set(-1.1, 1.48, 1.44);
    const ahuBeacon = new THREE.Mesh(sharedGeoPool.cyl(0.045, 0.05, 0.1, 10), materials.greenLed);
    ahuBeacon.position.set(1.88, 1.71, 1.25);
    ahuGrp.add(ahuSign, ahuBeacon);

    // North-facing weather-proof fresh air intake hood with horizontal louver slats
    const intakeHood = new THREE.Mesh(sharedGeoPool.box(1.72, 0.96, 0.42), materials.darkSteelTrim);
    intakeHood.position.set(0, 0.88, -1.6);
    ahuGrp.add(intakeHood);
    for (const ly of [0.56, 0.74, 0.92, 1.1]) {
      const slat = new THREE.Mesh(sharedGeoPool.box(1.58, 0.04, 0.08), materials.chrome);
      slat.position.set(0, ly, -1.8);
      slat.rotation.x = 0.35;
      ahuGrp.add(slat);
    }

    // 2 Roof-top circular exhaust/fan cowls with chrome protective rings & blades
    for (const fx of [-1.05, 1.05]) {
      const cowl = new THREE.Mesh(sharedGeoPool.cyl(0.56, 0.62, 0.32, 18), materials.darkSteelTrim);
      cowl.position.set(fx, 1.82, 0);
      cowl.castShadow = true;
      const fanHub = new THREE.Mesh(sharedGeoPool.cyl(0.14, 0.14, 0.08, 12), materials.chrome);
      fanHub.position.set(fx, 1.94, 0);
      const bladeA = new THREE.Mesh(sharedGeoPool.box(0.86, 0.02, 0.14), materials.aluCladding);
      bladeA.position.set(fx, 1.93, 0);
      bladeA.rotation.y = 0.4 + idx * 0.6;
      const bladeB = new THREE.Mesh(sharedGeoPool.box(0.86, 0.02, 0.14), materials.aluCladding);
      bladeB.position.set(fx, 1.93, 0);
      bladeB.rotation.y = 0.4 + idx * 0.6 + Math.PI / 2;
      const guardRing = new THREE.Mesh(sharedGeoPool.torus(0.54, 0.018, 6, 20), materials.chrome);
      guardRing.rotation.x = Math.PI / 2;
      guardRing.position.set(fx, 1.98, 0);
      ahuGrp.add(cowl, fanHub, bladeA, bladeB, guardRing);
    }

    // Rectangular supply duct elbow exiting South (+Z) from AHU directly into Main Roof Trunk (z = -3.7)
    const supplyStub = new THREE.Mesh(sharedGeoPool.box(0.92, 0.66, 1.48), ductMat);
    supplyStub.position.set(0.65, 0.68, 2.08);
    supplyStub.castShadow = true;
    ahuGrp.add(supplyStub);

    body.userData.inspect = {
      category: 'Genel Havalandırma (HVAC)',
      name: `Taze Hava Klima Santrali AHU-0${idx + 1}`,
      specs: '28.000 m³/saat · HEPA H13 Filtrasyon · Pozitif Basınçlandırma & Isı Geri Kazanım',
    };
    inspectables.push(body);
    roofTopProps.add(ahuGrp);
  });

  // 2) Interconnected Sheet-Metal Roof Supply & Exhaust Duct Network
  addRoofDuct(-12.5, -3.7, 13.2, -3.7, 0.88, 0.64, 6.14, false);
  addBoxGeoTo(roofTrimGeos, 23.5, 0.025, 0.72, -3.0, 5.475, -4.65);

  addRoofDuct(-12.5, -3.7, -12.5, 0.5, 0.7, 0.52, 6.08, true);
  addRoofDuct(-11.0, -7.9, -11.0, -9.8, 0.66, 0.52, 6.04, true);
  const mechExhNeck = new THREE.Mesh(sharedGeoPool.cyl(0.24, 0.24, 0.42, 12), materials.chrome);
  mechExhNeck.position.set(-11.0, 6.45, -9.8);
  const mechExhHat = new THREE.Mesh(sharedGeoPool.cone(0.48, 0.26, 14), materials.darkSteelTrim);
  mechExhHat.position.set(-11.0, 6.72, -9.8);
  roofTopProps.add(mechExhNeck, mechExhHat);

  addRoofDuct(-3.0, -3.7, -3.0, -1.2, 0.72, 0.54, 6.1, true);
  addRoofDuct(-1.5, -3.7, -1.5, 7.6, 0.62, 0.48, 6.06, true);
  addRoofDuct(5.0, -3.7, 5.0, -1.2, 0.72, 0.54, 6.1, true);
  addRoofDuct(5.5, -3.7, 5.5, 8.8, 0.58, 0.46, 6.06, true);
  addRoofDuct(13.2, -3.7, 13.2, 4.5, 0.68, 0.52, 6.08, true);
  const batExhCowl = new THREE.Mesh(sharedGeoPool.cyl(0.32, 0.36, 0.38, 14), materials.darkSteelTrim);
  batExhCowl.position.set(13.2, 6.48, 4.5);
  const batExhCap = new THREE.Mesh(sharedGeoPool.cone(0.56, 0.24, 14), materials.aluCladding);
  batExhCap.position.set(13.2, 6.76, 4.5);
  roofTopProps.add(batExhCowl, batExhCap);

  // Build merged roof ducts & flanges/stands (2 GPU draw calls instead of ~90)
  const mergedDuctMesh = new THREE.Mesh(mergeGeometries(roofDuctGeos, false), ductMat);
  mergedDuctMesh.castShadow = true;
  mergedDuctMesh.receiveShadow = true;
  const mergedDuctTrimMesh = new THREE.Mesh(mergeGeometries(roofTrimGeos, false), materials.darkSteelTrim);
  roofTopProps.add(mergedDuctMesh, mergedDuctTrimMesh);
  roofDuctGeos.forEach((g) => g.dispose());
  roofTrimGeos.forEach((g) => g.dispose());

  // Matching Interior Ceiling Supply/Return Diffusers directly beneath each Roof Curb (lift off with roofGroup)
  for (const [dx, dz] of [
    [-12.5, 0.5],
    [-11.0, -9.8],
    [-3.0, -1.2],
    [-1.5, 7.6],
    [5.0, -1.2],
    [5.5, 8.8],
    [13.2, -3.7],
    [13.2, 4.5],
  ]) {
    const diffFrame = new THREE.Mesh(sharedGeoPool.box(0.86, 0.05, 0.86), materials.darkSteelTrim);
    diffFrame.position.set(dx, 5.155, dz);
    const diffGrille = new THREE.Mesh(sharedGeoPool.box(0.72, 0.03, 0.72), hvacMat);
    diffGrille.position.set(dx, 5.14, dz);
    roofGroup.add(diffFrame, diffGrille);
  }

  // 3) ESE Lightning Protection & Faraday Roof Mesh System (Paratoner Sistemi - IEC 62305 / NF C 17-102)
  const cuMeshGeos = [];
  addBoxGeoTo(cuMeshGeos, 36.5, 0.025, 0.045, 0, 5.99, -13.15);
  addBoxGeoTo(cuMeshGeos, 36.5, 0.025, 0.045, 0, 5.99, 13.15);
  addBoxGeoTo(cuMeshGeos, 0.045, 0.025, 26.3, -18.2, 5.99, 0);
  addBoxGeoTo(cuMeshGeos, 0.045, 0.025, 26.3, 18.2, 5.99, 0);
  addBoxGeoTo(cuMeshGeos, 36.4, 0.02, 0.04, 0, 5.48, -1.5);
  addBoxGeoTo(cuMeshGeos, 0.04, 0.02, 26.3, -11.5, 5.48, 0);
  addBoxGeoTo(cuMeshGeos, 0.04, 0.02, 26.3, 8.5, 5.48, 0);
  const mergedCuGrid = new THREE.Mesh(mergeGeometries(cuMeshGeos, false), materials.copperBus);
  roofTopProps.add(mergedCuGrid);
  cuMeshGeos.forEach((g) => g.dispose());

  // Two High-Mast ESE Active Lightning Rods (x = -11.5 & +8.5, z = -1.5 -> 5.4m tall above roof)
  [-11.5, 8.5].forEach((mx, mIdx) => {
    const mastGrp = new THREE.Group();
    mastGrp.position.set(mx, 5.46, -1.5);

    const basePlate = new THREE.Mesh(sharedGeoPool.box(0.68, 0.06, 0.68), materials.darkSteelTrim);
    basePlate.position.y = 0.03;
    const poleLower = new THREE.Mesh(sharedGeoPool.cyl(0.055, 0.075, 2.8, 12), materials.chrome);
    poleLower.position.y = 1.43;
    poleLower.castShadow = true;
    const poleUpper = new THREE.Mesh(sharedGeoPool.cyl(0.035, 0.052, 2.3, 12), materials.chrome);
    poleUpper.position.y = 3.96;
    poleUpper.castShadow = true;
    mastGrp.add(basePlate, poleLower, poleUpper);

    for (let k = 0; k < 3; k++) {
      const ang = (k * Math.PI * 2) / 3;
      const brace = new THREE.Mesh(sharedGeoPool.cyl(0.018, 0.018, 1.35, 8), materials.darkSteelTrim);
      brace.position.set(Math.cos(ang) * 0.24, 0.65, Math.sin(ang) * 0.24);
      brace.rotation.z = -Math.cos(ang) * 0.34;
      brace.rotation.x = Math.sin(ang) * 0.34;
      mastGrp.add(brace);
    }

    const eseSphere = new THREE.Mesh(sharedGeoPool.cyl(0.11, 0.08, 0.26, 14), materials.copperBus);
    eseSphere.position.y = 5.22;
    const spire = new THREE.Mesh(sharedGeoPool.cone(0.032, 0.65, 10), materials.copperBus);
    spire.position.y = 5.66;
    const redWarningBeacon = new THREE.Mesh(sharedGeoPool.sphere(0.065, 10, 8), materials.fireRed);
    redWarningBeacon.position.set(0.16, 4.92, 0);
    const beaconArm = new THREE.Mesh(sharedGeoPool.box(0.16, 0.025, 0.025), materials.darkSteelTrim);
    beaconArm.position.set(0.08, 4.86, 0);

    const cuStrap = new THREE.Mesh(sharedGeoPool.box(0.05, 5.1, 0.025), materials.copperBus);
    cuStrap.position.set(-0.07, 2.55, 0);
    const mastSign = new THREE.Mesh(
      sharedGeoPool.plane(0.62, 0.16),
      new THREE.MeshBasicMaterial({
        map: createSignTexture(`PARATONER PT-0${mIdx + 1}`, 'ESE AKTİF · <2 Ω', '#eab308'),
      })
    );
    mastSign.position.set(0, 1.25, 0.08);
    mastGrp.add(eseSphere, spire, redWarningBeacon, beaconArm, cuStrap, mastSign);

    poleLower.userData.inspect = {
      category: 'Yıldırımdan Korunma (Paratoner)',
      name: `Aktif ESE Paratoner Direği PT-0${mIdx + 1}`,
      specs: 'IEC 62305 Seviye I · 45 m Koruma Yarıçapı · Bakır Faraday Çatı Ağı · <2 Ω Topraklama',
    };
    inspectables.push(poleLower);
    roofTopProps.add(mastGrp);
  });

  // Exterior Grounding Downconductors & Earth Test Clamps on West & East Facades (dcGroup so they stay grounded if roof is cut away)
  for (const gx of [-18.14, 18.14]) {
    const downLead = new THREE.Mesh(sharedGeoPool.box(0.04, 5.28, 0.06), materials.copperBus);
    downLead.position.set(gx, 2.82, -1.5);
    const testBox = new THREE.Mesh(sharedGeoPool.box(0.14, 0.34, 0.24), materials.generatorYellow);
    testBox.position.set(gx + (gx < 0 ? -0.04 : 0.04), 1.35, -1.5);
    dcGroup.add(downLead, testBox);
  }

  const roofLobbySkylight = new THREE.Mesh(sharedGeoPool.box(7.0, 0.16, 4.0), materials.archGlass);
  roofLobbySkylight.position.set(-11.5, 5.48, 9.0);
  roofGroup.add(roofLobbySkylight);

  dcGroup.add(roofGroup);
  scene.add(dcGroup);

  const updateLeds = cabinetFactory.finalizeLedSystem(scene, placedCabinets, {
    precomputedLeds: serverBatch.pendingLeds,
  });

  // Partition strictly-interior room equipment & furniture into zoneGroups for Visibility Culling
  const zoneGroups = {
    lobby: new THREE.Group(),
    staging: new THREE.Group(),
    noc: new THREE.Group(),
    server: new THREE.Group(),
    power: new THREE.Group(),
    mech: new THREE.Group(),
  };
  const roomBounds = [
    { id: 'lobby', x1: -18, x2: -5, z1: 5, z2: 13 },
    { id: 'noc', x1: -18, x2: -7, z1: -5, z2: 5 },
    { id: 'mech', x1: -18, x2: -7, z1: -13, z2: -5 },
    { id: 'server', x1: -7, x2: 9, z1: -13, z2: 5 },
    { id: 'staging', x1: -5, x2: 9, z1: 5, z2: 13 },
    { id: 'power', x1: 9, x2: 18, z1: -13, z2: 13 },
  ];
  dcGroup.updateMatrixWorld(true);
  const tmpBox = new THREE.Box3();
  const childrenSnapshot = [...dcGroup.children];
  childrenSnapshot.forEach((child) => {
    if (child === roofGroup) return;
    tmpBox.setFromObject(child);
    if (tmpBox.isEmpty()) return;
    for (const r of roomBounds) {
      if (
        tmpBox.min.x >= r.x1 + 0.1 &&
        tmpBox.max.x <= r.x2 - 0.1 &&
        tmpBox.min.z >= r.z1 + 0.1 &&
        tmpBox.max.z <= r.z2 - 0.1
      ) {
        zoneGroups[r.id].add(child);
        break;
      }
    }
  });
  Object.entries(zoneGroups).forEach(([id, grp]) => {
    grp.name = `ZoneGroup_${id}`;
    dcGroup.add(grp);
  });

  return {
    dcGroup,
    roofGroup,
    roofTopProps,
    zoneGroups,
    nocWallManager,
    updateLeds,
  };
}
