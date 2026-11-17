import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _move = new THREE.Vector3();
const _rayMouse = new THREE.Vector2();
const _lookDir = new THREE.Vector3();

export const CAMERA_PRESETS = {
  campus: {
    pos: new THREE.Vector3(-28, 20, 34),
    target: new THREE.Vector3(0, 1.5, 0),
    walkPos: new THREE.Vector3(-11.5, 1.75, 19.5),
    walkYaw: 0,
  },
  lobby: {
    pos: new THREE.Vector3(-15.5, 3.2, 11.8),
    target: new THREE.Vector3(-9.5, 1.6, 7.0),
    walkPos: new THREE.Vector3(-11.5, 1.88, 10.6),
    walkYaw: 0.25,
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
}) {
  const orbit = new OrbitControls(camera, domElement);
  orbit.enableDamping = !isSoftwareGl;
  orbit.dampingFactor = 0.07;
  orbit.maxPolarAngle = Math.PI / 2 - 0.02;
  orbit.minDistance = 2.0;
  orbit.maxDistance = 95.0;
  orbit.target.copy(CAMERA_PRESETS.campus.target);

  let mode = 'orbit'; // 'orbit' | 'walk'
  let flight = null; // { pos: Vector3, target: Vector3 }

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

  function setMode(nextMode) {
    if (mode === nextMode) return;
    mode = nextMode;
    flight = null;

    if (mode === 'walk') {
      orbit.enabled = false;
      // If camera was high up in aerial orbit, drop smoothly to lobby entrance or current XY ground
      const inside =
        camera.position.x > -18 &&
        camera.position.x < 18 &&
        camera.position.z > -13 &&
        camera.position.z < 13 &&
        camera.position.y < 6;
      if (!inside) {
        camera.position.copy(CAMERA_PRESETS.lobby.walkPos);
        yaw = 0;
        pitch = -0.02;
      } else {
        camera.position.y = 1.88;
        camera.getWorldDirection(_lookDir);
        yaw = Math.atan2(-_lookDir.x, -_lookDir.z);
        pitch = THREE.MathUtils.clamp(Math.asin(THREE.MathUtils.clamp(_lookDir.y, -0.9, 0.9)), -1.1, 1.1);
      }
      applyWalkRotation();
    } else {
      if (document.pointerLockElement === domElement) {
        document.exitPointerLock?.();
      }
      orbit.enabled = true;
      camera.getWorldDirection(_lookDir);
      orbit.target.copy(camera.position).addScaledVector(_lookDir, 6);
      orbit.target.y = Math.max(0.5, orbit.target.y);
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

  // Input listeners
  const onKeyDown = (e) => {
    keys[e.code] = true;
  };
  const onKeyUp = (e) => {
    keys[e.code] = false;
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
      if (hits.length > 0) {
        const hitObj = hits[0].object;
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
      const offset = THREE.MathUtils.lerp(door.closedOffset, door.openOffset, door.openAmount);
      if (door.axis === 'x') {
        door.leafA.position.x = -offset;
        door.leafB.position.x = offset;
      } else {
        door.leafA.position.z = -offset;
        door.leafB.position.z = offset;
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
    orbit.dispose();
  }

  return {
    getMode: () => mode,
    setMode,
    flyToPreset,
    teleportToPoint,
    setTouchDirection,
    update,
    dispose,
  };
}
