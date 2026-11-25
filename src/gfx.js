/*
 * AO trailer — graphic-design primitives (Canvas2D): kinetic type, barcodes,
 * UI ticks, target brackets, halftone fields, rings/arcs, deterministic shards,
 * particles, snow-crystal emblem. All deterministic (seeded) for scrubbing.
 */
(function () {
  'use strict';
  const AO = window.AO;
  const { prng, clamp, lerp, DEG } = AO;
  const FONT = '"Arial Black", "Helvetica Neue", Helvetica, Arial, sans-serif';
  const MONO = '"SF Mono", Menlo, Consolas, monospace';

  function font(size, weight = 900, fam = FONT) {
    return `${weight} ${size}px ${fam}`;
  }
  // Big display text. o: { size, fill, stroke, lw, align, base, track, sx, sy, rot, alpha }
  function text(ctx, str, x, y, o) {
    ctx.save();
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    ctx.scale(o.sx ?? 1, o.sy ?? 1);
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    ctx.font = font(o.size, o.weight || 900, o.mono ? MONO : FONT);
    ctx.textAlign = o.align || 'center';
    ctx.textBaseline = o.base || 'alphabetic';
    if (o.track) ctx.letterSpacing = o.track + 'px';
    if (o.fill) {
      ctx.fillStyle = o.fill;
      ctx.fillText(str, 0, 0);
    }
    if (o.stroke) {
      ctx.lineJoin = 'round';
      ctx.strokeStyle = o.stroke;
      ctx.lineWidth = o.lw || 4;
      ctx.strokeText(str, 0, 0);
    }
    ctx.restore();
  }
  function measure(ctx, str, size, track = 0) {
    ctx.save();
    ctx.font = font(size);
    ctx.letterSpacing = track + 'px';
    const w = ctx.measureText(str).width;
    ctx.restore();
    return w;
  }
  // Per-letter layout (for squash/scatter). Returns [{ch, x, w}] centered on 0.
  function letters(ctx, str, size, track = 0) {
    ctx.save();
    ctx.font = font(size);
    const ws = [...str].map((c) => ctx.measureText(c).width);
    ctx.restore();
    const total = ws.reduce((a, b) => a + b, 0) + track * (ws.length - 1);
    let x = -total / 2;
    return [...str].map((ch, i) => {
      const o = { ch, x: x + ws[i] / 2, w: ws[i] };
      x += ws[i] + track;
      return o;
    });
  }

  function barcode(ctx, x, y, w, h, seed, color, alpha = 1) {
    const r = prng(seed);
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    let cx = x;
    while (cx < x + w) {
      const bw = (r() < 0.3 ? 3 : r() < 0.6 ? 2 : 1) * (w / 140);
      if (r() > 0.35) ctx.fillRect(cx, y, bw, h);
      cx += bw + (w / 140) * (r() < 0.5 ? 1 : 2);
    }
    ctx.font = font(h * 0.18, 500, MONO);
    ctx.textBaseline = 'top';
    ctx.fillText('AK-' + (1000 + Math.floor(r() * 8999)) + '  //  2026', x, y + h + 6);
    ctx.restore();
  }

  function ticks(ctx, x, y, w, n, color, o = {}) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = o.lw || 2;
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const xx = x + (w * i) / n;
      const len = i % 5 === 0 ? (o.big || 22) : (o.small || 10);
      ctx.moveTo(xx, y);
      ctx.lineTo(xx, y + len);
    }
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.stroke();
    if (o.labels) {
      ctx.font = font(13, 600, MONO);
      for (let i = 0; i <= n; i += 5) ctx.fillText(String(i * (o.step || 1)).padStart(2, '0'), x + (w * i) / n + 3, y + 36);
    }
    ctx.restore();
  }

  function brackets(ctx, cx, cy, size, color, lw, rot = 0, len = 0.28) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = 'square';
    const s = size / 2, l = size * len;
    ctx.beginPath();
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      ctx.moveTo(sx * s, sy * s + -sy * l);
      ctx.lineTo(sx * s, sy * s);
      ctx.lineTo(sx * s + -sx * l, sy * s);
    }
    ctx.stroke();
    ctx.restore();
  }

  function halftone(ctx, x, y, w, h, gap, color, dir = 'x', maxR = 0.48) {
    ctx.save();
    ctx.fillStyle = color;
    for (let yy = 0; yy <= h; yy += gap) {
      for (let xx = 0; xx <= w; xx += gap) {
        const k = dir === 'x' ? xx / w : dir === 'y' ? yy / h : 1 - Math.hypot(xx - w / 2, yy - h / 2) / (Math.max(w, h) / 2);
        const r = clamp(k) * gap * maxR;
        if (r < 0.4) continue;
        ctx.beginPath();
        ctx.arc(x + xx + ((yy / gap) % 2 ? gap / 2 : 0), y + yy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function ring(ctx, cx, cy, r, lw, color, alpha = 1, a0 = 0, a1 = Math.PI * 2, dash) {
    if (r <= 0 || alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.arc(cx, cy, r, a0, a1);
    ctx.stroke();
    ctx.restore();
  }
  function disc(ctx, cx, cy, r, color, alpha = 1) {
    if (r <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Shatter set: fan triangles from an impact point across a rect or circle.
  function makeShards(seed, shape) {
    const r = prng(seed);
    const out = [];
    const { cx, cy } = shape;
    const N = shape.n || 22;
    const pts = [];
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + (r() - 0.5) * 0.25;
      let rad;
      if (shape.r) rad = shape.r;
      else {
        // rect perimeter distance along angle
        const hw = shape.w / 2, hh = shape.h / 2;
        rad = Math.min(Math.abs(hw / (Math.cos(a) || 1e-6)), Math.abs(hh / (Math.sin(a) || 1e-6))) * 1.02;
      }
      pts.push([Math.cos(a) * rad, Math.sin(a) * rad]);
    }
    for (let i = 0; i < N; i++) {
      const p1 = pts[i], p2 = pts[(i + 1) % N];
      // split each wedge into an inner and outer piece
      const k = 0.35 + r() * 0.3;
      const m1 = [p1[0] * k, p1[1] * k], m2 = [p2[0] * k, p2[1] * k];
      for (const poly of [[[0, 0], m1, m2], [m1, p1, p2, m2]]) {
        const c = poly.reduce((a, p) => [a[0] + p[0] / poly.length, a[1] + p[1] / poly.length], [0, 0]);
        out.push({
          poly: poly.map((p) => [p[0] - c[0], p[1] - c[1]]),
          c: [cx + c[0], cy + c[1]],
          dir: Math.atan2(c[1], c[0]) + (r() - 0.5) * 0.5,
          spd: 0.6 + r() * 0.8,
          rot: (r() - 0.5) * 9,
          col: shape.colors ? shape.colors[Math.floor(r() * shape.colors.length)] : null,
        });
      }
    }
    return out;
  }
  // p: 0..1 progress. o: { dist, gravity, fade, color, scaleToCam }
  function drawShards(ctx, shards, p, o) {
    const dist = o.dist || 900;
    for (const s of shards) {
      const e = 1 - Math.pow(1 - p, 2.2);
      const d = e * dist * s.spd;
      const x = s.c[0] + Math.cos(s.dir) * d;
      const y = s.c[1] + Math.sin(s.dir) * d + (o.gravity || 0) * p * p;
      const sc = o.scaleToCam ? 1 + e * o.scaleToCam * s.spd : 1;
      const a = o.fade ? 1 - AO.smoothstep(o.fade, 1, p) : 1;
      if (a <= 0) continue;
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.translate(x, y);
      ctx.rotate(s.rot * e);
      ctx.scale(sc, sc);
      ctx.beginPath();
      ctx.moveTo(s.poly[0][0], s.poly[0][1]);
      for (let i = 1; i < s.poly.length; i++) ctx.lineTo(s.poly[i][0], s.poly[i][1]);
      ctx.closePath();
      ctx.fillStyle = s.col || o.color;
      ctx.fill();
      if (o.edge) {
        ctx.strokeStyle = o.edge;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Deterministic emitter: particles born at fixed times along a path.
  // emit(i) -> {t0, x, y, vx, vy, size, col}; drawn with drag + gravity.
  function particles(ctx, t, count, emit, o = {}) {
    const life = o.life || 0.6, drag = o.drag ?? 2.5, g = o.gravity ?? 900;
    for (let i = 0; i < count; i++) {
      const P = emit(i);
      const age = t - P.t0;
      if (age < 0 || age > life) continue;
      const k = (1 - Math.exp(-drag * age)) / drag;
      const x = P.x + P.vx * k;
      const y = P.y + P.vy * k + 0.5 * g * age * age;
      const a = 1 - age / life;
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.translate(x, y);
      ctx.rotate(P.rot ? P.rot * age : 0);
      ctx.fillStyle = P.col;
      const s = P.size * (o.grow ? 1 + age * o.grow : 1);
      if (P.shape === 'dot') {
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // frost diamond
        ctx.beginPath();
        ctx.moveTo(0, -s * 1.6);
        ctx.lineTo(s * 0.6, 0);
        ctx.lineTo(0, s * 1.6);
        ctx.lineTo(-s * 0.6, 0);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function snowCrystal(ctx, cx, cy, r, color, lw, rot = 0) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 3);
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -r);
      for (const k of [0.45, 0.72]) {
        ctx.moveTo(0, -r * k);
        ctx.lineTo(r * 0.2, -r * (k + 0.16));
        ctx.moveTo(0, -r * k);
        ctx.lineTo(-r * 0.2, -r * (k + 0.16));
      }
      ctx.restore();
    }
    ctx.stroke();
    ctx.restore();
  }

  // Rough black circular emblem w/ ghosted crystal + barcode (CUT 13).
  function emblem(ctx, cx, cy, r, t, seed = 7) {
    const rr = prng(seed);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    const N = 90;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const rough = r * (1 + (rr() - 0.5) * 0.035);
      const x = Math.cos(a) * rough, y = Math.sin(a) * rough;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = '#05070B';
    ctx.fill();
    ctx.globalAlpha = 0.22;
    snowCrystal(ctx, 0, 0, r * 0.72, '#BFF3FF', r * 0.03, t * 0.15);
    ctx.globalAlpha = 0.18;
    barcode(ctx, -r * 0.45, r * 0.28, r * 0.9, r * 0.22, seed + 3, '#BFF3FF');
    ctx.globalAlpha = 1;
    ring(ctx, 0, 0, r * 0.86, r * 0.012, '#7EE8FA', 0.6, 0, Math.PI * 2, [r * 0.04, r * 0.03]);
    ctx.restore();
  }

  // 2D camera: world origin at screen center.
  function camera(ctx, c) {
    ctx.translate(AO.W / 2, AO.H / 2);
    ctx.scale(c.zoom || 1, c.zoom || 1);
    ctx.rotate((c.rot || 0) * DEG);
    ctx.translate(-(c.x || 0), -(c.y || 0));
  }

  function fill(ctx, color) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, AO.W, AO.H);
    ctx.restore();
  }

  // Horizontal speed streaks (trailing behind a mover).
  function streaks(ctx, x, y, len, n, color, seed, t, spread = 260) {
    const r = prng(seed);
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const yy = y + (r() - 0.5) * spread;
      const l = len * (0.4 + r() * 0.8);
      const off = ((t * 3 + r()) % 1) * 60;
      ctx.lineWidth = 2 + r() * 6;
      ctx.globalAlpha = 0.35 + r() * 0.5;
      ctx.beginPath();
      ctx.moveTo(x - off, yy);
      ctx.lineTo(x - off - l, yy);
      ctx.stroke();
    }
    ctx.restore();
  }

  Object.assign(AO, {
    FONT, MONO, font, text, measure, letters, barcode, ticks, brackets, halftone, ring, disc,
    makeShards, drawShards, particles, snowCrystal, emblem, camera, fill, streaks,
  });
  void lerp;
})();
