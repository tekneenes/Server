import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const _ledColor = new THREE.Color();
const _tempPos = new THREE.Vector3();
const _tempQuat = new THREE.Quaternion();
const _tempScale = new THREE.Vector3(1, 1, 1);
const _tempMat = new THREE.Matrix4();

const CHASSIS_WIDTH = 0.74;

function createCanvasTex(w, h, drawFn, { srgb = true, repeatX = 1, repeatY = 1, scale } = {}) {
    const texScale = scale ?? (w >= 1024 ? 0.5 : 1);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * texScale));
    canvas.height = Math.max(1, Math.round(h * texScale));
    const ctx = canvas.getContext('2d');
    if (texScale !== 1) ctx.scale(texScale, texScale);
    drawFn(ctx, w, h);
    const tex = new THREE.CanvasTexture(canvas);
    if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
    if (repeatX !== 1 || repeatY !== 1) {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(repeatX, repeatY);
    }
    tex.anisotropy = 4;
    tex.needsUpdate = true;
    return tex;
}

function buildMergedGeo(parts) {
    if (!parts || parts.length === 0) return null;
    const normalized = parts.map((g) => (g.index ? g.toNonIndexed() : g));
    const merged = mergeGeometries(normalized, false);
    parts.forEach((g) => g.dispose());
    normalized.forEach((g) => {
        if (!parts.includes(g)) g.dispose();
    });
    return merged;
}

/**
 * Converts texture pixel coordinates (px, py) on a front faceplate into local
 * 3D coordinates relative to the unit's center (0, 0, 0).
 */
function texPxToLocal(px, py, texW, texH, unitH) {
    return {
        x: (px / texW - 0.5) * CHASSIS_WIDTH,
        y: (0.5 - py / texH) * unitH,
    };
}

// ============================================================================
// HIGH-DETAIL FACEPLATE TEXTURE & PORT LAYOUT GENERATORS
// ============================================================================

function createPerforatedMeshTexture(repeatX = 9, repeatY = 24) {
    return createCanvasTex(128, 128, (ctx, w, h) => {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = '#141b25';
        ctx.fillRect(0, 0, w, h);

        // High-airflow hexagonal honeycomb perforation (~70% open area) so internal
        // server drive caddies, OLEDs, and LEDs read crisply through the door
        ctx.globalCompositeOperation = 'destination-out';
        const stepX = 16;
        const stepY = 14;
        const r = 6.3;
        for (let row = -1; row < Math.ceil(h / stepY) + 2; row++) {
            for (let col = -1; col < Math.ceil(w / stepX) + 2; col++) {
                const cx = col * stepX + (row % 2 === 0 ? 0 : stepX / 2);
                const cy = row * stepY;
                ctx.beginPath();
                for (let k = 0; k < 6; k++) {
                    const ang = (Math.PI / 3) * k + Math.PI / 6;
                    const vx = cx + Math.cos(ang) * r;
                    const vy = cy + Math.sin(ang) * r;
                    if (k === 0) ctx.moveTo(vx, vy);
                    else ctx.lineTo(vx, vy);
                }
                ctx.closePath();
                ctx.fill();
            }
        }
        ctx.globalCompositeOperation = 'source-over';
    }, { repeatX, repeatY });
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

function drawRackEars(ctx, w, h, earW = 24) {
    ctx.fillStyle = '#293548';
    ctx.fillRect(0, 0, earW, h);
    ctx.fillRect(w - earW, 0, earW, h);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0.5, 0.5, earW - 1, h - 1);
    ctx.strokeRect(w - earW + 0.5, 0.5, earW - 1, h - 1);

    // Silver M6 mounting screws
    ctx.fillStyle = '#cbd5e1';
    const screwYs = h > 160 ? [22, h / 2, h - 22] : [22, h - 22];
    for (const sx of [earW / 2, w - earW / 2]) {
        for (const sy of screwYs) {
            ctx.beginPath();
            ctx.arc(sx, sy, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(sx - 2.5, sy);
            ctx.lineTo(sx + 2.5, sy);
            ctx.stroke();
        }
    }
}

function drawPortSocket(ctx, x, y, pw, ph, { isQsfp = false, hasGoldPins = true } = {}) {
    // Metallic outer cage shield
    ctx.fillStyle = '#475569';
    ctx.fillRect(x, y, pw, ph);
    // Inner recessed port cavity
    ctx.fillStyle = '#05080f';
    ctx.fillRect(x + 2, y + 2, pw - 4, ph - 4);

    if (isQsfp) {
        // Optical QSFP28 cage internal divider & pull latch guide
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x + 4, y + ph - 6, pw - 8, 3);
    } else if (hasGoldPins) {
        // Tiny RJ45 gold contact pins along top of socket
        ctx.fillStyle = '#d97706';
        const pinCount = 4;
        const step = (pw - 8) / pinCount;
        for (let p = 0; p < pinCount; p++) {
            ctx.fillRect(x + 4 + p * step, y + 3, Math.max(1.5, step - 2), 4);
        }
    }
}

/**
 * Builds 1U 48-Port 25G/10G Switch Faceplate (1024x128) AND returns exact port descriptors
 * so 3D cable boots, patch cords, and above-port LEDs align to sub-millimeter accuracy.
 */
function createSwitch1UAsset(unitH = 0.082) {
    const W = 1024;
    const H = 128;
    const ports = [];

    const tex = createCanvasTex(W, H, (ctx) => {
        ctx.fillStyle = '#182230';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.strokeRect(24, 1, W - 48, H - 2);
        drawRackEars(ctx, W, H, 24);

        // Left management & telemetry section (x: 30..158)
        ctx.fillStyle = '#0b1420';
        ctx.fillRect(32, 10, 126, H - 20);
        ctx.strokeStyle = '#1e3a5f';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(32, 10, 126, H - 20);

        // Brand stripe & model badge
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(32, 10, 126, 22);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 13px monospace';
        ctx.fillText('NEXUS 48P-25G', 38, 25);

        // System status LEDs (SYS, ACT, PWR, FAN)
        const sysLabels = ['SYS', 'ACT', 'PWR', 'FAN'];
        sysLabels.forEach((lbl, idx) => {
            const ly = 45 + idx * 17;
            ctx.fillStyle = idx === 1 ? '#38bdf8' : '#22c55e';
            ctx.fillRect(40, ly, 8, 6);
            ctx.fillStyle = '#94a3b8';
            ctx.font = 'bold 10px monospace';
            ctx.fillText(lbl, 52, ly + 6);
        });

        // Console + MGMT RJ45 + USB service ports
        drawPortSocket(ctx, 88, 46, 24, 24, { isQsfp: false, hasGoldPins: true });
        drawPortSocket(ctx, 118, 46, 24, 24, { isQsfp: false, hasGoldPins: true });
        ctx.fillStyle = '#020617';
        ctx.fillRect(92, 82, 20, 12); // USB
        ctx.fillStyle = '#64748b';
        ctx.font = '9px monospace';
        ctx.fillText('CON  MGMT', 87, 108);

        // 48 Main Ports (24 cols x 2 rows in 4 blocks of 6)
        const rowConfigs = [
            { row: 0, ledY: 13, portY: 22, portH: 28 },
            { row: 1, ledY: 66, portY: 75, portH: 28 },
        ];

        for (let col = 0; col < 24; col++) {
            const px = 176 + col * 29 + Math.floor(col / 6) * 12;
            const pw = 23;
            const isCopperAccess = col < 12;

            for (const rc of rowConfigs) {
                // Tiny recessed LED window DIRECTLY ABOVE the port
                ctx.fillStyle = '#070c14';
                ctx.fillRect(px + 5, rc.ledY - 3, 13, 6);
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 1;
                ctx.strokeRect(px + 5, rc.ledY - 3, 13, 6);

                drawPortSocket(ctx, px, rc.portY, pw, rc.portH, {
                    isQsfp: !isCopperAccess,
                    hasGoldPins: isCopperAccess,
                });

                const cx = px + pw / 2;
                const cy = rc.portY + rc.portH / 2;
                const pLocal = texPxToLocal(cx, cy, W, H, unitH);
                const lLocal = texPxToLocal(cx, rc.ledY, W, H, unitH);
                ports.push({
                    idx: col * 2 + rc.row + 1,
                    col,
                    row: rc.row,
                    kind: isCopperAccess ? 'rj45' : 'sfp28',
                    portX: pLocal.x,
                    portY: pLocal.y,
                    ledX: lLocal.x,
                    ledY: lLocal.y,
                });
            }

            // Port numbers along bottom strip
            if (col % 2 === 0) {
                ctx.fillStyle = '#94a3b8';
                ctx.font = '9px monospace';
                ctx.fillText(String(col * 2 + 1).padStart(2, '0'), px + 2, 118);
            }
        }

        // Right 4x 100G QSFP28 Uplink Ports (2 cols x 2 rows)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(914, 6, 80, H - 12);
        ctx.strokeStyle = '#0284c7';
        ctx.strokeRect(914, 6, 80, H - 12);

        for (let ucol = 0; ucol < 2; ucol++) {
            const ux = 922 + ucol * 34;
            const uw = 28;
            for (const rc of rowConfigs) {
                ctx.fillStyle = '#070c14';
                ctx.fillRect(ux + 7, rc.ledY - 3, 14, 6);
                ctx.strokeStyle = '#38bdf8';
                ctx.strokeRect(ux + 7, rc.ledY - 3, 14, 6);

                drawPortSocket(ctx, ux, rc.portY, uw, rc.portH, { isQsfp: true, hasGoldPins: false });

                const cx = ux + uw / 2;
                const cy = rc.portY + rc.portH / 2;
                const pLocal = texPxToLocal(cx, cy, W, H, unitH);
                const lLocal = texPxToLocal(cx, rc.ledY, W, H, unitH);
                ports.push({
                    idx: 49 + ucol * 2 + rc.row,
                    col: 24 + ucol,
                    row: rc.row,
                    kind: 'qsfp28',
                    portX: pLocal.x,
                    portY: pLocal.y,
                    ledX: lLocal.x,
                    ledY: lLocal.y,
                });
            }
        }
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('100G QSFP28', 920, 118);
    });

    return { tex, ports };
}

/**
 * Builds 2U 36-Port 100G QSFP28 Spine/SAN Switch Faceplate (1024x192) & port coordinates.
 */
function createSwitch2UAsset(unitH = 0.165) {
    const W = 1024;
    const H = 192;
    const ports = [];

    const tex = createCanvasTex(W, H, (ctx) => {
        ctx.fillStyle = '#131c29';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(24, 2, W - 48, H - 4);
        drawRackEars(ctx, W, H, 24);

        // Left control LCD & airflow grille
        ctx.fillStyle = '#09111b';
        ctx.fillRect(34, 14, 136, H - 28);
        ctx.strokeStyle = '#334155';
        ctx.strokeRect(34, 14, 136, H - 28);

        ctx.fillStyle = '#0c4a6e';
        ctx.fillRect(42, 22, 120, 42);
        ctx.fillStyle = '#e0f2fe';
        ctx.font = 'bold 15px monospace';
        ctx.fillText('SPINE-100G', 50, 42);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '11px monospace';
        ctx.fillText('36x QSFP28 · OK', 48, 58);

        // Status LED indicators on left block
        ['SYS', 'FAN', 'PS1', 'PS2'].forEach((lbl, idx) => {
            const lx = 44 + (idx % 2) * 58;
            const ly = 80 + Math.floor(idx / 2) * 20;
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(lx, ly, 10, 7);
            ctx.fillStyle = '#cbd5e1';
            ctx.font = '10px monospace';
            ctx.fillText(lbl, lx + 14, ly + 7);
        });

        // Bottom vent slots
        ctx.fillStyle = '#05080f';
        for (let vx = 42; vx < 160; vx += 10) {
            ctx.fillRect(vx, 126, 6, 40);
        }

        // 18 cols x 2 rows = 36 QSFP28 optical cages in 3 blocks of 6
        const rowConfigs = [
            { row: 0, ledY: 22, portY: 34, portH: 48 },
            { row: 1, ledY: 102, portY: 114, portH: 48 },
        ];

        for (let col = 0; col < 18; col++) {
            const px = 190 + col * 42 + Math.floor(col / 6) * 18;
            const pw = 34;

            for (const rc of rowConfigs) {
                ctx.fillStyle = '#070c14';
                ctx.fillRect(px + 9, rc.ledY - 4, 16, 8);
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 1;
                ctx.strokeRect(px + 9, rc.ledY - 4, 16, 8);

                drawPortSocket(ctx, px, rc.portY, pw, rc.portH, { isQsfp: true, hasGoldPins: false });

                const cx = px + pw / 2;
                const cy = rc.portY + rc.portH / 2;
                const pLocal = texPxToLocal(cx, cy, W, H, unitH);
                const lLocal = texPxToLocal(cx, rc.ledY, W, H, unitH);
                ports.push({
                    idx: col * 2 + rc.row + 1,
                    col,
                    row: rc.row,
                    kind: 'qsfp28',
                    portX: pLocal.x,
                    portY: pLocal.y,
                    ledX: lLocal.x,
                    ledY: lLocal.y,
                });
            }

            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px monospace';
            ctx.fillText(String(col * 2 + 1).padStart(2, '0'), px + 8, 178);
        }
    });

    return { tex, ports };
}

/**
 * Builds 1U 48-Port Structured Patch Panel Faceplate (1024x128) & port coordinates.
 */
function createPatchPanel1UAsset(unitH = 0.082) {
    const W = 1024;
    const H = 128;
    const ports = [];

    const tex = createCanvasTex(W, H, (ctx) => {
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.strokeRect(24, 1, W - 48, H - 2);
        drawRackEars(ctx, W, H, 24);

        // Left patch panel label strip
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(32, 12, 118, H - 24);
        ctx.fillStyle = '#22d3ee';
        ctx.fillRect(32, 12, 6, H - 24);
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('PATCH 48P', 46, 46);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px monospace';
        ctx.fillText('OM4 / CAT6A', 46, 68);
        ctx.fillText('IDF-TRUNK', 46, 88);

        // White printable label bars above rows
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(168, 8, 818, 13);
        ctx.fillRect(168, 64, 818, 13);

        const rowConfigs = [
            { row: 0, portY: 24, portH: 32, labelY: 18 },
            { row: 1, portY: 80, portH: 32, labelY: 74 },
        ];

        for (let col = 0; col < 24; col++) {
            const px = 176 + col * 32 + Math.floor(col / 6) * 16;
            const pw = 24;
            for (const rc of rowConfigs) {
                drawPortSocket(ctx, px, rc.portY, pw, rc.portH, {
                    isQsfp: col >= 12,
                    hasGoldPins: col < 12,
                });
                ctx.fillStyle = '#0f172a';
                ctx.font = 'bold 9px monospace';
                ctx.fillText(String(col * 2 + rc.row + 1).padStart(2, '0'), px + 5, rc.labelY);

                const cx = px + pw / 2;
                const cy = rc.portY + rc.portH / 2;
                const pLocal = texPxToLocal(cx, cy, W, H, unitH);
                ports.push({
                    idx: col * 2 + rc.row + 1,
                    col,
                    row: rc.row,
                    kind: col < 12 ? 'rj45' : 'sfp28',
                    portX: pLocal.x,
                    portY: pLocal.y,
                });
            }
        }
    });

    return { tex, ports };
}

/**
 * Builds 1U Horizontal Brush & Finger-Duct Cable Manager texture (1024x96).
 */
function createBrushManagerTexture() {
    return createCanvasTex(1024, 96, (ctx, w, h) => {
        ctx.fillStyle = '#18202c';
        ctx.fillRect(0, 0, w, h);
        drawRackEars(ctx, w, h, 24);

        // Brush slot cavity
        ctx.fillStyle = '#05070b';
        ctx.fillRect(36, 16, w - 72, h - 32);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.strokeRect(36, 16, w - 72, h - 32);

        // Dense nylon brush bristle striations
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2;
        for (let x = 40; x < w - 40; x += 5) {
            ctx.beginPath();
            ctx.moveTo(x, 18);
            ctx.lineTo(x, h - 18);
            ctx.stroke();
        }

        // Center pass-through grommet divider bars
        ctx.fillStyle = '#334155';
        for (let dx = 220; dx < w - 120; dx += 200) {
            ctx.fillRect(dx, 14, 10, h - 28);
        }
    });
}

/**
 * Builds 8U Modular Core Spine Switch Chassis (1024x512) with 6 Line Cards & exact port layout.
 */
function createCoreChassisAsset(unitH = 0.62) {
    const W = 1024;
    const H = 512;
    const lineCards = [];

    const tex = createCanvasTex(W, H, (ctx) => {
        ctx.fillStyle = '#0c1320';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, W - 4, H - 4);

        // Top Supervisor / Route-Processor Module (y: 8..44)
        ctx.fillStyle = '#162233';
        ctx.fillRect(16, 8, W - 32, 36);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(16, 8, W - 32, 36);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(22, 14, 12, 24);
        ctx.fillRect(W - 34, 14, 12, 24);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('CORE-SPINE-9508 · SUP-01A / FAB-400G', 48, 31);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(460, 20, 14, 10);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(486, 20, 14, 10);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px monospace';
        ctx.fillText('ACT  SYNC  FAB-OK', 508, 30);

        // 6 High-Density 32-Port QSFP28 Line Cards
        for (let card = 0; card < 6; card++) {
            const cardTop = 52 + card * 72;
            const cardH = 66;
            const ports = [];

            ctx.fillStyle = card % 2 === 0 ? '#172232' : '#1b2738';
            ctx.fillRect(16, cardTop, W - 32, cardH);
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(16, cardTop, W - 32, cardH);

            // Left & Right anodized blue ejector levers
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(22, cardTop + 8, 12, cardH - 16);
            ctx.fillRect(W - 34, cardTop + 8, 12, cardH - 16);

            // Line Card ID badge
            ctx.fillStyle = '#0b121c';
            ctx.fillRect(42, cardTop + 8, 78, cardH - 16);
            ctx.fillStyle = '#38bdf8';
            ctx.font = 'bold 13px monospace';
            ctx.fillText(`LC-0${card + 1}`, 48, cardTop + 28);
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px monospace';
            ctx.fillText('32×100G', 48, cardTop + 44);
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(48, cardTop + 50, 10, 4);

            // 16 cols x 2 rows = 32 QSFP28 optical cages in 4 blocks of 4
            const rowConfigs = [
                { row: 0, ledY: cardTop + 8, portY: cardTop + 14, portH: 19 },
                { row: 1, ledY: cardTop + 37, portY: cardTop + 43, portH: 19 },
            ];

            for (let col = 0; col < 16; col++) {
                const px = 136 + col * 48 + Math.floor(col / 4) * 18;
                const pw = 36;

                for (const rc of rowConfigs) {
                    ctx.fillStyle = '#070b12';
                    ctx.fillRect(px + 10, rc.ledY - 3, 16, 5);
                    ctx.strokeStyle = '#475569';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(px + 10, rc.ledY - 3, 16, 5);

                    drawPortSocket(ctx, px, rc.portY, pw, rc.portH, {
                        isQsfp: true,
                        hasGoldPins: false,
                    });

                    const cx = px + pw / 2;
                    const cy = rc.portY + rc.portH / 2;
                    const pLocal = texPxToLocal(cx, cy, W, H, unitH);
                    const lLocal = texPxToLocal(cx, rc.ledY, W, H, unitH);
                    ports.push({
                        idx: col * 2 + rc.row + 1,
                        col,
                        row: rc.row,
                        kind: 'qsfp28',
                        portX: pLocal.x,
                        portY: pLocal.y,
                        ledX: lLocal.x,
                        ledY: lLocal.y,
                    });
                }
            }

            lineCards.push({ card, ports });
        }

        // Bottom Power / Fan Telemetry Strip (y: 486..506)
        ctx.fillStyle = '#111827';
        ctx.fillRect(16, 486, W - 32, 18);
        ctx.fillStyle = '#22c55e';
        for (let px = 48; px < 420; px += 46) {
            ctx.fillRect(px, 491, 24, 8);
        }
        ctx.fillStyle = '#94a3b8';
        ctx.font = '11px monospace';
        ctx.fillText('PSU A/B/C/D ACTIVE · FAN TRAY 1-3 NOMINAL · 38°C', 460, 499);
    });

    return { tex, lineCards };
}

/**
 * Builds high-detail 1U / 2U Enterprise Compute Server Faceplate (NO switch ports!).
 * Includes NVMe hot-swap drive bays, perforated honeycomb airflow vents, OLED telemetry,
 * power/UID rack-ear buttons, and returns drive-bay + system-ear LED coordinates.
 */
function createComputeServerAsset(is2U = false, unitH = is2U ? 0.165 : 0.082) {
    const W = 1024;
    const H = is2U ? 192 : 128;
    const leds = [];

    const tex = createCanvasTex(W, H, (ctx) => {
        // Brushed slate-charcoal server bezel
        ctx.fillStyle = '#1b232e';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.strokeRect(26, 2, W - 52, H - 4);
        drawRackEars(ctx, W, H, 26);

        // Left Rack-Ear Health/Power + Blue UID Locator LEDs
        const pwrLocal = texPxToLocal(14, H * 0.34, W, H, unitH);
        const uidLocal = texPxToLocal(14, H * 0.66, W, H, unitH);
        leds.push({ x: pwrLocal.x, y: pwrLocal.y, role: 'srv_power' });
        leds.push({ x: uidLocal.x, y: uidLocal.y, role: 'srv_uid' });

        // NVMe Drive Bays (1U: 10 SFF bays, 2U: 2 rows x 12 SFF bays)
        const cols = is2U ? 12 : 10;
        const rows = is2U ? 2 : 1;
        const bayW = is2U ? 62 : 70;
        const bayGap = 6;
        const bayH = is2U ? 74 : 92;
        const startX = 40;

        for (let r = 0; r < rows; r++) {
            const by = is2U ? 16 + r * 84 : 18;
            for (let c = 0; c < cols; c++) {
                const bx = startX + c * (bayW + bayGap);

                // Dark recessed drive carrier frame
                ctx.fillStyle = '#090e16';
                ctx.fillRect(bx, by, bayW, bayH);
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(bx, by, bayW, bayH);

                // Brushed metallic perforated grille inside caddy
                ctx.fillStyle = '#1e293b';
                for (let vx = bx + 16; vx < bx + bayW - 6; vx += 8) {
                    for (let vy = by + 18; vy < by + bayH - 12; vy += 9) {
                        ctx.fillRect(vx, vy, 5, 5);
                    }
                }

                // Enterprise release latch (emerald/teal quick-release tab)
                ctx.fillStyle = is2U ? '#0ea5e9' : '#10b981';
                ctx.fillRect(bx + 4, by + 10, 8, bayH - 20);
                ctx.fillStyle = '#94a3b8';
                ctx.fillRect(bx + 15, by + 6, bayW - 20, 6);

                // Drive LED lens windows (top-right of caddy)
                ctx.fillStyle = '#020617';
                ctx.fillRect(bx + bayW - 18, by + 6, 12, 6);

                if (c % 2 === 0 || is2U) {
                    const dLed = texPxToLocal(bx + bayW - 12, by + 9, W, H, unitH);
                    leds.push({ x: dLed.x, y: dLed.y, role: 'srv_drive' });
                }
            }
        }

        // Right-Side System Airflow Grille + OLED Telemetry Panel + Pull-Out Asset Tag
        const panelX = startX + cols * (bayW + bayGap) + 8;
        const panelW = W - 34 - panelX;
        ctx.fillStyle = '#111827';
        ctx.fillRect(panelX, 12, panelW, H - 24);
        ctx.strokeStyle = '#475569';
        ctx.strokeRect(panelX, 12, panelW, H - 24);

        // OLED Mini Display
        ctx.fillStyle = '#042f2e';
        ctx.fillRect(panelX + 10, 20, panelW - 20, is2U ? 42 : 34);
        ctx.strokeStyle = '#14b8a6';
        ctx.strokeRect(panelX + 10, 20, panelW - 20, is2U ? 42 : 34);
        ctx.fillStyle = '#5eead4';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(is2U ? 'EPYC-2U OK' : 'XEON-1U OK', panelX + 16, 39);
        if (is2U) {
            ctx.fillStyle = '#99f6e4';
            ctx.font = '10px monospace';
            ctx.fillText('24×NVMe · 41°C', panelX + 16, 55);
        }

        // Front VGA / USB service port + pull-tab handle
        ctx.fillStyle = '#020617';
        ctx.fillRect(panelX + 12, H - 48, 28, 16);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(panelX + 48, H - 48, panelW - 60, 16);
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('SRV-TAG', panelX + 54, H - 37);
    });

    return { tex, leds };
}

/**
 * Builds 4U Multi-Node Blade / GPU AI Server Chassis (1024x256, height 0.34m)
 * — unmistakably a high-density server sled bank rather than network gear!
 */
function createGpuBlade4UAsset(unitH = 0.34) {
    const W = 1024;
    const H = 256;
    const leds = [];

    const tex = createCanvasTex(W, H, (ctx) => {
        ctx.fillStyle = '#161e29';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 3;
        ctx.strokeRect(26, 2, W - 52, H - 4);
        drawRackEars(ctx, W, H, 26);

        // 4 Vertical Half/Quarter-Width GPU Compute Sleds side by side
        const sledCount = 4;
        const sledW = 224;
        const gap = 12;
        const startX = 42;

        for (let s = 0; s < sledCount; s++) {
            const sx = startX + s * (sledW + gap);
            ctx.fillStyle = '#0f1621';
            ctx.fillRect(sx, 14, sledW, H - 28);
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2;
            ctx.strokeRect(sx, 14, sledW, H - 28);

            // Top sled badge & telemetry
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(sx + 6, 20, sledW - 12, 34);
            ctx.fillStyle = '#34d399';
            ctx.fillRect(sx + 6, 20, 6, 34);
            ctx.fillStyle = '#e2e8f0';
            ctx.font = 'bold 14px monospace';
            ctx.fillText(`NODE-BLADE 0${s + 1}`, sx + 18, 42);

            // Dense honeycomb GPU intake mesh
            ctx.fillStyle = '#253142';
            for (let gx = sx + 14; gx < sx + sledW - 16; gx += 12) {
                for (let gy = 64; gy < H - 72; gy += 12) {
                    ctx.beginPath();
                    ctx.arc(gx + 4, gy + 4, 3.6, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Bottom 4x E1.S / NVMe hot-swap slots per blade + silver pull handle
            for (let d = 0; d < 4; d++) {
                const dx = sx + 12 + d * 48;
                ctx.fillStyle = '#070b11';
                ctx.fillRect(dx, H - 62, 42, 36);
                ctx.fillStyle = '#0ea5e9';
                ctx.fillRect(dx + 4, H - 58, 34, 5);
            }

            // Silver cam-handle bar
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(sx + sledW - 22, 74, 10, 96);

            // Per-blade Health + Activity LEDs aligned to top of sled
            const hLed = texPxToLocal(sx + sledW - 36, 37, W, H, unitH);
            const aLed = texPxToLocal(sx + sledW - 18, 37, W, H, unitH);
            leds.push({ x: hLed.x, y: hLed.y, role: 'srv_power' });
            leds.push({ x: aLed.x, y: aLed.y, role: 'srv_drive' });
        }
    });

    return { tex, leds };
}

/**
 * Builds 4U High-Density SAN Storage Array (1024x256, 3x16 = 48 bays) with per-bay LEDs.
 */
function createStorageArray4UAsset(unitH = 0.34) {
    const W = 1024;
    const H = 256;
    const leds = [];

    const tex = createCanvasTex(W, H, (ctx) => {
        ctx.fillStyle = '#18202c';
        ctx.fillRect(0, 0, W, H);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.strokeRect(26, 2, W - 52, H - 4);
        drawRackEars(ctx, W, H, 26);

        // 3 rows x 16 high-density SAS/NVMe drives
        for (let r = 0; r < 3; r++) {
            const by = 18 + r * 76;
            for (let c = 0; c < 16; c++) {
                const bx = 42 + c * 59;
                ctx.fillStyle = '#090e15';
                ctx.fillRect(bx, by, 52, 64);
                ctx.strokeStyle = '#334155';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(bx, by, 52, 64);

                // Amber enterprise carrier latch
                ctx.fillStyle = '#d97706';
                ctx.fillRect(bx + 4, by + 6, 44, 9);

                // Cooling vent slits
                ctx.fillStyle = '#1e293b';
                for (let vy = by + 22; vy < by + 56; vy += 9) {
                    ctx.fillRect(bx + 8, vy, 36, 5);
                }

                // LED lens window top-right
                ctx.fillStyle = '#020617';
                ctx.fillRect(bx + 34, by + 50, 12, 7);

                if (c % 2 === 0) {
                    const dLed = texPxToLocal(bx + 40, by + 53, W, H, unitH);
                    leds.push({ x: dLed.x, y: dLed.y, role: 'str_drive' });
                }
            }
        }
    });

    return { tex, leds };
}

function createRearHardwareTexture() {
    return createCanvasTex(1024, 256, (ctx, w, h) => {
        ctx.fillStyle = '#18202c';
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, w - 4, h - 4);

        // Left & Right Hot-Swap Redundant PSUs
        for (const [idx, px] of [24, w - 188].entries()) {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(px, 24, 164, h - 48);
            ctx.strokeStyle = '#475569';
            ctx.strokeRect(px, 24, 164, h - 48);

            // Colored Feed A/B PSU handle
            ctx.fillStyle = idx === 0 ? '#dc2626' : '#2563eb';
            ctx.fillRect(px + 14, 48, 24, h - 96);

            // IEC C14 Power Inlet socket
            ctx.fillStyle = '#020617';
            ctx.fillRect(px + 66, 86, 68, 84);
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(px + 82, 114, 8, 24);
            ctx.fillRect(px + 96, 104, 8, 24);
            ctx.fillRect(px + 110, 114, 8, 24);
        }

        // Center 4x dual-rotor exhaust fans
        for (let f = 0; f < 4; f++) {
            const fx = 224 + f * 108;
            ctx.fillStyle = '#0b1118';
            ctx.beginPath();
            ctx.arc(fx + 44, h / 2, 44, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.strokeStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(fx + 44, h / 2, 22, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Rear Dual SFP28 OCP NIC + Dedicated iDRAC/IPMI Management RJ45
        ctx.fillStyle = '#0b121c';
        ctx.fillRect(664, 48, 150, h - 96);
        ctx.strokeStyle = '#38bdf8';
        ctx.strokeRect(664, 48, 150, h - 96);
        drawPortSocket(ctx, 680, 84, 34, 48, { isQsfp: true, hasGoldPins: false });
        drawPortSocket(ctx, 722, 84, 34, 48, { isQsfp: true, hasGoldPins: false });
        drawPortSocket(ctx, 766, 84, 34, 48, { isQsfp: false, hasGoldPins: true });
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 13px monospace';
        ctx.fillText('NIC1  NIC2  MGMT', 678, 162);
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

// ============================================================================
// PORT-ALIGNED DENSE PATCH CABLE HARNESS BUILDERS
// ============================================================================

/**
 * Generates realistic merged patch-cord TubeGeometries + plug boot BoxGeometries
 * starting at exact port coordinates and routing into the left/right vertical finger ducts
 * (plus optional vertical jumper cords dropping straight through an adjacent brush bar).
 */
function buildPortHarnessBundle(ports, {
    zFront,
    patchedIndices,
    verticalDropIndices = new Set(),
    verticalTargetYOffset = -0.085,
    colorSelector,
}) {
    const cableBuckets = {
        aqua: [],
        yellow: [],
        blue: [],
        orange: [],
    };
    const boots = [];
    const patchedPorts = [];

    const ductZ = 0.436;
    const ductX = 0.368;

    patchedIndices.forEach((pIdx, order) => {
        const port = ports.find((p) => p.idx === pIdx);
        if (!port) return;
        patchedPorts.push(port);

        // Connector boot / SFP+ transceiver housing seated flush into the port socket
        const bootGeo = new THREE.BoxGeometry(0.011, 0.0085, 0.022);
        bootGeo.translate(port.portX, port.portY, zFront + 0.008);
        boots.push(bootGeo);

        const start = new THREE.Vector3(port.portX, port.portY, zFront + 0.017);
        const sideSign = port.portX < 0 ? -1 : 1;
        const staggerZ = ((order % 5) - 2) * 0.004;
        const isVertJumper = verticalDropIndices.has(pIdx);

        let curve;
        if (isVertJumper) {
            // Clean vertical jumper sweeping forward slightly and tucking straight down into brush bar / patch unit
            const bowZ = zFront + 0.052 + (order % 3) * 0.004;
            curve = new THREE.CatmullRomCurve3([
                start,
                new THREE.Vector3(port.portX, port.portY - 0.006, bowZ),
                new THREE.Vector3(port.portX, port.portY + verticalTargetYOffset * 0.5, bowZ + 0.004),
                new THREE.Vector3(port.portX, port.portY + verticalTargetYOffset, zFront + 0.016),
            ]);
        } else {
            // Sweeps laterally with natural gravity bend into Left/Right Vertical Finger Duct
            const distRatio = Math.min(1, Math.abs(port.portX) / 0.34);
            const archZ = zFront + 0.044 + (1 - distRatio) * 0.024 + staggerZ;
            const midX = THREE.MathUtils.lerp(port.portX, sideSign * ductX, 0.52);
            const dropY = 0.055 + (order % 4) * 0.032;

            curve = new THREE.CatmullRomCurve3([
                start,
                new THREE.Vector3(port.portX + sideSign * 0.022, port.portY - 0.008, archZ),
                new THREE.Vector3(midX, port.portY - 0.022 - (order % 2) * 0.008, archZ - 0.006),
                new THREE.Vector3(sideSign * (ductX - 0.006), port.portY - dropY * 0.65, ductZ + 0.006),
                new THREE.Vector3(sideSign * ductX, port.portY - dropY, ductZ - 0.004),
            ]);
        }

        const tube = new THREE.TubeGeometry(curve, 8, 0.0036, 5, false);
        const colorKey = colorSelector(port, order);
        cableBuckets[colorKey].push(tube);
    });

    return {
        aquaGeo: buildMergedGeo(cableBuckets.aqua),
        yellowGeo: buildMergedGeo(cableBuckets.yellow),
        blueGeo: buildMergedGeo(cableBuckets.blue),
        orangeGeo: buildMergedGeo(cableBuckets.orange),
        bootsGeo: buildMergedGeo(boots),
        patchedPorts,
    };
}

function buildRearHarnessGeometry(sideSign, hasBoot = true) {
    const parts = [];
    const startX = sideSign * 0.25;
    const endX = sideSign * 0.358;
    const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(startX, -0.006, -0.395),
        new THREE.Vector3(sideSign * 0.31, -0.02, -0.432),
        new THREE.Vector3(endX, -0.055, -0.405),
        new THREE.Vector3(endX, -0.095, -0.382),
    ]);
    parts.push(new THREE.TubeGeometry(curve, 8, 0.0062, 5, false));

    if (hasBoot) {
        const plug = new THREE.BoxGeometry(0.016, 0.014, 0.024);
        plug.translate(startX, -0.006, -0.402);
        parts.push(plug);
    }
    return buildMergedGeo(parts);
}

function buildRearDataUplinkGeo() {
    const parts = [];
    for (const offset of [-0.126, -0.155, -0.185]) {
        const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(offset, 0.0, -0.395),
            new THREE.Vector3(offset - 0.05, -0.015, -0.432),
            new THREE.Vector3(-0.305, -0.045, -0.392),
            new THREE.Vector3(-0.32, -0.085, -0.345),
        ]);
        parts.push(new THREE.TubeGeometry(curve, 7, 0.0038, 5, false));
    }
    return buildMergedGeo(parts);
}

function buildFingerDuctTeethGeo() {
    const teeth = [];
    for (let y = 0.2; y <= 2.12; y += 0.09) {
        const tooth = new THREE.BoxGeometry(0.022, 0.008, 0.036);
        tooth.translate(0, y, 0);
        teeth.push(tooth);
    }
    const spine = new THREE.BoxGeometry(0.012, 1.98, 0.028);
    spine.translate(0, 1.16, -0.014);
    teeth.push(spine);
    return buildMergedGeo(teeth);
}

// ============================================================================
// MAIN CABINET ASSET FACTORY
// ============================================================================

export class CabinetAssetFactory {
    constructor() {
        const perfTex = createPerforatedMeshTexture(9, 24);
        const perfRearTex = createPerforatedMeshTexture(4.5, 24);
        const switch1Asset = createSwitch1UAsset(0.082);
        const switch2Asset = createSwitch2UAsset(0.165);
        const patch1Asset = createPatchPanel1UAsset(0.082);
        const brushTex = createBrushManagerTexture();
        const coreAsset = createCoreChassisAsset(0.62);
        const srv1Asset = createComputeServerAsset(false, 0.082);
        const srv2Asset = createComputeServerAsset(true, 0.165);
        const gpu4Asset = createGpuBlade4UAsset(0.34);
        const storageAsset = createStorageArray4UAsset(0.34);
        const rearTex = createRearHardwareTexture();
        const pduATex = createVerticalPduTexture(true);
        const pduBTex = createVerticalPduTexture(false);

        this.layouts = {
            switch1: switch1Asset.ports,
            switch2: switch2Asset.ports,
            patch1: patch1Asset.ports,
            coreCards: coreAsset.lineCards,
            srv1Leds: srv1Asset.leds,
            srv2Leds: srv2Asset.leds,
            gpu4Leds: gpu4Asset.leds,
            storageLeds: storageAsset.leds,
        };

        this.mats = {
            frame: new THREE.MeshStandardMaterial({ color: 0x151c26, roughness: 0.44, metalness: 0.78 }),
            doorFrame: new THREE.MeshStandardMaterial({ color: 0x192230, roughness: 0.42, metalness: 0.76 }),
            chassisMetal: new THREE.MeshStandardMaterial({ color: 0x18202c, roughness: 0.46, metalness: 0.72 }),
            rail: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.32, metalness: 0.88 }),
            ductPlastic: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.55, metalness: 0.25 }),
            bootBlack: new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45, metalness: 0.35 }),
            perfDoor: new THREE.MeshStandardMaterial({
                map: perfTex,
                alphaTest: 0.45,
                side: THREE.DoubleSide,
                roughness: 0.48,
                metalness: 0.72,
            }),
            perfDoorRear: new THREE.MeshStandardMaterial({
                map: perfRearTex,
                alphaTest: 0.45,
                side: THREE.DoubleSide,
                roughness: 0.48,
                metalness: 0.72,
            }),
            sidePanel: new THREE.MeshStandardMaterial({ color: 0x1e2633, roughness: 0.48, metalness: 0.68 }),
            glassCenter: new THREE.MeshStandardMaterial({
                color: 0x7dd3fc,
                transparent: true,
                opacity: 0.2,
                roughness: 0.08,
                metalness: 0.15,
                depthWrite: false,
            }),
            switch1U: new THREE.MeshStandardMaterial({ map: switch1Asset.tex, roughness: 0.4, metalness: 0.5 }),
            switch2U: new THREE.MeshStandardMaterial({ map: switch2Asset.tex, roughness: 0.4, metalness: 0.5 }),
            patch1U: new THREE.MeshStandardMaterial({ map: patch1Asset.tex, roughness: 0.42, metalness: 0.5 }),
            brush1U: new THREE.MeshStandardMaterial({ map: brushTex, roughness: 0.65, metalness: 0.28 }),
            coreChassis: new THREE.MeshStandardMaterial({ map: coreAsset.tex, roughness: 0.38, metalness: 0.52 }),
            srv1U: new THREE.MeshStandardMaterial({ map: srv1Asset.tex, roughness: 0.42, metalness: 0.54 }),
            srv2U: new THREE.MeshStandardMaterial({ map: srv2Asset.tex, roughness: 0.42, metalness: 0.54 }),
            gpu4U: new THREE.MeshStandardMaterial({ map: gpu4Asset.tex, roughness: 0.4, metalness: 0.56 }),
            storage4U: new THREE.MeshStandardMaterial({ map: storageAsset.tex, roughness: 0.42, metalness: 0.52 }),
            blanking: new THREE.MeshStandardMaterial({ color: 0x0f151e, roughness: 0.65, metalness: 0.35 }),
            rearPanel: new THREE.MeshStandardMaterial({ map: rearTex, roughness: 0.45, metalness: 0.55 }),
            pduA: new THREE.MeshStandardMaterial({ map: pduATex, roughness: 0.38, metalness: 0.45 }),
            pduB: new THREE.MeshStandardMaterial({ map: pduBTex, roughness: 0.38, metalness: 0.45 }),
            fiberYellow: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35, metalness: 0.1 }),
            fiberAqua: new THREE.MeshStandardMaterial({ color: 0x22d3ee, roughness: 0.35, metalness: 0.1 }),
            fiberOrange: new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.35, metalness: 0.1 }),
            copperBlue: new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.45, metalness: 0.08 }),
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

        // Precompute dense port-aligned patch harnesses (reused across cabinets for minimal draw calls)
        const sw1Patched = [
            1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 13, 14, 15, 16, 18, 19, 20, 22,
            25, 26, 27, 29, 30, 31, 33, 35, 37, 38, 40, 41, 43, 45, 49, 51, 52,
        ];
        const sw1VertJumpers = new Set([19, 20, 22, 25, 26, 27, 29, 30]);
        const sw1Bundle = buildPortHarnessBundle(this.layouts.switch1, {
            zFront: 0.4,
            patchedIndices: sw1Patched,
            verticalDropIndices: sw1VertJumpers,
            verticalTargetYOffset: 0.09,
            colorSelector: (port) => {
                if (port.idx >= 49) return 'yellow';
                if (port.kind === 'rj45') return 'blue';
                return port.col % 3 === 0 ? 'yellow' : 'aqua';
            },
        });

        const sw1PoEPatched = [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24, 49, 50,
        ];
        const sw1PoEBundle = buildPortHarnessBundle(this.layouts.switch1, {
            zFront: 0.4,
            patchedIndices: sw1PoEPatched,
            colorSelector: (port) => (port.idx >= 49 ? 'yellow' : 'blue'),
        });

        const sw1StagingPatched = [1, 2, 4, 5, 13, 14, 25, 26, 29, 31, 37, 38, 49, 51];
        const sw1StagingBundle = buildPortHarnessBundle(this.layouts.switch1, {
            zFront: 0.4,
            patchedIndices: sw1StagingPatched,
            colorSelector: (port) => (port.idx >= 49 ? 'yellow' : port.kind === 'rj45' ? 'blue' : 'aqua'),
        });

        const patch1Patched = [
            1, 2, 3, 4, 5, 7, 8, 9, 11, 12, 15, 17, 19, 20, 22, 25, 26, 27, 29, 30, 33, 35, 39, 41, 43, 45,
        ];
        const patch1Bundle = buildPortHarnessBundle(this.layouts.patch1, {
            zFront: 0.4,
            patchedIndices: patch1Patched,
            verticalDropIndices: new Set([19, 20, 22, 25, 26, 27, 29, 30]),
            verticalTargetYOffset: -0.17,
            colorSelector: (port) => (port.kind === 'rj45' ? 'blue' : port.col % 4 === 0 ? 'yellow' : 'aqua'),
        });

        const sw2Patched = [
            1, 2, 3, 4, 5, 7, 8, 10, 11, 13, 14, 15, 17, 19, 20, 21, 23, 25, 26, 28, 30, 31, 33, 35,
        ];
        const sw2Bundle = buildPortHarnessBundle(this.layouts.switch2, {
            zFront: 0.41,
            patchedIndices: sw2Patched,
            colorSelector: (port, i) => (i % 3 === 0 ? 'yellow' : 'aqua'),
        });

        const sanPatched = [
            1, 2, 3, 4, 6, 7, 8, 10, 11, 13, 14, 16, 19, 20, 22, 25, 26, 28, 31, 32, 34, 35,
        ];
        const sanBundle = buildPortHarnessBundle(this.layouts.switch2, {
            zFront: 0.41,
            patchedIndices: sanPatched,
            colorSelector: (_port, i) => (i % 4 === 0 ? 'aqua' : 'orange'),
        });

        // Core 8U chassis: dense optical bundles for all 6 line cards
        const coreCardPatched = [
            1, 2, 3, 4, 5, 7, 8, 9, 11, 12, 13, 15, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31,
        ];
        const coreBuckets = { aqua: [], yellow: [], boots: [] };
        const corePatchedPorts = [];
        this.layouts.coreCards.forEach((lc) => {
            const b = buildPortHarnessBundle(lc.ports, {
                zFront: 0.42,
                patchedIndices: coreCardPatched,
                colorSelector: (port, i) => ((i + lc.card) % 3 === 0 ? 'yellow' : 'aqua'),
            });
            if (b.aquaGeo) coreBuckets.aqua.push(b.aquaGeo);
            if (b.yellowGeo) coreBuckets.yellow.push(b.yellowGeo);
            if (b.bootsGeo) coreBuckets.boots.push(b.bootsGeo);
            b.patchedPorts.forEach((p) => corePatchedPorts.push({ ...p, card: lc.card }));
        });

        this.bundles = {
            sw1: sw1Bundle,
            sw1PoE: sw1PoEBundle,
            sw1Staging: sw1StagingBundle,
            patch1: patch1Bundle,
            sw2: sw2Bundle,
            san: sanBundle,
            core: {
                aquaGeo: buildMergedGeo(coreBuckets.aqua),
                yellowGeo: buildMergedGeo(coreBuckets.yellow),
                bootsGeo: buildMergedGeo(coreBuckets.boots),
                patchedPorts: corePatchedPorts,
            },
        };

        // Shared geometries (TOP CHIMNEYS & OVERHEAD DROP TUBES ARE 100% UNCHANGED)
        this.geos = {
            post: new THREE.BoxGeometry(0.055, 2.22, 0.055),
            rail: new THREE.BoxGeometry(0.04, 2.08, 0.04),
            topBottomPlate: new THREE.BoxGeometry(0.9, 0.05, 1.1),
            doorStile: new THREE.BoxGeometry(0.036, 2.08, 0.022),
            doorRail: new THREE.BoxGeometry(0.84, 0.048, 0.022),
            doorMeshFront: new THREE.PlaneGeometry(0.768, 1.984),
            doorMeshSplit: new THREE.PlaneGeometry(0.384, 1.984),
            sidePanel: new THREE.BoxGeometry(0.03, 2.16, 1.04),
            latch: new THREE.BoxGeometry(0.03, 0.22, 0.04),
            chassis1U: new THREE.BoxGeometry(0.74, 0.082, 0.78),
            chassis2U: new THREE.BoxGeometry(0.74, 0.165, 0.8),
            chassis4U: new THREE.BoxGeometry(0.74, 0.34, 0.82),
            chassis8U: new THREE.BoxGeometry(0.74, 0.62, 0.82),
            brushBar1U: new THREE.BoxGeometry(0.74, 0.055, 0.05),
            pduBar: new THREE.BoxGeometry(0.065, 1.94, 0.065),
            waterfallPipe: this._buildFiberDropTube(),
            nocFiberDrop: new THREE.CylinderGeometry(0.016, 0.016, 0.28, 7),
            nocPowerDrop: new THREE.CylinderGeometry(0.016, 0.016, 0.36, 7),
            powerWhipLeft: this._buildPowerDropTube(-1),
            powerWhipRight: this._buildPowerDropTube(1),
            rearCordA: buildRearHarnessGeometry(-1, true),
            rearCordB: buildRearHarnessGeometry(1, true),
            rearDataUplink: buildRearDataUplinkGeo(),
            fingerDuct: buildFingerDuctTeethGeo(),
            vertTrunkBundle: new THREE.CylinderGeometry(0.014, 0.014, 2.0, 7),
            rearDataTrunk: new THREE.CylinderGeometry(0.011, 0.011, 1.96, 6),
            chimney: new THREE.BoxGeometry(0.54, 0.1, 0.28),
            badgePlane: new THREE.PlaneGeometry(0.76, 0.14),
            beaconStrip: new THREE.BoxGeometry(0.68, 0.035, 0.03),
            hitBox: new THREE.BoxGeometry(0.88, 2.28, 1.1),
        };
        this.hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });

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

    /**
     * Builds a 42U detailed cabinet:
     * type: 'switch' | 'server' | 'storage' | 'staging' | 'security'
     */
    createCabinet({
        type = 'server',
        code = 'SRV-01',
        podName = 'Pod A',
        showLeftSide = false,
        showRightSide = false,
        inspectables,
        badgeLabel,
        badgeAccent,
        inspectMeta,
    }) {
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
        // (Kept completely intact to preserve overhead cable tray links)
        const chimneyFiber = new THREE.Mesh(this.geos.chimney, this.mats.rail);
        chimneyFiber.position.set(0, 2.29, 0.26);
        const chimneyPower = new THREE.Mesh(this.geos.chimney, this.mats.rail);
        chimneyPower.position.set(0, 2.29, -0.26);
        group.add(chimneyFiber, chimneyPower);

        if (
            podName === 'NOC Kontrol' ||
            podName === 'Staging' ||
            podName === 'Güvenlik' ||
            podName === 'Donanım Hazırlık' ||
            podName === 'Core Network'
        ) {
            for (const fx of [-0.08, 0.0, 0.08]) {
                const nf = new THREE.Mesh(
                    this.geos.nocFiberDrop,
                    fx === 0 ? this.mats.fiberAqua : this.mats.fiberYellow
                );
                nf.position.set(fx, 2.38, 0.26);
                group.add(nf);
            }
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
            const whipA = new THREE.Mesh(this.geos.powerWhipLeft, this.mats.powerCordRed);
            const whipB = new THREE.Mesh(this.geos.powerWhipRight, this.mats.powerCordBlue);
            group.add(whipA, whipB);
        }

        // 2. Vertical 0U Rear Redundant PDUs (Red Feed A & Blue Feed B) + Rear Data Trunk
        const pduA = new THREE.Mesh(this.geos.pduBar, this.mats.pduA);
        pduA.position.set(-0.36, 1.14, -0.38);
        const pduB = new THREE.Mesh(this.geos.pduBar, this.mats.pduB);
        pduB.position.set(0.36, 1.14, -0.38);
        const rearDataTrunk = new THREE.Mesh(this.geos.rearDataTrunk, this.mats.fiberAqua);
        rearDataTrunk.position.set(-0.32, 1.14, -0.34);
        group.add(pduA, pduB, rearDataTrunk);

        // Front Vertical Finger-Duct Cable Managers + Multi-Colored Vertical Trunk Bundles
        for (const side of [-1, 1]) {
            const duct = new THREE.Mesh(this.geos.fingerDuct, this.mats.ductPlastic);
            duct.position.set(side * 0.372, 0, 0.436);
            group.add(duct);

            const primaryTrunkMat =
                type === 'switch'
                    ? side < 0
                        ? this.mats.fiberYellow
                        : this.mats.fiberAqua
                    : type === 'storage'
                        ? this.mats.fiberOrange
                        : type === 'security'
                            ? this.mats.copperBlue
                            : this.mats.fiberAqua;

            const t1 = new THREE.Mesh(this.geos.vertTrunkBundle, primaryTrunkMat);
            t1.position.set(side * 0.372, 1.14, 0.428);
            const t2 = new THREE.Mesh(
                this.geos.vertTrunkBundle,
                type === 'switch' ? this.mats.copperBlue : this.mats.fiberYellow
            );
            t2.scale.set(0.7, 1, 0.7);
            t2.position.set(side * 0.362, 1.14, 0.415);
            group.add(t1, t2);
        }

        // Determine whether this server rack is a 100% Pure Compute/GPU Rack (no front switch)
        // or a ToR-managed Compute Rack (1U ToR switch at U42 + pure compute servers below)
        const numMatch = /(\d+)$/.exec(code);
        const cabNumber = numMatch ? parseInt(numMatch[1], 10) : 1;
        const isPureComputeRack = type === 'server' && cabNumber % 2 === 0;

        // 3. Populate Internal 3D Hardware Stack + Port-Aligned Patch Cables + LED Coordinates
        const roleMeta = {
            switch: { label: 'AĞ & CORE SWITCH', accent: '#38bdf8', beacon: this.mats.beaconSwitch },
            server: {
                label: isPureComputeRack ? 'SAF HESAPLAMA & GPU' : 'HESAPLAMA SUNUCU',
                accent: '#34d399',
                beacon: this.mats.beaconServer,
            },
            storage: { label: 'DEPOLAMA & SAN', accent: '#fbbf24', beacon: this.mats.beaconStorage },
            staging: { label: 'TEST & ÖN KURULUM', accent: '#38bdf8', beacon: this.mats.beaconSwitch },
            security: { label: 'GÜVENLİK & NVR', accent: '#f59e0b', beacon: this.mats.beaconStorage },
        }[type];

        if (type === 'switch') {
            // Top Patch Panel + 1U Brush Bar + 2x 1U 48P-25G Leaf Switches
            this._addHardwareUnit(group, this.geos.chassis1U, this.mats.patch1U, 2.11);
            this._addPatchBundle(group, this.bundles.patch1, 2.11, pendingLeds, null);
            this._addBrushManager(group, 2.025);

            for (const swY of [1.94, 1.855]) {
                this._addHardwareUnit(group, this.geos.chassis1U, this.mats.switch1U, swY);
                this._addPatchBundle(group, this.bundles.sw1, swY, pendingLeds, 0.404);
                this._addRearPowerCords(group, swY);
            }
            this._addBrushManager(group, 1.77);

            // Middle 8U Modular Core Spine Switch (6 Line Cards, 192 QSFP28 ports, 132 active cords)
            const coreY = 1.32;
            this._addHardwareUnit(group, this.geos.chassis8U, this.mats.coreChassis, coreY);
            this._addPatchBundle(group, this.bundles.core, coreY, pendingLeds, 0.424);
            this._addRearPowerCords(group, coreY + 0.18);
            this._addRearPowerCords(group, coreY);
            this._addRearPowerCords(group, coreY - 0.18);

            // Lower 1U Brush Bar + Patch Panel + 2x 2U 100G-QSFP Distribution Switches
            this._addBrushManager(group, 0.945);
            this._addHardwareUnit(group, this.geos.chassis1U, this.mats.patch1U, 0.86);
            this._addPatchBundle(group, this.bundles.patch1, 0.86, pendingLeds, null);

            for (const dy of [0.715, 0.525]) {
                this._addHardwareUnit(group, this.geos.chassis2U, this.mats.switch2U, dy);
                this._addPatchBundle(group, this.bundles.sw2, dy, pendingLeds, 0.414);
                this._addRearPowerCords(group, dy);
            }
        } else if (type === 'storage') {
            // Top 2U Fibre-Channel SAN Switch + 1U Brush Manager + 2U SAN Switch
            this._addHardwareUnit(group, this.geos.chassis2U, this.mats.switch2U, 2.07);
            this._addPatchBundle(group, this.bundles.san, 2.07, pendingLeds, 0.414);
            this._addRearPowerCords(group, 2.07);
            this._addBrushManager(group, 1.945);

            // 4 x 4U High-Density NVMe/SAS Storage Arrays
            for (let j = 0; j < 4; j++) {
                const jy = 1.66 - j * 0.37;
                this._addHardwareUnit(group, this.geos.chassis4U, this.mats.storage4U, jy);
                this._addRearPowerCords(group, jy);
                this._registerUnitLeds(pendingLeds, this.layouts.storageLeds, jy, 0.424, j * 31);
            }
        } else if (type === 'security') {
            // Top 1U PoE++ Camera Switch + 1U Brush Bar + 1U Patch Panel
            this._addHardwareUnit(group, this.geos.chassis1U, this.mats.switch1U, 2.11);
            this._addPatchBundle(group, this.bundles.sw1PoE, 2.11, pendingLeds, 0.404, { poeMode: true });
            this._addRearPowerCords(group, 2.11);
            this._addBrushManager(group, 2.025);
            this._addHardwareUnit(group, this.geos.chassis1U, this.mats.patch1U, 1.94);
            this._addPatchBundle(group, this.bundles.patch1, 1.94, pendingLeds, null);

            // 2 x 1U Biometric & Access Control Servers + 3 x 4U 4K NVR Storage Arrays
            for (const sY of [1.82, 1.71]) {
                this._addHardwareUnit(group, this.geos.chassis1U, this.mats.srv1U, sY, true);
                this._addRearPowerCords(group, sY);
                this._registerUnitLeds(pendingLeds, this.layouts.srv1Leds, sY, 0.404, Math.round(sY * 100));
            }
            for (let j = 0; j < 3; j++) {
                const jy = 1.4 - j * 0.375;
                this._addHardwareUnit(group, this.geos.chassis4U, this.mats.storage4U, jy);
                this._addRearPowerCords(group, jy);
                this._registerUnitLeds(pendingLeds, this.layouts.storageLeds, jy, 0.424, j * 43);
            }
        } else if (type === 'staging') {
            // 1U Test Switch + 1U Brush Bar + Mixed Test Compute & GPU Nodes
            this._addHardwareUnit(group, this.geos.chassis1U, this.mats.switch1U, 2.11);
            this._addPatchBundle(group, this.bundles.sw1Staging, 2.11, pendingLeds, 0.404);
            this._addRearPowerCords(group, 2.11);
            this._addBrushManager(group, 2.025);

            const slots = [
                { y: 1.89, geo: this.geos.chassis2U, mat: this.mats.srv2U, leds: this.layouts.srv2Leds, z: 0.414 },
                { y: 1.73, geo: this.geos.chassis1U, mat: this.mats.srv1U, leds: this.layouts.srv1Leds, z: 0.404 },
                { y: 1.61, geo: this.geos.chassis1U, mat: this.mats.srv1U, leds: this.layouts.srv1Leds, z: 0.404 },
                { y: 1.32, geo: this.geos.chassis4U, mat: this.mats.gpu4U, leds: this.layouts.gpu4Leds, z: 0.424 },
                { y: 1.0, geo: this.geos.chassis2U, mat: this.mats.srv2U, leds: this.layouts.srv2Leds, z: 0.414 },
            ];
            slots.forEach((slot, idx) => {
                this._addHardwareUnit(group, slot.geo, slot.mat, slot.y, true);
                this._addRearPowerCords(group, slot.y);
                this._registerUnitLeds(pendingLeds, slot.leds, slot.y, slot.z, idx * 29);
            });
        } else {
            // COMPUTE SERVER RACKS:
            // Even-numbered SRV racks are 100% pure Compute/GPU Blade racks (NO front switches at all).
            // Odd-numbered SRV racks have 1x 1U ToR Leaf Switch + 1U Brush Bar at the very top, then pure servers below.
            let nextY = 2.1;
            if (!isPureComputeRack) {
                this._addHardwareUnit(group, this.geos.chassis1U, this.mats.switch1U, 2.11);
                this._addPatchBundle(group, this.bundles.sw1, 2.11, pendingLeds, 0.404);
                this._addRearPowerCords(group, 2.11);
                this._addBrushManager(group, 2.025);
                nextY = 1.88;
            }

            // Pure 1U / 2U / 4U Compute & GPU Blade Server Stack (NO switch faceplates, NO front patch loops)
            const serverLayout = isPureComputeRack
                ? ['4U', '2U', '1U', '1U', '4U', '2U', '1U', '1U', '2U']
                : ['2U', '1U', '1U', '4U', '2U', '1U', '1U', '2U'];

            for (let i = 0; i < serverLayout.length; i++) {
                const kind = serverLayout[i];
                const unitH = kind === '4U' ? 0.34 : kind === '2U' ? 0.165 : 0.082;
                const centerY = nextY - unitH / 2;
                if (centerY - unitH / 2 < 0.16) break;

                if (kind === '4U') {
                    this._addHardwareUnit(group, this.geos.chassis4U, this.mats.gpu4U, centerY, true);
                    this._addRearPowerCords(group, centerY + 0.08);
                    this._addRearPowerCords(group, centerY - 0.08);
                    this._registerUnitLeds(pendingLeds, this.layouts.gpu4Leds, centerY, 0.424, i * 37);
                } else if (kind === '2U') {
                    this._addHardwareUnit(group, this.geos.chassis2U, this.mats.srv2U, centerY, true);
                    this._addRearPowerCords(group, centerY);
                    this._registerUnitLeds(pendingLeds, this.layouts.srv2Leds, centerY, 0.414, i * 23);
                } else {
                    this._addHardwareUnit(group, this.geos.chassis1U, this.mats.srv1U, centerY, true);
                    if (i % 2 === 0) this._addRearPowerCords(group, centerY);
                    this._registerUnitLeds(pendingLeds, this.layouts.srv1Leds, centerY, 0.404, i * 19);
                }

                nextY -= unitH + 0.022;
            }
        }

        // 4. Front & Rear Doors + Header Nameplate + Top Beacon
        const badgeTex = createHeaderBadgeTexture(
            code,
            badgeLabel ?? roleMeta.label,
            badgeAccent ?? roleMeta.accent
        );
        const badgePlane = new THREE.Mesh(
            this.geos.badgePlane,
            new THREE.MeshBasicMaterial({ map: badgeTex })
        );
        badgePlane.position.set(0, 2.24, 0.56);
        group.add(badgePlane);

        const beacon = new THREE.Mesh(this.geos.beaconStrip, roleMeta.beacon);
        beacon.position.set(0, 2.33, 0.53);
        group.add(beacon);

        // Front Door: Clear glass on Switch racks, crisp high-airflow hex mesh on Server/Storage racks
        this._addDoorFrame(group, 0.525);
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
        frontLatch.position.set(0.402, 1.12, 0.545);
        group.add(frontLatch);

        // Rear Split Perforated Doors (Hot Aisle side)
        this._addDoorFrame(group, -0.525);
        const rearL = new THREE.Mesh(this.geos.doorMeshSplit, this.mats.perfDoorRear);
        rearL.position.set(-0.192, 1.13, -0.525);
        const rearR = new THREE.Mesh(this.geos.doorMeshSplit, this.mats.perfDoorRear);
        rearR.position.set(0.192, 1.13, -0.525);
        const rearLatch = new THREE.Mesh(this.geos.latch, this.mats.rail);
        rearLatch.position.set(0.02, 1.12, -0.545);
        group.add(rearL, rearR, rearLatch);

        // Invisible simplified raycast hit box for effortless inspection clicking
        const hitBox = new THREE.Mesh(this.geos.hitBox, this.hitBoxMat);
        hitBox.position.y = 1.14;
        hitBox.userData.inspect = inspectMeta ?? this._buildInspectMeta(type, code, podName, isPureComputeRack);
        inspectables.push(hitBox);
        group.add(hitBox);

        group.userData._pendingLeds = pendingLeds;
        return group;
    }

    _addDoorFrame(group, z) {
        const stileL = new THREE.Mesh(this.geos.doorStile, this.mats.doorFrame);
        stileL.position.set(-0.402, 1.13, z);
        const stileR = new THREE.Mesh(this.geos.doorStile, this.mats.doorFrame);
        stileR.position.set(0.402, 1.13, z);
        const railTop = new THREE.Mesh(this.geos.doorRail, this.mats.doorFrame);
        railTop.position.set(0, 2.146, z);
        const railBot = new THREE.Mesh(this.geos.doorRail, this.mats.doorFrame);
        railBot.position.set(0, 0.114, z);
        group.add(stileL, stileR, railTop, railBot);
    }

    _addHardwareUnit(group, geo, mat, y, withRearData = false) {
        const mats = [
            this.mats.chassisMetal,
            this.mats.chassisMetal,
            this.mats.chassisMetal,
            this.mats.chassisMetal,
            mat,
            this.mats.rearPanel,
        ];
        const unit = new THREE.Mesh(geo, mats);
        unit.position.set(0, y, 0.01);
        unit.receiveShadow = true;
        group.add(unit);

        if (withRearData) {
            const dataUplink = new THREE.Mesh(this.geos.rearDataUplink, this.mats.fiberAqua);
            dataUplink.position.y = y;
            group.add(dataUplink);
        }
    }

    _addBrushManager(group, y) {
        const bar = new THREE.Mesh(this.geos.brushBar1U, this.mats.brush1U);
        bar.position.set(0, y, 0.405);
        group.add(bar);
    }

    _addPatchBundle(group, bundle, y, pendingLeds, ledZ, { poeMode = false } = {}) {
        if (bundle.bootsGeo) {
            const boots = new THREE.Mesh(bundle.bootsGeo, this.mats.bootBlack);
            boots.position.y = y;
            group.add(boots);
        }
        if (bundle.aquaGeo) {
            const m = new THREE.Mesh(bundle.aquaGeo, this.mats.fiberAqua);
            m.position.y = y;
            group.add(m);
        }
        if (bundle.yellowGeo) {
            const m = new THREE.Mesh(bundle.yellowGeo, this.mats.fiberYellow);
            m.position.y = y;
            group.add(m);
        }
        if (bundle.blueGeo) {
            const m = new THREE.Mesh(bundle.blueGeo, this.mats.copperBlue);
            m.position.y = y;
            group.add(m);
        }
        if (bundle.orangeGeo) {
            const m = new THREE.Mesh(bundle.orangeGeo, this.mats.fiberOrange);
            m.position.y = y;
            group.add(m);
        }

        // Register a Status/Activity LED DIRECTLY ABOVE every single patched port!
        if (ledZ !== null && bundle.patchedPorts) {
            bundle.patchedPorts.forEach((p, idx) => {
                const isAmber = poeMode ? idx % 5 === 0 : idx % 17 === 7;
                const isOpticalUplink = p.kind === 'qsfp28' && !isAmber;
                pendingLeds.push({
                    x: p.ledX,
                    y: y + p.ledY,
                    z: ledZ,
                    role: isAmber ? 'port_amber' : isOpticalUplink ? 'port_uplink' : 'port_active',
                    seed: idx * 19 + p.idx * 7 + Math.round(y * 100),
                });
            });
        }
    }

    _addRearPowerCords(group, y) {
        const cordA = new THREE.Mesh(this.geos.rearCordA, this.mats.powerCordRed);
        cordA.position.y = y;
        const cordB = new THREE.Mesh(this.geos.rearCordB, this.mats.powerCordBlue);
        cordB.position.y = y;
        group.add(cordA, cordB);
    }

    _registerUnitLeds(pendingLeds, localLeds, unitY, ledZ, baseSeed) {
        localLeds.forEach((led, idx) => {
            pendingLeds.push({
                x: led.x,
                y: unitY + led.y,
                z: ledZ,
                role: led.role,
                seed: baseSeed + idx * 13,
            });
        });
    }

    _buildInspectMeta(type, code, podName, isPureComputeRack = false) {
        if (type === 'switch') {
            return {
                category: 'Ağ & Switch Kabini (Spine / Leaf)',
                name: `${code} (${podName} · Ağ Omurgası)`,
                specs: '400GbE Spine (6 Line Card) + 48P-25G Leaf Switch & Patch Paneller · Yoğun OM4/OS2/Cat6A Kablolama',
            };
        }
        if (type === 'storage') {
            return {
                category: 'Depolama & SAN Kabini',
                name: `${code} (${podName} · NVMe All-Flash)`,
                specs: '1.2 PB NVMe Kapasite · 36P-100G FC SAN Switch + 4×4U Disk Rafı · Çift Besleme A+B',
            };
        }
        if (type === 'security') {
            return {
                category: 'Fiziksel Güvenlik & NVR Kabini',
                name: `${code} (${podName} · Erişim Kontrol)`,
                specs: 'PoE++ CCTV Switch (Cat6A) + Biyometrik Erişim Sunucuları + 3×4U 4K NVR Depolama',
            };
        }
        if (type === 'staging') {
            return {
                category: 'Test & Burn-In Kurulum Kabini',
                name: `${code} (Staging · Sunucu Ön Hazırlık)`,
                specs: '1U Test Switch + 1U/2U Hesaplama & 4U GPU Blade Düğümleri · PXE & Termal Test',
            };
        }
        if (isPureComputeRack) {
            return {
                category: '42U Saf Hesaplama & GPU Blade Kabini',
                name: `${code} (${podName} · EoR Topoloji)`,
                specs: '2× 4U GPU/Blade Şasi + 1U/2U NVMe Hesaplama Sunucuları · Arka Çift SFP28 & PDU A+B',
            };
        }
        return {
            category: '42U Hesaplama Sunucu Kabini',
            name: `${code} (${podName})`,
            specs: '1× 48P-25G ToR Switch + 4U Blade & 1U/2U NVMe Sunucular · Yük: 18.4 kW · Giriş: 20.4°C',
        };
    }

    /**
     * Builds a large batch of 42U cabinets (e.g. 150+ hyperscale racks = 3,000+ servers)
     * with the EXACT same textures, perforated doors, port-aligned 3D cables, and LEDs
     * as createCabinet(), collapsed into ~38 InstancedMesh draw calls + 1 atlas badge mesh.
     *
     * spec: { type, code, podName, x, y = 0.18, z, rotY = 0, showLeftSide, showRightSide, profile = 'standard' }
     */
    createInstancedCabinetBatch(specs, { parent, inspectables = [], castUnitShadows = true } = {}) {
        const batchGroup = new THREE.Group();
        batchGroup.name = 'InstancedCabinetBatch';
        const pendingLeds = [];

        const buckets = new Map();
        const bucketKey = (geo, mat, castShadow, receiveShadow) => {
            const matKey = Array.isArray(mat) ? mat.map((m) => m.uuid).join(',') : mat.uuid;
            return `${geo.uuid}|${matKey}|${castShadow ? 1 : 0}|${receiveShadow ? 1 : 0}`;
        };

        const _rackPos = new THREE.Vector3();
        const _rackQuat = new THREE.Quaternion();
        const _rackScale = new THREE.Vector3(1, 1, 1);
        const _rackMat = new THREE.Matrix4();
        const _localPos = new THREE.Vector3();
        const _localQuat = new THREE.Quaternion();
        const _localScale = new THREE.Vector3();
        const _localMat = new THREE.Matrix4();
        const _worldMat = new THREE.Matrix4();
        const _euler = new THREE.Euler();

        const pushInst = (geo, mat, lx, ly, lz, { rotX = 0, rotY = 0, rotZ = 0, sx = 1, sy = 1, sz = 1, castShadow = false, receiveShadow = false } = {}) => {
            if (!geo || !mat) return;
            const key = bucketKey(geo, mat, castShadow, receiveShadow);
            let bucket = buckets.get(key);
            if (!bucket) {
                bucket = { geo, mat, castShadow, receiveShadow, matrices: [] };
                buckets.set(key, bucket);
            }
            _localPos.set(lx, ly, lz);
            _euler.set(rotX, rotY, rotZ);
            _localQuat.setFromEuler(_euler);
            _localScale.set(sx, sy, sz);
            _localMat.compose(_localPos, _localQuat, _localScale);
            _worldMat.multiplyMatrices(_rackMat, _localMat);
            bucket.matrices.push(_worldMat.clone());
        };

        // Texture atlas for crisp unique rack nameplates (1 draw call for up to 176+ racks)
        const atlasCols = 8;
        const slotW = 256;
        const slotH = 48;
        const atlasRows = Math.max(1, Math.ceil(specs.length / atlasCols));
        const atlasCanvas = document.createElement('canvas');
        atlasCanvas.width = atlasCols * slotW;
        atlasCanvas.height = atlasRows * slotH;
        const atlasCtx = atlasCanvas.getContext('2d');
        const badgeGeos = [];
        const hitBoxes = [];

        const roleMap = {
            switch: { label: 'AĞ & CORE SWITCH', accent: '#38bdf8', beacon: this.mats.beaconSwitch },
            server: { label: 'HESAPLAMA SUNUCU', accent: '#34d399', beacon: this.mats.beaconServer },
            storage: { label: 'DEPOLAMA & SAN', accent: '#fbbf24', beacon: this.mats.beaconStorage },
            staging: { label: 'TEST & ÖN KURULUM', accent: '#38bdf8', beacon: this.mats.beaconSwitch },
            security: { label: 'GÜVENLİK & NVR', accent: '#f59e0b', beacon: this.mats.beaconStorage },
        };

        const unitMatArrayCache = new Map();
        const addInstUnit = (geo, mat, y, withRearData = false) => {
            let unitMats = unitMatArrayCache.get(mat.uuid);
            if (!unitMats) {
                unitMats = [
                    this.mats.chassisMetal,
                    this.mats.chassisMetal,
                    this.mats.chassisMetal,
                    this.mats.chassisMetal,
                    mat,
                    this.mats.rearPanel,
                ];
                unitMatArrayCache.set(mat.uuid, unitMats);
            }
            pushInst(geo, unitMats, 0, y, 0.01, { castShadow: castUnitShadows, receiveShadow: true });
            if (withRearData) {
                pushInst(this.geos.rearDataUplink, this.mats.fiberAqua, 0, y, 0);
            }
        };

        const addInstRearCords = (y) => {
            pushInst(this.geos.rearCordA, this.mats.powerCordRed, 0, y, 0);
            pushInst(this.geos.rearCordB, this.mats.powerCordBlue, 0, y, 0);
        };

        const addInstBundle = (bundle, y, cabLeds, ledZ, { poeMode = false } = {}) => {
            if (bundle.bootsGeo) pushInst(bundle.bootsGeo, this.mats.bootBlack, 0, y, 0);
            if (bundle.aquaGeo) pushInst(bundle.aquaGeo, this.mats.fiberAqua, 0, y, 0);
            if (bundle.yellowGeo) pushInst(bundle.yellowGeo, this.mats.fiberYellow, 0, y, 0);
            if (bundle.blueGeo) pushInst(bundle.blueGeo, this.mats.copperBlue, 0, y, 0);
            if (bundle.orangeGeo) pushInst(bundle.orangeGeo, this.mats.fiberOrange, 0, y, 0);

            if (ledZ !== null && bundle.patchedPorts) {
                bundle.patchedPorts.forEach((p, idx) => {
                    const isAmber = poeMode ? idx % 5 === 0 : idx % 17 === 7;
                    const isOpticalUplink = p.kind === 'qsfp28' && !isAmber;
                    cabLeds.push({
                        x: p.ledX,
                        y: y + p.ledY,
                        z: ledZ,
                        role: isAmber ? 'port_amber' : isOpticalUplink ? 'port_uplink' : 'port_active',
                        seed: idx * 19 + p.idx * 7 + Math.round(y * 100),
                    });
                });
            }
        };

        specs.forEach((spec, idx) => {
            const type = spec.type || 'server';
            const code = spec.code || `RACK-${idx + 1}`;
            const podName = spec.podName || 'Pod';
            const profile = spec.profile || 'standard';
            const baseY = spec.y ?? 0.18;
            const rotY = spec.rotY ?? 0;

            _rackPos.set(spec.x, baseY, spec.z);
            _euler.set(0, rotY, 0);
            _rackQuat.setFromEuler(_euler);
            _rackMat.compose(_rackPos, _rackQuat, _rackScale);

            const numMatch = /(\d+)$/.exec(code);
            const cabNumber = numMatch ? parseInt(numMatch[1], 10) : idx + 1;
            const isPureComputeRack = type === 'server' && cabNumber % 2 === 0;
            const baseMeta = roleMap[type] || roleMap.server;
            const roleLabel =
                type === 'server'
                    ? isPureComputeRack
                        ? 'SAF HESAPLAMA & GPU'
                        : 'HESAPLAMA SUNUCU'
                    : baseMeta.label;

            // 1. Frame & Plinths
            pushInst(this.geos.topBottomPlate, this.mats.frame, 0, 0.035, 0, { castShadow: true, receiveShadow: true });
            pushInst(this.geos.topBottomPlate, this.mats.frame, 0, 2.24, 0, { castShadow: true });
            for (const px of [-0.42, 0.42]) {
                for (const pz of [-0.52, 0.52]) {
                    pushInst(this.geos.post, this.mats.frame, px, 1.135, pz, { castShadow: true });
                }
                for (const rz of [-0.41, 0.41]) {
                    pushInst(this.geos.rail, this.mats.rail, px * 0.89, 1.14, rz);
                }
            }
            if (spec.showLeftSide) {
                pushInst(this.geos.sidePanel, this.mats.sidePanel, -0.445, 1.14, 0, { castShadow: true });
            }
            if (spec.showRightSide) {
                pushInst(this.geos.sidePanel, this.mats.sidePanel, 0.445, 1.14, 0, { castShadow: true });
            }

            // 2. Top Chimneys & Overhead Drops
            pushInst(this.geos.chimney, this.mats.rail, 0, 2.29, 0.26);
            pushInst(this.geos.chimney, this.mats.rail, 0, 2.29, -0.26);

            if (
            podName === 'NOC Kontrol' ||
            podName === 'Staging' ||
            podName === 'Güvenlik' ||
            podName === 'Donanım Hazırlık' ||
            podName === 'Core Network'
        ) {
                for (const fx of [-0.08, 0.0, 0.08]) {
                    pushInst(this.geos.nocFiberDrop, fx === 0 ? this.mats.fiberAqua : this.mats.fiberYellow, fx, 2.38, 0.26);
                }
                pushInst(this.geos.nocPowerDrop, this.mats.powerCordRed, -0.08, 2.42, -0.26);
                pushInst(this.geos.nocPowerDrop, this.mats.powerCordBlue, 0.08, 2.42, -0.26);
            } else {
                const fiberMat = type === 'switch' ? this.mats.fiberYellow : this.mats.fiberAqua;
                for (const fx of [-0.14, 0.0, 0.14]) {
                    pushInst(this.geos.waterfallPipe, fx === 0 && type === 'switch' ? this.mats.fiberAqua : fiberMat, fx, 0, 0);
                }
                pushInst(this.geos.powerWhipLeft, this.mats.powerCordRed, 0, 0, 0);
                pushInst(this.geos.powerWhipRight, this.mats.powerCordBlue, 0, 0, 0);
            }

            // 3. Rear PDUs & Vertical Finger Ducts
            pushInst(this.geos.pduBar, this.mats.pduA, -0.36, 1.14, -0.38);
            pushInst(this.geos.pduBar, this.mats.pduB, 0.36, 1.14, -0.38);
            pushInst(this.geos.rearDataTrunk, this.mats.fiberAqua, -0.32, 1.14, -0.34);

            for (const side of [-1, 1]) {
                pushInst(this.geos.fingerDuct, this.mats.ductPlastic, side * 0.372, 0, 0.436);
                const primaryTrunkMat =
                    type === 'switch'
                        ? side < 0
                            ? this.mats.fiberYellow
                            : this.mats.fiberAqua
                        : type === 'storage'
                            ? this.mats.fiberOrange
                            : type === 'security'
                                ? this.mats.copperBlue
                                : this.mats.fiberAqua;
                pushInst(this.geos.vertTrunkBundle, primaryTrunkMat, side * 0.372, 1.14, 0.428);
                pushInst(
                    this.geos.vertTrunkBundle,
                    type === 'switch' ? this.mats.copperBlue : this.mats.fiberYellow,
                    side * 0.362,
                    1.14,
                    0.415,
                    { sx: 0.7, sz: 0.7 }
                );
            }

            // 4. Hardware Stack + Port-Aligned Cabling + LED registration
            const cabLeds = [];
            let serverNodeCount = 0;

            if (type === 'switch') {
                addInstUnit(this.geos.chassis1U, this.mats.patch1U, 2.11);
                addInstBundle(this.bundles.patch1, 2.11, cabLeds, null);
                pushInst(this.geos.brushBar1U, this.mats.brush1U, 0, 2.025, 0.405);

                for (const swY of [1.94, 1.855]) {
                    addInstUnit(this.geos.chassis1U, this.mats.switch1U, swY);
                    addInstBundle(this.bundles.sw1, swY, cabLeds, 0.404);
                    addInstRearCords(swY);
                }
                pushInst(this.geos.brushBar1U, this.mats.brush1U, 0, 1.77, 0.405);

                const coreY = 1.32;
                addInstUnit(this.geos.chassis8U, this.mats.coreChassis, coreY);
                addInstBundle(this.bundles.core, coreY, cabLeds, 0.424);
                addInstRearCords(coreY + 0.18);
                addInstRearCords(coreY);
                addInstRearCords(coreY - 0.18);

                pushInst(this.geos.brushBar1U, this.mats.brush1U, 0, 0.945, 0.405);
                addInstUnit(this.geos.chassis1U, this.mats.patch1U, 0.86);
                addInstBundle(this.bundles.patch1, 0.86, cabLeds, null);

                for (const dy of [0.715, 0.525]) {
                    addInstUnit(this.geos.chassis2U, this.mats.switch2U, dy);
                    addInstBundle(this.bundles.sw2, dy, cabLeds, 0.414);
                    addInstRearCords(dy);
                }
            } else if (type === 'storage') {
                addInstUnit(this.geos.chassis2U, this.mats.switch2U, 2.07);
                addInstBundle(this.bundles.san, 2.07, cabLeds, 0.414);
                addInstRearCords(2.07);
                pushInst(this.geos.brushBar1U, this.mats.brush1U, 0, 1.945, 0.405);

                for (let j = 0; j < 4; j++) {
                    const jy = 1.66 - j * 0.37;
                    addInstUnit(this.geos.chassis4U, this.mats.storage4U, jy);
                    addInstRearCords(jy);
                    this._registerUnitLeds(cabLeds, this.layouts.storageLeds, jy, 0.424, j * 31);
                }
            } else {
                let nextY = 2.13;
                if (!isPureComputeRack) {
                    addInstUnit(this.geos.chassis1U, this.mats.switch1U, 2.11);
                    addInstBundle(this.bundles.sw1, 2.11, cabLeds, 0.404);
                    addInstRearCords(2.11);
                    pushInst(this.geos.brushBar1U, this.mats.brush1U, 0, 2.025, 0.405);
                    nextY = 1.97;
                }

                const serverLayout =
                    profile === 'hyperscale'
                        ? isPureComputeRack
                            ? ['4U', '4U', '4U', '1U', '1U', '1U', '1U', '1U', '1U', '1U', '1U', '1U', '1U']
                            : ['4U', '4U', '4U', '1U', '1U', '1U', '1U', '1U', '1U', '1U', '1U']
                        : isPureComputeRack
                            ? ['4U', '2U', '1U', '1U', '4U', '2U', '1U', '1U', '2U']
                            : ['2U', '1U', '1U', '4U', '2U', '1U', '1U', '2U'];

                const gap = profile === 'hyperscale' ? 0.012 : 0.022;
                for (let i = 0; i < serverLayout.length; i++) {
                    const kind = serverLayout[i];
                    const unitH = kind === '4U' ? 0.34 : kind === '2U' ? 0.165 : 0.082;
                    const centerY = nextY - unitH / 2;
                    if (centerY - unitH / 2 < 0.14) break;

                    if (kind === '4U') {
                        serverNodeCount += 4;
                        addInstUnit(this.geos.chassis4U, this.mats.gpu4U, centerY, true);
                        addInstRearCords(centerY + 0.08);
                        addInstRearCords(centerY - 0.08);
                        this._registerUnitLeds(cabLeds, this.layouts.gpu4Leds, centerY, 0.424, i * 37 + idx * 5);
                    } else if (kind === '2U') {
                        serverNodeCount += 1;
                        addInstUnit(this.geos.chassis2U, this.mats.srv2U, centerY, true);
                        addInstRearCords(centerY);
                        this._registerUnitLeds(cabLeds, this.layouts.srv2Leds, centerY, 0.414, i * 23 + idx * 3);
                    } else {
                        serverNodeCount += 1;
                        addInstUnit(this.geos.chassis1U, this.mats.srv1U, centerY, true);
                        if (i % 2 === 0) addInstRearCords(centerY);
                        this._registerUnitLeds(cabLeds, this.layouts.srv1Leds, centerY, 0.404, i * 19 + idx * 7);
                    }
                    nextY -= unitH + gap;
                }
            }

            // 5. Doors (with Perimeter Frames) & Beacon
            pushInst(this.geos.beaconStrip, baseMeta.beacon, 0, 2.33, 0.53);

            for (const dz of [0.525, -0.525]) {
                pushInst(this.geos.doorStile, this.mats.doorFrame, -0.402, 1.13, dz);
                pushInst(this.geos.doorStile, this.mats.doorFrame, 0.402, 1.13, dz);
                pushInst(this.geos.doorRail, this.mats.doorFrame, 0, 2.146, dz);
                pushInst(this.geos.doorRail, this.mats.doorFrame, 0, 0.114, dz);
            }

            if (type === 'switch') {
                pushInst(this.geos.doorMeshFront, this.mats.glassCenter, 0, 1.13, 0.525);
            } else {
                pushInst(this.geos.doorMeshFront, this.mats.perfDoor, 0, 1.13, 0.525);
            }
            pushInst(this.geos.latch, this.mats.rail, 0.402, 1.12, 0.545);
            pushInst(this.geos.doorMeshSplit, this.mats.perfDoorRear, -0.192, 1.13, -0.525);
            pushInst(this.geos.doorMeshSplit, this.mats.perfDoorRear, 0.192, 1.13, -0.525);
            pushInst(this.geos.latch, this.mats.rail, 0.02, 1.12, -0.545);

            // Transform cabinet LEDs into batch space
            cabLeds.forEach((led) => {
                _localPos.set(led.x, led.y, led.z);
                _localPos.applyMatrix4(_rackMat);
                pendingLeds.push({
                    pos: _localPos.clone(),
                    quat: _rackQuat.clone(),
                    role: led.role,
                    seed: led.seed + pendingLeds.length * 7,
                });
            });

            // Draw rack nameplate into texture atlas slot & construct merged badge plane
            const col = idx % atlasCols;
            const row = Math.floor(idx / atlasCols);
            const ax = col * slotW;
            const ay = row * slotH;
            atlasCtx.fillStyle = '#0f172a';
            atlasCtx.fillRect(ax, ay, slotW, slotH);
            atlasCtx.strokeStyle = baseMeta.accent;
            atlasCtx.lineWidth = 3;
            atlasCtx.strokeRect(ax + 3, ay + 3, slotW - 6, slotH - 6);
            atlasCtx.fillStyle = '#f8fafc';
            atlasCtx.font = 'bold 20px monospace';
            atlasCtx.fillText(code, ax + 14, ay + 25);
            atlasCtx.fillStyle = baseMeta.accent;
            atlasCtx.font = 'bold 12px sans-serif';
            atlasCtx.fillText(roleLabel, ax + 14, ay + 41);

            const u0 = ax / atlasCanvas.width;
            const u1 = (ax + slotW) / atlasCanvas.width;
            const vTop = 1 - ay / atlasCanvas.height;
            const vBot = 1 - (ay + slotH) / atlasCanvas.height;

            const bGeo = this.geos.badgePlane.clone();
            const uvAttr = bGeo.attributes.uv;
            uvAttr.setXY(0, u0, vTop);
            uvAttr.setXY(1, u1, vTop);
            uvAttr.setXY(2, u0, vBot);
            uvAttr.setXY(3, u1, vBot);
            uvAttr.needsUpdate = true;

            _localPos.set(0, 2.24, 0.56);
            _localQuat.identity();
            _localScale.set(1, 1, 1);
            _localMat.compose(_localPos, _localQuat, _localScale);
            _worldMat.multiplyMatrices(_rackMat, _localMat);
            bGeo.applyMatrix4(_worldMat);
            badgeGeos.push(bGeo);

            // Raycast hit proxy (tiny metadata handle; cheap & clean)
            const hitBox = new THREE.Mesh(this.geos.hitBox, this.hitBoxMat);
            hitBox.position.set(spec.x, baseY + 1.14, spec.z);
            hitBox.rotation.y = rotY;
            const meta = this._buildInspectMeta(type, code, podName, isPureComputeRack);
            if (type === 'server' && serverNodeCount > 0) {
                meta.specs = `${serverNodeCount} Fiziksel Düğüm (4U 4-Node Blade & 1U NVMe) · ${isPureComputeRack ? 'EoR Topoloji' : 'ToR 25G Switch'
                    } · Çift Besleme A+B`;
            }
            hitBox.userData.inspect = meta;
            inspectables.push(hitBox);
            hitBoxes.push(hitBox);
        });

        // Emit one InstancedMesh per unique geometry+material bucket
        buckets.forEach((b) => {
            const inst = new THREE.InstancedMesh(b.geo, b.mat, b.matrices.length);
            inst.castShadow = b.castShadow;
            inst.receiveShadow = b.receiveShadow;
            for (let i = 0; i < b.matrices.length; i++) {
                inst.setMatrixAt(i, b.matrices[i]);
            }
            inst.instanceMatrix.needsUpdate = true;
            inst.computeBoundingSphere();
            batchGroup.add(inst);
        });

        // Emit 1 merged nameplate atlas mesh
        if (badgeGeos.length > 0) {
            const atlasTex = new THREE.CanvasTexture(atlasCanvas);
            atlasTex.colorSpace = THREE.SRGBColorSpace;
            atlasTex.anisotropy = 4;
            atlasTex.needsUpdate = true;
            const mergedBadges = buildMergedGeo(badgeGeos);
            const badgeMesh = new THREE.Mesh(mergedBadges, new THREE.MeshBasicMaterial({ map: atlasTex }));
            batchGroup.add(badgeMesh);
        }

        hitBoxes.forEach((hb) => batchGroup.add(hb));

        if (parent) {
            parent.add(batchGroup);
        }

        return {
            batchGroup,
            pendingLeds,
            cabinetCount: specs.length,
        };
    }

    /**
     * Bakes port-aligned switch & server LEDs into a single 1-draw-call InstancedMesh.
     * Supports isolated per-zone LED batches and round-robin chunked updates for 30,000+ LEDs.
     */
    finalizeLedSystem(targetParent, cabinets = [], options = {}) {
        const localLedDefs = [];

        if (Array.isArray(options.precomputedLeds)) {
            options.precomputedLeds.forEach((led) => localLedDefs.push(led));
        }

        cabinets.forEach((cab) => {
            cab.updateMatrixWorld(true);
            const pending = cab.userData._pendingLeds || [];
            pending.forEach((led) => {
                _tempPos.set(led.x, led.y, led.z);
                cab.localToWorld(_tempPos);
                cab.getWorldQuaternion(_tempQuat);
                localLedDefs.push({
                    pos: _tempPos.clone(),
                    quat: _tempQuat.clone(),
                    role: led.role,
                    seed: led.seed + localLedDefs.length * 7,
                });
            });
            delete cab.userData._pendingLeds;
        });

        const total = localLedDefs.length;
        if (total === 0) {
            const noop = () => { };
            noop.setActive = () => { };
            noop.count = 0;
            noop.mesh = null;
            return noop;
        }

        // Crisp micro-LED matching real RJ45/SFP+ port indicator windows & NVMe caddy LEDs
        const ledGeo = new THREE.BoxGeometry(0.0085, 0.0052, 0.007);
        const ledMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const inst = new THREE.InstancedMesh(ledGeo, ledMat, total);
        inst.instanceMatrix.setUsage(THREE.StaticDrawUsage);

        for (let i = 0; i < total; i++) {
            const def = localLedDefs[i];
            _tempMat.compose(def.pos, def.quat, _tempScale);
            inst.setMatrixAt(i, _tempMat);
            inst.setColorAt(i, _ledColor.setHex(0x22c55e));
        }
        inst.instanceMatrix.needsUpdate = true;
        inst.instanceColor.needsUpdate = true;
        inst.computeBoundingSphere();
        targetParent.add(inst);

        const chunkSize = options.chunkSize ?? 2400;
        const isLargeBatch = total > chunkSize;
        let cursor = 0;
        let lastUpdate = -1;
        let active = true;

        const evalLedHex = (elapsed, s, role) => {
            if (role === 'port_active') {
                const w1 = Math.sin(elapsed * (11.0 + (s % 9) * 2.3) + s * 1.37);
                const w2 = Math.cos(elapsed * (19.0 + (s % 5) * 3.1) + s * 0.71);
                if (w1 > 0.35 && w2 > -0.15) return 0x4ade80;
                if (w1 < -0.78 && w2 < -0.5) return 0x14532d;
                return 0x22c55e;
            }
            if (role === 'port_uplink') {
                const w = Math.sin(elapsed * (14.0 + (s % 7) * 2.7) + s * 1.91);
                if (w > 0.45) return 0x2dd4bf;
                if (w < -0.65) return 0x065f46;
                return 0x10b981;
            }
            if (role === 'port_amber') {
                const pulse = Math.sin(elapsed * 3.4 + s);
                return pulse > -0.2 ? 0xf59e0b : 0x78350f;
            }
            if (role === 'srv_power') return 0x22c55e;
            if (role === 'srv_uid') return s % 7 === 0 ? 0x38bdf8 : 0x1e3a8a;
            if (role === 'srv_drive') {
                const io = Math.sin(elapsed * (9.5 + (s % 6) * 2.4) + s * 2.1);
                if (io > 0.4) return 0x4ade80;
                if (io < -0.6) return 0x0c4a6e;
                return 0x16a34a;
            }
            const io = Math.sin(elapsed * (7.0 + (s % 4) * 2.0) + s);
            if (s % 11 === 0) return io > 0.2 ? 0xf59e0b : 0x78350f;
            return io > 0.3 ? 0x4ade80 : io < -0.65 ? 0x064e3b : 0x22c55e;
        };

        const updateLeds = (elapsed) => {
            if (!active) return;
            const minInterval = isLargeBatch ? 0.065 : 0.08;
            if (elapsed - lastUpdate < minInterval) return;
            lastUpdate = elapsed;

            if (!isLargeBatch) {
                for (let i = 0; i < total; i++) {
                    const def = localLedDefs[i];
                    inst.setColorAt(i, _ledColor.setHex(evalLedHex(elapsed, def.seed, def.role)));
                }
            } else {
                // Round-robin budget slice for 30,000+ LED hyperscale halls (<0.3ms/frame)
                const end = Math.min(total, cursor + chunkSize);
                for (let i = cursor; i < end; i++) {
                    const def = localLedDefs[i];
                    inst.setColorAt(i, _ledColor.setHex(evalLedHex(elapsed, def.seed, def.role)));
                }
                cursor = end >= total ? 0 : end;
            }
            inst.instanceColor.needsUpdate = true;
        };

        updateLeds.setActive = (nextActive) => {
            active = Boolean(nextActive);
            inst.visible = active;
        };
        updateLeds.count = total;
        updateLeds.mesh = inst;

        return updateLeds;
    }
}

