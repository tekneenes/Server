const ROOMS = [
  { id: 'lobby', label: 'Giriş Lobisi', x1: -18, x2: -5, z1: 5, z2: 13, fill: '#1e293b', walkPos: [-11.5, 9.5] },
  { id: 'noc', label: 'Kontrol Merkezi (NOC)', x1: -18, x2: -7, z1: -5, z2: 5, fill: '#0c233a', walkPos: [-10.0, 0.0] },
  { id: 'mech', label: 'Soğutma Odası', x1: -18, x2: -7, z1: -13, z2: -5, fill: '#172536', walkPos: [-12.5, -7.2] },
  { id: 'server', label: 'Sunucu Salonu', x1: -7, x2: 9, z1: -13, z2: 5, fill: '#0f1c2e', walkPos: [-5.2, -0.9] },
  { id: 'staging', label: 'Güvenlik & Staging', x1: -5, x2: 9, z1: 5, z2: 13, fill: '#1b2432', walkPos: [1.2, 8.8] },
  { id: 'power', label: 'Güç & UPS Odası', x1: 9, x2: 18, z1: -13, z2: 13, fill: '#22211e', walkPos: [13.0, -3.5] },
];

export function getZoneKeyAt(x, z) {
  for (const r of ROOMS) {
    if (x >= r.x1 && x <= r.x2 && z >= r.z1 && z <= r.z2) {
      return r.id;
    }
  }
  return null;
}

export function getZoneNameAt(x, z) {
  if (x >= -3.5 && x <= 2.8 && z >= -9.0 && z <= -6.8) return 'Soğuk Koridor A (Pod A)';
  if (x >= -3.5 && x <= 2.8 && z >= -2.0 && z <= 0.2) return 'Soğuk Koridor B (Pod B)';
  for (const r of ROOMS) {
    if (x >= r.x1 && x <= r.x2 && z >= r.z1 && z <= r.z2) {
      return r.label;
    }
  }
  if (x >= 20 && x <= 27 && z >= -11 && z <= 6) return 'Jeneratör Sahası (Dış)';
  if (x >= -16 && x <= 0 && z >= -21 && z <= -14) return 'Chiller Soğutma Sahası (Dış)';
  if (x >= -1 && x <= 17 && z >= 13.2 && z <= 24.5) return 'Otopark & Araç Girişi';
  if (x >= -23 && x <= -2.5 && z >= 13.0 && z <= 24.5) return 'Kampüs Giriş Meydanı';
  return 'Dış Kampüs';
}

export function createBlueprintController(canvas, onTeleport) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // World bounds mapped to canvas
  const minX = -24;
  const maxX = 27;
  const minZ = -22;
  const maxZ = 25;

  const toCanvasX = (wx) => ((wx - minX) / (maxX - minX)) * (w - 16) + 8;
  const toCanvasY = (wz) => ((wz - minZ) / (maxZ - minZ)) * (h - 16) + 8;

  const toWorldX = (cx) => ((cx - 8) / (w - 16)) * (maxX - minX) + minX;
  const toWorldZ = (cy) => ((cy - 8) / (h - 16)) * (maxZ - minZ) + minZ;

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * w;
    const cy = ((e.clientY - rect.top) / rect.height) * h;
    const wx = toWorldX(cx);
    const wz = toWorldZ(cy);

    // Snap into room safe point if clicked inside a room, else use exact world point
    for (const r of ROOMS) {
      if (wx >= r.x1 && wx <= r.x2 && wz >= r.z1 && wz <= r.z2) {
        onTeleport(r.walkPos[0], r.walkPos[1], r.id);
        return;
      }
    }
    if (wx >= -16 && wx <= 0 && wz >= -21 && wz <= -14) {
      onTeleport(wx, wz, 'chiller');
      return;
    }
    if (wx >= 20 && wx <= 27 && wz >= -11 && wz <= 6) {
      onTeleport(wx, wz, 'generator');
      return;
    }
    onTeleport(wx, wz, 'campus');
  });

  function render(camX, camZ, yawRad) {
    ctx.fillStyle = '#0b111a';
    ctx.fillRect(0, 0, w, h);

    // Draw exterior chiller & generator outlines
    ctx.fillStyle = '#132030';
    [-13.5, -8.5, -3.5].forEach((cx) => {
      ctx.fillRect(toCanvasX(cx - 1.2), toCanvasY(-20), toCanvasX(cx + 1.2) - toCanvasX(cx - 1.2), 18);
    });
    ctx.fillStyle = '#3b2d14';
    [-6.5, 1.5].forEach((gz) => {
      ctx.fillRect(toCanvasX(22.2), toCanvasY(gz - 2.8), 14, toCanvasY(gz + 2.8) - toCanvasY(gz - 2.8));
    });

    // Draw rooms
    ROOMS.forEach((r) => {
      const rx = toCanvasX(r.x1);
      const ry = toCanvasY(r.z1);
      const rw = toCanvasX(r.x2) - rx;
      const rh = toCanvasY(r.z2) - ry;

      const isActive = camX >= r.x1 && camX <= r.x2 && camZ >= r.z1 && camZ <= r.z2;
      ctx.fillStyle = isActive ? '#143352' : r.fill;
      ctx.fillRect(rx, ry, rw, rh);

      ctx.strokeStyle = isActive ? '#38bdf8' : '#475569';
      ctx.lineWidth = isActive ? 1.5 : 1;
      ctx.strokeRect(rx, ry, rw, rh);

      ctx.fillStyle = isActive ? '#e0f2fe' : '#94a3b8';
      ctx.font = '600 8px sans-serif';
      ctx.fillText(r.label.split(' ')[0], rx + 4, ry + 11);
    });

    // Draw individual Cabinets per row (Switch = Cyan, Server = Emerald, Storage = Amber)
    for (const rz of [-9.6, -6.2, -2.6, 0.8]) {
      const y1 = toCanvasY(rz - 0.5);
      const y2 = toCanvasY(rz + 0.5);
      const ch = Math.max(3, y2 - y1);
      for (let i = 0; i < 6; i++) {
        const cx = -3.0 + i * 1.05;
        const x1 = toCanvasX(cx - 0.44);
        const x2 = toCanvasX(cx + 0.44);
        ctx.fillStyle = i === 0 ? '#38bdf8' : i === 5 ? '#f59e0b' : '#10b981';
        ctx.fillRect(x1, y1, Math.max(2, x2 - x1), ch);
      }
    }

    // Draw Edge & Core Network 3-rack group along South-East wall of Server Hall (x=8.15)
    for (const [nz, nCol] of [
      [-0.1, '#38bdf8'],
      [1.0, '#f97316'],
      [2.1, '#22d3ee'],
    ]) {
      ctx.fillStyle = nCol;
      ctx.fillRect(toCanvasX(7.65), toCanvasY(nz - 0.44), Math.max(3, toCanvasX(8.65) - toCanvasX(7.65)), Math.max(3, toCanvasY(nz + 0.44) - toCanvasY(nz - 0.44)));
    }

    // Draw NOC-IDF-01 Switch Cabinet & 4 NOC Operator Consoles
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(toCanvasX(-8.8), toCanvasY(-4.85), Math.max(3, toCanvasX(-7.9) - toCanvasX(-8.8)), Math.max(3, toCanvasY(-3.85) - toCanvasY(-4.85)));
    ctx.fillStyle = '#64748b';
    for (const [cx, cz] of [
      [-14.2, -2.0],
      [-14.2, 1.3],
      [-11.4, -2.0],
      [-11.4, 1.3],
    ]) {
      ctx.fillRect(toCanvasX(cx - 0.45), toCanvasY(cz - 1.1), Math.max(2, toCanvasX(cx + 0.45) - toCanvasX(cx - 0.45)), Math.max(4, toCanvasY(cz + 1.1) - toCanvasY(cz - 1.1)));
    }

    // Draw Security & Staging divider wall (x = 2.55, doorway z = 8..10.2) + SEC-NVR-01, TST-01, X-Ray & ESD Workbench
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(2.55), toCanvasY(5.0));
    ctx.lineTo(toCanvasX(2.55), toCanvasY(8.0));
    ctx.moveTo(toCanvasX(2.55), toCanvasY(10.2));
    ctx.lineTo(toCanvasX(2.55), toCanvasY(13.0));
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(toCanvasX(3.0), toCanvasY(5.3), 4, 4);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(toCanvasX(7.0), toCanvasY(10.8), 4, 4);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(toCanvasX(3.0), toCanvasY(10.9), Math.max(6, toCanvasX(6.1) - toCanvasX(3.0)), 4);
    ctx.fillRect(toCanvasX(-3.3), toCanvasY(5.8), Math.max(5, toCanvasX(-1.1) - toCanvasX(-3.3)), 4);

    // Draw Lobby: Reception desk, entrance mat, waiting lounge & centered turnstiles
    ctx.fillStyle = '#334155';
    ctx.fillRect(toCanvasX(-13.1), toCanvasY(11.1), Math.max(5, toCanvasX(-9.9) - toCanvasX(-13.1)), 3);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(toCanvasX(-15.9), toCanvasY(7.1), 4, Math.max(6, toCanvasY(10.7) - toCanvasY(7.1)));
    ctx.fillStyle = '#64748b';
    ctx.fillRect(toCanvasX(-8.8), toCanvasY(11.2), Math.max(6, toCanvasX(-5.9) - toCanvasX(-8.8)), 4);
    ctx.fillStyle = '#22c55e';
    for (const tz of [8.12, 9.1, 10.08]) {
      ctx.fillRect(toCanvasX(-7.0), toCanvasY(tz) - 1, 4, 2);
    }

    // Draw Soğutma Odası: Clean-Agent Novec-1230 Suppression Bank (red), Buffer Tank + PHE-01 + 3 Pumps (blue)
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(toCanvasX(-17.3), toCanvasY(-7.8), 5, 5);
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(toCanvasX(-16.9), toCanvasY(-11.7), 4, 4);
    ctx.fillRect(toCanvasX(-8.8), toCanvasY(-11.7), 4, 4);
    for (const px of [-13.9, -11.9, -9.9]) {
      ctx.fillRect(toCanvasX(px - 0.4), toCanvasY(-9.9), 3, 4);
    }

    // Draw Parking Lot, Vehicles, Nizamiye & South Campus Gates
    ctx.fillStyle = '#18202c';
    ctx.fillRect(
      toCanvasX(-1),
      toCanvasY(13.5),
      toCanvasX(17) - toCanvasX(-1),
      toCanvasY(22.9) - toCanvasY(13.5)
    );
    ctx.fillRect(
      toCanvasX(4.4),
      toCanvasY(22.7),
      toCanvasX(11.6) - toCanvasX(4.4),
      toCanvasY(24.5) - toCanvasY(22.7)
    );
    const carColors = ['#dc2626', '#10b981', '#2563eb', '#d6b68a'];
    [1.2, 4.4, 8.0, 11.6].forEach((cx, idx) => {
      ctx.fillStyle = carColors[idx];
      ctx.fillRect(toCanvasX(cx - 0.85), toCanvasY(14.3), 7, 13);
    });
    // Nizamiye & Parking Control Booth
    ctx.fillStyle = '#475569';
    ctx.fillRect(toCanvasX(-22.7), toCanvasY(19.2), 14, 9);
    ctx.fillRect(toCanvasX(12.6), toCanvasY(19.8), 8, 7);
    // Sliding Vehicle Gate & Pedestrian Gate markers
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(toCanvasX(4.4), toCanvasY(22.8), toCanvasX(11.6) - toCanvasX(4.4), 2.5);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(toCanvasX(-13.2), toCanvasY(22.8), toCanvasX(-7.8) - toCanvasX(-13.2), 2.5);

    // Draw doorway markers (gaps)
    ctx.fillStyle = '#22c55e';
    const doors = [
      [-11.5, 13],
      [-12.5, 5],
      [-5, 9.1],
      [-7, 3.2],
      [1.2, 5],
      [-7, -9],
      [9, -3.9],
      [9, 9.1],
      [17.82, 9.8],
    ];
    doors.forEach(([dx, dz]) => {
      ctx.fillRect(toCanvasX(dx) - 2, toCanvasY(dz) - 2, 4, 4);
    });

    // Player/Camera indicator & view cone
    const px = Math.max(8, Math.min(w - 8, toCanvasX(camX)));
    const py = Math.max(8, Math.min(h - 8, toCanvasY(camZ)));

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-yawRad);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-9, -18);
    ctx.lineTo(9, -18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(px, py, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  return { render };
}
