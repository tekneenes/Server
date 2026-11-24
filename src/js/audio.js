// Procedural Spatial & Interactive Web Audio Engine (Zero external audio files)

export function createDataCenterAudio() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) {
    return {
      unlock() {},
      setMuted() {},
      isMuted: () => true,
      update() {},
      playInspectCue() {},
      dispose() {},
    };
  }

  let ctx = null;
  let masterGain = null;
  let pinkBuffer = null;
  let muted = false;
  let unlocked = false;
  let disposed = false;

  // Zone channel GainNodes + LFO wind modulation
  const ch = {};
  const stopNodes = [];

  // Track door states so opening cues fire cleanly without startup spam
  let prevDoorStates = null;
  const doorCooldowns = [];

  function buildPinkNoiseBuffer(audioCtx) {
    const sampleRate = audioCtx.sampleRate;
    const length = Math.floor(sampleRate * 4.0);
    const buffer = audioCtx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Paul Kellet's warm 7-tap pink noise filter
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    let b4 = 0;
    let b5 = 0;
    let b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      b6 = white * 0.115926;
      data[i] = Math.max(-0.9, Math.min(0.9, pink * 0.095));
    }
    return buffer;
  }

  function initGraph() {
    if (ctx || disposed) return;
    try {
      ctx = new AudioCtx();
    } catch {
      return;
    }

    masterGain = ctx.createGain();
    masterGain.gain.value = 0.0;
    masterGain.connect(ctx.destination);

    pinkBuffer = buildPinkNoiseBuffer(ctx);

    const makeLoopNoise = () => {
      const src = ctx.createBufferSource();
      src.buffer = pinkBuffer;
      src.loop = true;
      src.start(0, Math.random() * 2.5);
      stopNodes.push(src);
      return src;
    };

    // 1. Server Hall: Server fan array air-rush + CRAH plenum low airflow
    const srvSrc = makeLoopNoise();
    const srvBand = ctx.createBiquadFilter();
    srvBand.type = 'bandpass';
    srvBand.frequency.value = 590;
    srvBand.Q.value = 0.72;
    const srvPlenumSrc = makeLoopNoise();
    const srvLow = ctx.createBiquadFilter();
    srvLow.type = 'lowpass';
    srvLow.frequency.value = 145;
    ch.server = ctx.createGain();
    ch.server.gain.value = 0;
    srvSrc.connect(srvBand).connect(ch.server);
    srvPlenumSrc.connect(srvLow).connect(ch.server);
    ch.server.connect(masterGain);

    // 2. Power & UPS Room: Warm 50Hz / 100Hz / 150Hz inverter hum + cabinet fan airflow
    const pwrOsc50 = ctx.createOscillator();
    pwrOsc50.type = 'sine';
    pwrOsc50.frequency.value = 50;
    const pwrOsc100 = ctx.createOscillator();
    pwrOsc100.type = 'triangle';
    pwrOsc100.frequency.value = 100;
    const pwrHumFilter = ctx.createBiquadFilter();
    pwrHumFilter.type = 'lowpass';
    pwrHumFilter.frequency.value = 210;
    const pwrG50 = ctx.createGain();
    pwrG50.gain.value = 0.16;
    const pwrG100 = ctx.createGain();
    pwrG100.gain.value = 0.045;
    const pwrFanSrc = makeLoopNoise();
    const pwrFanFilt = ctx.createBiquadFilter();
    pwrFanFilt.type = 'bandpass';
    pwrFanFilt.frequency.value = 410;
    pwrFanFilt.Q.value = 1.0;
    const pwrFanGain = ctx.createGain();
    pwrFanGain.gain.value = 0.35;
    ch.power = ctx.createGain();
    ch.power.gain.value = 0;
    pwrOsc50.connect(pwrG50).connect(pwrHumFilter).connect(ch.power);
    pwrOsc100.connect(pwrG100).connect(pwrHumFilter);
    pwrFanSrc.connect(pwrFanFilt).connect(pwrFanGain).connect(ch.power);
    ch.power.connect(masterGain);
    pwrOsc50.start();
    pwrOsc100.start();
    stopNodes.push(pwrOsc50, pwrOsc100);

    // 3. Mechanical / Cooling Room: Chilled-water pipe rush + 44Hz/88Hz VFD pump hum
    const mechWaterSrc = makeLoopNoise();
    const mechWaterBand = ctx.createBiquadFilter();
    mechWaterBand.type = 'bandpass';
    mechWaterBand.frequency.value = 310;
    mechWaterBand.Q.value = 1.45;
    const pumpOsc44 = ctx.createOscillator();
    pumpOsc44.type = 'sine';
    pumpOsc44.frequency.value = 44;
    const pumpOsc88 = ctx.createOscillator();
    pumpOsc88.type = 'sine';
    pumpOsc88.frequency.value = 88;
    const pumpLow = ctx.createBiquadFilter();
    pumpLow.type = 'lowpass';
    pumpLow.frequency.value = 160;
    const pumpGain = ctx.createGain();
    pumpGain.gain.value = 0.11;
    ch.mech = ctx.createGain();
    ch.mech.gain.value = 0;
    mechWaterSrc.connect(mechWaterBand).connect(ch.mech);
    pumpOsc44.connect(pumpGain).connect(pumpLow).connect(ch.mech);
    pumpOsc88.connect(pumpGain);
    ch.mech.connect(masterGain);
    pumpOsc44.start();
    pumpOsc88.start();
    stopNodes.push(pumpOsc44, pumpOsc88);

    // 4. Security & Hardware Staging: Subtle HVAC & X-Ray conveyor electronic whisper
    const stgSrc = makeLoopNoise();
    const stgLow = ctx.createBiquadFilter();
    stgLow.type = 'lowpass';
    stgLow.frequency.value = 350;
    ch.staging = ctx.createGain();
    ch.staging.gain.value = 0;
    stgSrc.connect(stgLow).connect(ch.staging);
    ch.staging.connect(masterGain);

    // 5. Lobby & NOC: Quiet acoustically damped room ventilation
    const quietSrc = makeLoopNoise();
    const quietLow = ctx.createBiquadFilter();
    quietLow.type = 'lowpass';
    quietLow.frequency.value = 260;
    ch.quiet = ctx.createGain();
    ch.quiet.gain.value = 0;
    quietSrc.connect(quietLow).connect(ch.quiet);
    ch.quiet.connect(masterGain);

    // 6. Outdoor Ambient Breeze (gentle LFO modulated air)
    const outSrc = makeLoopNoise();
    const outLow = ctx.createBiquadFilter();
    outLow.type = 'lowpass';
    outLow.frequency.value = 230;
    const outLfo = ctx.createOscillator();
    outLfo.type = 'sine';
    outLfo.frequency.value = 0.12;
    const outLfoDepth = ctx.createGain();
    outLfoDepth.gain.value = 65;
    outLfo.connect(outLfoDepth).connect(outLow.frequency);
    ch.outdoor = ctx.createGain();
    ch.outdoor.gain.value = 0;
    outSrc.connect(outLow).connect(ch.outdoor);
    ch.outdoor.connect(masterGain);
    outLfo.start();
    stopNodes.push(outLfo);

    // 7. Outdoor Chiller Fan Yard (low airy fan rush near North yard)
    const chYardSrc = makeLoopNoise();
    const chYardBand = ctx.createBiquadFilter();
    chYardBand.type = 'bandpass';
    chYardBand.frequency.value = 185;
    chYardBand.Q.value = 0.9;
    ch.chillerYard = ctx.createGain();
    ch.chillerYard.gain.value = 0;
    chYardSrc.connect(chYardBand).connect(ch.chillerYard);
    ch.chillerYard.connect(masterGain);

    // 8. Outdoor Generator & Transformer Yard (60Hz/120Hz hum near East yard)
    const genOsc = ctx.createOscillator();
    genOsc.type = 'sawtooth';
    genOsc.frequency.value = 58;
    const genLow = ctx.createBiquadFilter();
    genLow.type = 'lowpass';
    genLow.frequency.value = 140;
    const genOscGain = ctx.createGain();
    genOscGain.gain.value = 0.14;
    ch.genYard = ctx.createGain();
    ch.genYard.gain.value = 0;
    genOsc.connect(genOscGain).connect(genLow).connect(ch.genYard);
    ch.genYard.connect(masterGain);
    genOsc.start();
    stopNodes.push(genOsc);
  }

  function unlock(onReady) {
    if (disposed) return;
    if (!ctx) initGraph();
    if (!ctx) return;
    const applyReady = () => {
      if (disposed || !ctx) return;
      if (ctx.state === 'running') {
        unlocked = true;
        if (masterGain) {
          masterGain.gain.setTargetAtTime(muted ? 0.0 : 0.42, ctx.currentTime, 0.12);
        }
        onReady?.();
      }
    };
    if (ctx.state === 'suspended') {
      ctx.resume().then(applyReady).catch(() => {});
    } else {
      applyReady();
    }
  }

  function setMuted(nextMuted) {
    muted = Boolean(nextMuted);
    if (!muted && !unlocked) {
      unlock();
    }
    if (ctx && masterGain) {
      masterGain.gain.setTargetAtTime(muted ? 0.0 : 0.42, ctx.currentTime, 0.08);
    }
  }

  function playDoorTransition(isCapsule = false) {
    if (!ctx || !unlocked || muted || ctx.state !== 'running') return;
    const now = ctx.currentTime;

    // Subtle pneumatic glass-slide whoosh
    if (pinkBuffer) {
      const src = ctx.createBufferSource();
      src.buffer = pinkBuffer;
      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.setValueAtTime(680, now);
      band.frequency.exponentialRampToValueAtTime(340, now + 0.18);
      band.Q.value = 1.6;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.001, now);
      g.gain.linearRampToValueAtTime(0.08, now + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      src.connect(band).connect(g).connect(masterGain);
      src.start(now, Math.random() * 1.5, 0.24);
    }

    // Two-tone biometric verified chime for Mantrap / Security Capsules
    if (isCapsule) {
      for (const [delay, freq] of [
        [0.01, 784],
        [0.085, 1175],
      ]) {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.001, now + delay);
        g.gain.linearRampToValueAtTime(0.055, now + delay + 0.012);
        g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.11);
        osc.connect(g).connect(masterGain);
        osc.start(now + delay);
        osc.stop(now + delay + 0.12);
      }
    }
  }

  function playInspectCue() {
    if (!ctx || !unlocked || muted || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1245, now + 0.055);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.045, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(g).connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  function update(dt, { camX, camY, camZ, zoneKey, doors }) {
    if (!ctx || !unlocked || muted || ctx.state !== 'running') return;
    const now = ctx.currentTime;
    const inside = zoneKey !== null && camY < 5.2;

    // Height attenuation factor when zoomed high in Orbit / Flyover
    const altAtten = camY > 6 ? Math.max(0.28, 1 - (camY - 6) / 36) : 1.0;

    // Smooth target gains per room
    const tServer = inside && zoneKey === 'server' ? 0.34 : inside && zoneKey === 'noc' ? 0.05 : 0.0;
    const tPower = inside && zoneKey === 'power' ? 0.28 : 0.0;
    const tMech = inside && zoneKey === 'mech' ? 0.3 : 0.0;
    const tStaging = inside && zoneKey === 'staging' ? 0.16 : 0.0;
    const tQuiet = inside && (zoneKey === 'lobby' || zoneKey === 'noc') ? 0.12 : 0.0;
    const tOutdoor = inside ? 0.015 : 0.18 * altAtten;

    // Proximity to exterior Chiller Yard (-3.5, -17.5) & Generator/Trafo Yard (21.5, -7.0)
    const distChiller = Math.hypot(camX + 3.5, camZ + 17.5);
    const distGen = Math.hypot(camX - 21.5, camZ + 7.0);
    const tChYard = inside ? 0.0 : Math.max(0, 1 - distChiller / 26) * 0.26 * altAtten;
    const tGenYard = inside ? 0.0 : Math.max(0, 1 - distGen / 26) * 0.22 * altAtten;

    const tau = 0.22;
    ch.server.gain.setTargetAtTime(tServer, now, tau);
    ch.power.gain.setTargetAtTime(tPower, now, tau);
    ch.mech.gain.setTargetAtTime(tMech, now, tau);
    ch.staging.gain.setTargetAtTime(tStaging, now, tau);
    ch.quiet.gain.setTargetAtTime(tQuiet, now, tau);
    ch.outdoor.gain.setTargetAtTime(tOutdoor, now, tau);
    ch.chillerYard.gain.setTargetAtTime(tChYard, now, tau);
    ch.genYard.gain.setTargetAtTime(tGenYard, now, tau);

    // Edge-trigger door / security capsule opening cues
    if (Array.isArray(doors)) {
      if (!prevDoorStates) {
        prevDoorStates = doors.map((d) => d.openAmount > 0.06);
        for (let i = 0; i < doors.length; i++) doorCooldowns[i] = 0;
      } else {
        for (let i = 0; i < doors.length; i++) {
          if (doorCooldowns[i] > 0) doorCooldowns[i] -= dt;
          const d = doors[i];
          const isOpen = d.openAmount > 0.06;
          if (isOpen && !prevDoorStates[i] && doorCooldowns[i] <= 0) {
            const distSq = (camX - d.x) * (camX - d.x) + (camZ - d.z) * (camZ - d.z);
            if (distSq < 20 && camY < 6.0) {
              const isSecurityPortal =
                (Math.abs(d.x - 1.2) < 0.7 && Math.abs(d.z - 5.0) < 0.4) ||
                (Math.abs(d.x + 5.0) < 0.4 && Math.abs(d.z - 9.1) < 0.4);
              playDoorTransition(isSecurityPortal);
              doorCooldowns[i] = 1.8;
            }
          }
          if (d.openAmount < 0.03) {
            prevDoorStates[i] = false;
          } else if (isOpen) {
            prevDoorStates[i] = true;
          }
        }
      }
    }
  }

  function dispose() {
    disposed = true;
    stopNodes.forEach((n) => {
      try {
        n.stop();
      } catch {
        // Ignore already-stopped nodes
      }
    });
    stopNodes.length = 0;
    if (ctx && ctx.state !== 'closed') {
      ctx.close().catch(() => {});
    }
    ctx = null;
  }

  return {
    unlock,
    setMuted,
    isMuted: () => muted,
    update,
    playInspectCue,
    dispose,
  };
}
