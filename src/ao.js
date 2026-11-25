/*
 * AO — procedural 2D anime streetwear character rig (Canvas2D, flat cel style).
 * Chin-length vivid blue bob with messy bangs, ice-blue eyes, light-blue knit beanie,
 * oversized white windbreaker (blue drawstrings, blue utility pocket on LEFT sleeve),
 * white crop top, light-blue drawstring shorts with barcode tag, chunky white/blue
 * platform sneakers. Design is locked: every cut renders through drawAO().
 *
 * Rig convention (character faces +x before `facing`): angles in degrees,
 * 0 = limb pointing straight down, positive = rotated forward (+x).
 * Torso angle tA: positive = lean forward. Knee kn: positive = shin folds back.
 * "f*" = near-side limbs (her right), "b*" = far-side limbs (her left).
 */
(function () {
  'use strict';
  const AO = window.AO;
  const { lerp, clamp, DEG } = AO;

  const PROP = { torso: 0.27, neck: 0.03, hr: 0.072, ua: 0.15, fa: 0.14, th: 0.235, sn: 0.225, sole: 0.055 };

  const BASE_PAL = {
    skin: '#FFE6D8', skinSh: '#F4C3B2', blush: 'rgba(255,120,140,0)',
    hair: '#1F6BFF', hairHi: '#6FB4FF', hairSh: '#0D3DC4',
    beanie: '#A8DAFF', beanieSh: '#78B6EE',
    jacket: '#F8FAFD', jacketSh: '#CAD5E6', crop: '#FFFFFF',
    shorts: '#9FD5FF', shortsSh: '#6BAEEA',
    shoe: '#FFFFFF', shoeBlue: '#2F6BFF', sole: '#E2E9F4',
    string: '#2F6BFF', pocket: '#2F6BFF',
    eyeW: '#FFFFFF', iris: '#62DCFF', irisDark: '#0A3A96', pupil: '#061633', lash: '#0B1226',
    line: '#0B1226', mouth: '#8E5A5A',
    flat: false,
  };
  const palCache = new Map();
  function mixHex(a, b, k) {
    const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
    const r = Math.round(lerp((pa >> 16) & 255, (pb >> 16) & 255, k));
    const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, k));
    const bl = Math.round(lerp(pa & 255, pb & 255, k));
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
  }
  // Flat silhouette palette (single color, no lines/details).
  function silhouette(color) {
    const key = 'S' + color;
    if (palCache.has(key)) return palCache.get(key);
    const p = {};
    for (const k in BASE_PAL) p[k] = color;
    p.flat = true;
    palCache.set(key, p);
    return p;
  }
  // Tinted palette (ghosts / posters): every fill pushed toward `color` by k.
  function tinted(color, k, lineColor) {
    const key = 'T' + color + k + (lineColor || '');
    if (palCache.has(key)) return palCache.get(key);
    const p = {};
    for (const n in BASE_PAL) {
      const v = BASE_PAL[n];
      p[n] = typeof v === 'string' && v[0] === '#' ? mixHex(v, color, k) : v;
    }
    p.line = lineColor || mixHex(BASE_PAL.line, color, k * 0.5);
    palCache.set(key, p);
    return p;
  }

  // ------------------------------------------------------------------ poses
  const P = (o) => Object.assign({
    tA: 0, hA: 0, turn: 0.6,
    fSh: 8, fEl: 12, bSh: -8, bEl: 12,
    fHip: 6, fKn: 4, bHip: -6, bKn: 4, fFt: 0, bFt: 0,
    flare: 0, smile: 0, lookY: 0, lookX: 0, lid: 0.12, pocket: 0,
  }, o);

  const POSES = {
    stand: P({ turn: 0.85, fSh: -12, fEl: 8, bSh: 12, bEl: -8, fHip: -4, bHip: 4 }),
    pockets: P({ turn: 0.88, hA: -3, fSh: -20, fEl: 50, bSh: 20, bEl: -50, fHip: -5, fKn: 2, bHip: 6, bKn: 2, pocket: 1, smile: 0.35, lid: 0.28 }),
    runA: P({ turn: 0.15, tA: 16, hA: -10, fSh: -48, fEl: 85, bSh: 52, bEl: 70, fHip: 58, fKn: 28, bHip: -34, bKn: 96, fFt: 10, bFt: -30, flare: 0.8, lid: 0.25 }),
    runB: P({ turn: 0.15, tA: 16, hA: -10, fSh: 52, fEl: 70, bSh: -48, bEl: 85, fHip: -34, fKn: 96, bHip: 58, bKn: 28, fFt: -30, bFt: 10, flare: 0.8, lid: 0.25 }),
    slide: P({ turn: 0.3, tA: -26, hA: 12, fSh: 105, fEl: 12, bSh: -115, bEl: -12, fHip: 84, fKn: 4, bHip: -8, bKn: 128, fFt: 20, bFt: -40, flare: 1, lid: 0.3, smile: 0.2 }),
    takeoff: P({ turn: 0.25, tA: 24, hA: -12, fSh: -62, fEl: 72, bSh: 64, bEl: 40, fHip: 72, fKn: 84, bHip: -32, bKn: 12, fFt: -10, bFt: -40, flare: 0.7, lid: 0.3 }),
    tuck: P({ turn: 0.35, tA: 32, hA: 18, fSh: 62, fEl: 95, bSh: 52, bEl: 95, fHip: 118, fKn: 145, bHip: 104, bKn: 148, fFt: 20, bFt: 20, flare: 0.9, lid: 0.35 }),
    land: P({ turn: 0.45, tA: 30, hA: -16, fSh: 72, fEl: 14, bSh: -60, bEl: 20, fHip: 74, fKn: 118, bHip: 20, bKn: 112, fFt: 0, bFt: 0, flare: 0.6, lid: 0.3 }),
    leap: P({ turn: 0.6, tA: -4, hA: -6, fSh: -135, fEl: -14, bSh: 140, bEl: 12, fHip: 32, fKn: 46, bHip: -22, bKn: 56, flare: 1, smile: 0.4, lid: 0.25 }),
    vaultPlant: P({ turn: 0.3, tA: 62, hA: -40, fSh: -8, fEl: 0, bSh: 85, bEl: 25, fHip: 100, fKn: 18, bHip: 86, bKn: 34, fFt: 10, bFt: 10, flare: 1, lid: 0.3 }),
    layout: P({ turn: 0.3, tA: -8, hA: 10, fSh: 168, fEl: 6, bSh: 158, bEl: 8, fHip: 8, fKn: 6, bHip: -6, bKn: 10, flare: 1 }),
    kneeSlide: P({ turn: 0.5, tA: -34, hA: 16, fSh: -62, fEl: 22, bSh: 118, bEl: 12, fHip: 62, fKn: 150, bHip: 42, bKn: 142, fFt: -40, bFt: -40, flare: 1, smile: 0.45, lid: 0.32 }),
    freeze: P({ turn: 0.9, tA: 0, hA: -6, fSh: -122, fEl: -22, bSh: 122, bEl: 22, fHip: -22, fKn: -10, bHip: 30, bKn: 70, flare: 0.8, smile: 0.25, lid: 0.2 }),
    dive: P({ turn: 1, tA: 0, hA: 4, fSh: -150, fEl: -18, bSh: 150, bEl: 18, fHip: -16, fKn: -22, bHip: 16, bKn: 22, flare: 1, smile: 0.3, lid: 0.15 }),
    heroLand: P({ turn: 0.7, tA: 34, hA: -24, fSh: 26, fEl: 20, bSh: -105, bEl: 12, fHip: 82, fKn: 132, bHip: 10, bKn: 140, flare: 1, lid: 0.35 }),
    wave: P({ turn: 0.88, hA: -4, fSh: -150, fEl: -30, bSh: 20, bEl: -50, fHip: -5, fKn: 2, bHip: 6, bKn: 2, pocket: 0, smile: 0.6, lid: 0.3 }),
  };

  function blend(a, b, k) {
    const o = {};
    for (const key in a) o[key] = typeof a[key] === 'number' ? lerp(a[key], b[key] ?? a[key], k) : a[key];
    return o;
  }
  // Run cycle: phase in cycles (1 = two steps). Smooth cosine blend A<->B.
  function runPose(phase) {
    const k = 0.5 - 0.5 * Math.cos(phase * Math.PI * 2);
    return blend(POSES.runA, POSES.runB, k);
  }

  // ------------------------------------------------------------------ rig
  const dirv = (a) => [Math.sin(a * DEG), Math.cos(a * DEG)];
  const upv = (a) => [Math.sin(a * DEG), -Math.cos(a * DEG)];
  const add = (p, v, s = 1) => [p[0] + v[0] * s, p[1] + v[1] * s];

  function rig(pose, h) {
    const U = upv(pose.tA);
    const Pp = [Math.cos(pose.tA * DEG), Math.sin(pose.tA * DEG)];
    const tn = pose.turn;
    const pel = [0, 0];
    const neck = add(pel, U, PROP.torso * h);
    const shB = add(pel, U, PROP.torso * h * 0.9);
    const sw = 0.095 * h * tn, hw = 0.058 * h * tn;
    const sF = add(shB, Pp, -sw), sB = add(shB, Pp, sw);
    const hF = add(pel, Pp, -hw), hB = add(pel, Pp, hw);
    const arm = (s, sh, el) => {
      const e = add(s, dirv(sh), PROP.ua * h);
      const w = add(e, dirv(sh + el), PROP.fa * h);
      return { s, e, w, hand: add(w, dirv(sh + el), 0.028 * h), a1: sh, a2: sh + el };
    };
    const leg = (hp, hip, kn, ft) => {
      const k = add(hp, dirv(hip), PROP.th * h);
      const sa = hip - kn;
      const a = add(k, dirv(sa), PROP.sn * h);
      return { h: hp, k, a, a1: hip, a2: sa, ft: sa + ft };
    };
    const headA = pose.tA + pose.hA;
    const neckTop = add(neck, U, PROP.neck * h);
    const head = add(neckTop, upv(headA), PROP.hr * h * 0.92);
    return {
      U, Pp, pel, neck, neckTop, head, headA,
      fArm: arm(sF, pose.fSh, pose.fEl), bArm: arm(sB, pose.bSh, pose.bEl),
      fLeg: leg(hF, pose.fHip, pose.fKn, pose.fFt), bLeg: leg(hB, pose.bHip, pose.bKn, pose.bFt),
    };
  }

  // Lowest point (sole bottom) below pelvis in char space — for grounding.
  function groundOffset(pose, h) {
    const R = rig(pose, h);
    let m = 0;
    for (const L of [R.fLeg, R.bLeg]) {
      const d = dirv(L.a2);
      m = Math.max(m, L.a[1] + d[1] * 0.075 * h);
    }
    return m;
  }

  // World transform matching drawAO's ctx transform.
  function toWorld(o, p) {
    const h = o.h;
    const off = o.pivot === 'com' ? 0.07 * h : 0;
    const sx = (o.facing || 1) * (o.sx ?? 1), sy = o.sy ?? 1;
    const x = p[0] * sx, y = (p[1] + off) * sy;
    const r = (o.spin || 0) * DEG, c = Math.cos(r), s = Math.sin(r);
    return [o.x + x * c - y * s, o.y + x * s + y * c];
  }
  function point(pose, o, name) {
    const R = rig(pose, o.h);
    const map = {
      head: R.head, neck: R.neck, pelvis: R.pel,
      fHand: R.fArm.hand, bHand: R.bArm.hand, fFoot: R.fLeg.a, bFoot: R.bLeg.a,
      chest: add(R.pel, R.U, PROP.torso * o.h * 0.6),
    };
    return toWorld(o, map[name] || R.pel);
  }

  // ------------------------------------------------------------------ drawing helpers
  function capsulePath(ctx, a, b, r1, r2) {
    const th = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const nx = Math.cos(th + Math.PI / 2), ny = Math.sin(th + Math.PI / 2);
    ctx.moveTo(a[0] + nx * r1, a[1] + ny * r1);
    ctx.lineTo(b[0] + nx * r2, b[1] + ny * r2);
    ctx.arc(b[0], b[1], r2, th + Math.PI / 2, th - Math.PI / 2, true);
    ctx.lineTo(a[0] - nx * r1, a[1] - ny * r1);
    ctx.arc(a[0], a[1], r1, th - Math.PI / 2, th + Math.PI / 2, true);
    ctx.closePath();
  }
  function fillStroke(ctx, fill, pal, lw) {
    ctx.fillStyle = fill;
    ctx.fill();
    if (!pal.flat && lw > 0) {
      ctx.strokeStyle = pal.line;
      ctx.lineWidth = lw;
      ctx.stroke();
    }
  }
  function capsule(ctx, a, b, r1, r2, fill, pal, lw) {
    ctx.beginPath();
    capsulePath(ctx, a, b, r1, r2);
    fillStroke(ctx, fill, pal, lw);
  }
  function poly(ctx, pts, fill, pal, lw, smooth) {
    ctx.beginPath();
    if (smooth) {
      // Closed Catmull-Rom-ish via quadratic midpoints → soft cloth/hair edges.
      const n = pts.length;
      const mid = (i) => [(pts[i][0] + pts[(i + 1) % n][0]) / 2, (pts[i][1] + pts[(i + 1) % n][1]) / 2];
      const m0 = mid(n - 1);
      ctx.moveTo(m0[0], m0[1]);
      for (let i = 0; i < n; i++) {
        const m = mid(i);
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
      }
    } else {
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    }
    ctx.closePath();
    fillStroke(ctx, fill, pal, lw);
  }

  // ------------------------------------------------------------------ parts
  function drawSneaker(ctx, L, h, pal, lw, back) {
    const d = dirv(L.a2);
    const fa = L.ft * DEG;
    const f = [Math.cos(fa), -Math.sin(fa)];
    const down = [-f[1], f[0]]; // perpendicular, pointing "down" out of the sole
    const Q = (a, b) => [L.a[0] + f[0] * a * h + down[0] * b * h, L.a[1] + f[1] * a * h + down[1] * b * h];
    void d;
    // platform sole
    poly(ctx, [Q(-0.048, 0.03), Q(0.1, 0.03), Q(0.108, 0.05), Q(0.1, 0.07), Q(-0.05, 0.07), Q(-0.056, 0.05)], pal.sole, pal, lw);
    // upper
    poly(ctx, [Q(-0.036, -0.03), Q(0.018, -0.032), Q(0.05, 0.0), Q(0.088, 0.012), Q(0.1, 0.03), Q(-0.048, 0.032), Q(-0.044, 0.0)], back ? pal.jacketSh : pal.shoe, pal, lw, true);
    if (pal.flat) return;
    // blue panel + heel tab
    poly(ctx, [Q(-0.03, 0.006), Q(0.04, 0.008), Q(0.075, 0.024), Q(-0.03, 0.026)], pal.shoeBlue, pal, lw * 0.6);
    poly(ctx, [Q(-0.05, -0.028), Q(-0.034, -0.03), Q(-0.04, 0.012), Q(-0.054, 0.01)], pal.shoeBlue, pal, lw * 0.6);
    // sole stripe
    ctx.beginPath();
    const s1 = Q(-0.05, 0.05), s2 = Q(0.104, 0.05);
    ctx.moveTo(s1[0], s1[1]);
    ctx.lineTo(s2[0], s2[1]);
    ctx.strokeStyle = pal.shoeBlue;
    ctx.lineWidth = lw * 1.2;
    ctx.stroke();
  }

  function drawLeg(ctx, L, h, pal, lw, back, tagged) {
    const skin = back ? pal.skinSh : pal.skin;
    capsule(ctx, L.k, L.a, 0.023 * h, 0.017 * h, skin, pal, lw); // shin
    capsule(ctx, L.h, L.k, 0.031 * h, 0.024 * h, skin, pal, lw); // thigh
    drawSneaker(ctx, L, h, pal, lw, back);
    // shorts leg
    const mid = add(L.h, dirv(L.a1), PROP.th * h * 0.8);
    capsule(ctx, L.h, mid, 0.048 * h, 0.036 * h, back ? pal.shortsSh : pal.shorts, pal, lw);
    if (tagged && !pal.flat) {
      // small barcode tag on the hem of the near shorts leg
      const p = add(mid, dirv(L.a1 + 90), -0.02 * h);
      ctx.save();
      ctx.translate(p[0], p[1]);
      ctx.rotate(-L.a1 * DEG);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-0.012 * h, -0.016 * h, 0.024 * h, 0.022 * h);
      ctx.fillStyle = pal.line;
      for (let i = 0; i < 6; i++) ctx.fillRect(-0.009 * h + i * 0.0035 * h, -0.012 * h, (i % 3 === 0 ? 0.002 : 0.001) * h, 0.014 * h);
      ctx.restore();
    }
  }

  function drawArm(ctx, A, h, pal, lw, back, pose, withPocket) {
    const sleeve = back ? pal.jacketSh : pal.jacket;
    if (!(pose.pocket > 0.5)) {
      ctx.beginPath();
      ctx.ellipse(A.hand[0], A.hand[1], 0.021 * h, 0.025 * h, -A.a2 * DEG, 0, Math.PI * 2);
      fillStroke(ctx, back ? pal.skinSh : pal.skin, pal, lw);
    }
    capsule(ctx, A.e, A.w, 0.03 * h, 0.034 * h, sleeve, pal, lw); // forearm sleeve (puffy cuff)
    capsule(ctx, A.s, A.e, 0.038 * h, 0.031 * h, sleeve, pal, lw); // upper sleeve
    if (pal.flat) return;
    // cuff band
    const c = add(A.w, dirv(A.a2), -0.012 * h);
    ctx.save();
    ctx.translate(c[0], c[1]);
    ctx.rotate(-A.a2 * DEG);
    ctx.fillStyle = back ? pal.jacketSh : pal.jacketSh;
    ctx.fillRect(-0.034 * h, -0.006 * h, 0.068 * h, 0.012 * h);
    ctx.restore();
    if (withPocket) {
      const m = add(A.s, dirv(A.a1), PROP.ua * h * 0.5);
      ctx.save();
      ctx.translate(m[0], m[1]);
      ctx.rotate(-A.a1 * DEG);
      ctx.beginPath();
      ctx.roundRect(-0.022 * h, -0.03 * h, 0.044 * h, 0.05 * h, 0.006 * h);
      fillStroke(ctx, pal.pocket, pal, lw * 0.7);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fillRect(-0.018 * h, -0.026 * h, 0.036 * h, 0.008 * h);
      ctx.restore();
    }
  }

  function drawTorso(ctx, R, h, pal, lw, pose, t, wind) {
    const U = R.U, Pp = R.Pp, tn = pose.turn;
    const T = PROP.torso * h;
    const at = (u, p) => [U[0] * u + Pp[0] * p, U[1] * u + Pp[1] * p];
    const flare = clamp(pose.flare + wind, 0, 1.4);
    const flut = (k) => Math.sin(t * 23 + k) * 0.5 + Math.sin(t * 37 + k * 2.1) * 0.5;
    const ws = (0.084 + 0.024 * tn) * h, wh = (0.098 + 0.026 * tn) * h;
    // wind blows hem backward (−x in char space) and lifts it
    const fv = (k, s) => [-flare * 0.075 * h * s + flut(k) * flare * 0.012 * h, -flare * 0.035 * h * s + flut(k + 1) * flare * 0.01 * h];
    const hemY = -0.06 * h;
    const fb = fv(0, 1.0), ff = fv(2, 0.55);
    // body core (shorts pelvis)
    capsule(ctx, add(R.pel, U, -0.02 * h), add(R.pel, U, 0.05 * h), 0.058 * h, 0.06 * h, pal.shorts, pal, lw);
    // jacket shell
    const shell = [
      at(T * 0.99, -ws * 0.55),
      at(T * 0.9, -ws * 1.05),
      at(T * 0.45, -ws * 1.08),
      add(at(hemY, -wh), fb),
      add(at(hemY - 0.012 * h, -wh * 0.2), fv(1, 0.8)),
      add(at(hemY, wh * 0.95), ff),
      at(T * 0.45, ws * 1.05),
      at(T * 0.9, ws * 1.0),
      at(T * 0.99, ws * 0.5),
    ];
    poly(ctx, shell, pal.jacket, pal, lw, true);
    if (pal.flat) return;
    // shading fold on the back side
    poly(ctx, [at(T * 0.85, -ws * 0.95), at(T * 0.4, -ws * 1.0), add(at(hemY, -wh * 0.92), fb), add(at(hemY, -wh * 0.55), fb)], pal.jacketSh, { flat: true }, 0, true);
    // front opening reveals crop top / midriff / shorts
    const oc = lerp(ws * 0.86, 0, tn), ow = lerp(0.012, 0.04, tn) * h;
    ctx.save();
    ctx.beginPath();
    const o1 = at(T * 0.93, oc - ow * 0.6), o2 = at(T * 0.93, oc + ow * 0.6);
    const o3 = add(at(hemY, oc + ow * 1.4), ff, 0.5), o4 = add(at(hemY, oc - ow * 1.4), ff, 0.5);
    ctx.moveTo(o1[0], o1[1]);
    ctx.lineTo(o2[0], o2[1]);
    ctx.lineTo(o3[0], o3[1]);
    ctx.lineTo(o4[0], o4[1]);
    ctx.closePath();
    ctx.clip();
    const band = (u0, u1, col) => {
      const a = at(u0, oc - ow * 3), b2 = at(u0, oc + ow * 3), c = at(u1, oc + ow * 3), d = at(u1, oc - ow * 3);
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b2[0], b2[1]);
      ctx.lineTo(c[0], c[1]);
      ctx.lineTo(d[0], d[1]);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
    };
    band(T, T * 0.1, pal.crop);
    band(T * 0.1, hemY - 0.05 * h, pal.shorts);
    // crop hem + shorts waistband lines
    ctx.strokeStyle = pal.line;
    ctx.lineWidth = lw * 0.8;
    for (const u of [T * 0.1]) {
      const a = at(u, oc - ow * 3), c = at(u, oc + ow * 3);
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(c[0], c[1]);
      ctx.stroke();
    }
    ctx.restore();
    // zipper edges
    ctx.strokeStyle = pal.line;
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.moveTo(o1[0], o1[1]);
    ctx.lineTo(o4[0], o4[1]);
    ctx.moveTo(o2[0], o2[1]);
    ctx.lineTo(o3[0], o3[1]);
    ctx.stroke();
    // blue drawstrings swinging in the wind
    ctx.strokeStyle = pal.string;
    ctx.lineWidth = lw * 1.4;
    ctx.lineCap = 'round';
    for (const [o, k] of [[o1, 0], [o2, 1.7]]) {
      const sw = Math.sin(t * 19 + k) * flare * 0.02 * h - flare * 0.03 * h;
      const end = [o[0] + sw + U[0] * -0.11 * h, o[1] + U[1] * -0.11 * h - flare * 0.02 * h];
      ctx.beginPath();
      ctx.moveTo(o[0], o[1]);
      ctx.quadraticCurveTo(o[0] + sw * 0.3 + U[0] * -0.05 * h, o[1] + U[1] * -0.05 * h, end[0], end[1]);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(end[0], end[1], lw * 1.4, 0, Math.PI * 2);
      ctx.fillStyle = pal.string;
      ctx.fill();
    }
    ctx.lineCap = 'butt';
  }

  function drawHood(ctx, R, h, pal, lw) {
    const c = add(add(R.neck, R.U, 0.015 * h), R.Pp, -0.048 * h);
    ctx.beginPath();
    ctx.ellipse(c[0], c[1], 0.062 * h, 0.05 * h, R.headA * DEG, 0, Math.PI * 2);
    fillStroke(ctx, pal.jacketSh, pal, lw);
  }

  function drawHead(ctx, R, h, pal, lw, pose, t, wind) {
    const r = PROP.hr * h;
    const tn = pose.turn;
    const fx = (1 - tn) * 0.3 * r; // features shift toward facing side in profile
    const fl = (k, a) => (Math.sin(t * 21 + k) * 0.6 + Math.sin(t * 33 + k * 1.7) * 0.4) * a * r * (0.25 + wind + pose.flare * 0.4);
    // neck
    capsule(ctx, R.neck, R.neckTop, 0.022 * h, 0.02 * h, pal.skinSh, pal, lw);
    ctx.save();
    ctx.translate(R.head[0], R.head[1]);
    ctx.rotate(R.headA * DEG);
    const windBack = -(wind + pose.flare * 0.5) * 0.12 * r;
    // back hair (bob mass)
    const bx = -0.14 * r * (1 - tn);
    poly(ctx, [
      [bx - 1.12 * r, -0.2 * r], [bx - 0.9 * r, -0.95 * r], [bx, -1.18 * r], [bx + 0.9 * r, -0.95 * r], [bx + 1.12 * r, -0.2 * r],
      [bx + 1.04 * r + fl(1, 0.04), 0.22 * r], [bx + 0.7 * r + fl(2, 0.05), 0.42 * r],
      [bx - 0.7 * r + windBack + fl(3, 0.06), 0.42 * r], [bx - 1.06 * r + windBack + fl(4, 0.05), 0.24 * r],
    ], pal.hairSh, pal, lw, true);
    // face
    ctx.beginPath();
    ctx.moveTo(fx - 0.82 * r, -0.2 * r);
    ctx.bezierCurveTo(fx - 0.86 * r, 0.45 * r, fx - 0.4 * r, 0.92 * r, fx + 0.12 * r * (1 - tn), 1.0 * r);
    ctx.bezierCurveTo(fx + 0.45 * r + 0.25 * r * (1 - tn), 0.9 * r, fx + 0.86 * r + 0.08 * r * (1 - tn), 0.45 * r, fx + 0.82 * r + 0.06 * r * (1 - tn), -0.2 * r);
    ctx.bezierCurveTo(fx + 0.8 * r, -0.9 * r, fx - 0.8 * r, -0.9 * r, fx - 0.82 * r, -0.2 * r);
    ctx.closePath();
    fillStroke(ctx, pal.skin, pal, lw);
    if (!pal.flat) {
      // blush
      ctx.fillStyle = pal.blush;
      for (const s of [-1, 1]) {
        if (s < 0 && tn < 0.3) continue;
        ctx.beginPath();
        ctx.ellipse(fx + s * 0.42 * r * tn + (1 - tn) * 0.38 * r, 0.52 * r, 0.14 * r, 0.07 * r, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // eyes
      const eyes = [];
      if (tn > 0.28) eyes.push(fx - 0.36 * r * tn);
      eyes.push(fx + 0.36 * r * tn + (1 - tn) * 0.36 * r);
      const ew = 0.24 * r * lerp(0.62, 1, tn), eh = 0.24 * r;
      const lid = clamp(pose.lid, 0, 0.9);
      for (const ex of eyes) {
        const ey = 0.3 * r;
        ctx.save();
        ctx.translate(ex, ey);
        // white
        ctx.beginPath();
        ctx.ellipse(0, 0, ew, eh * 0.62, 0, 0, Math.PI * 2);
        ctx.fillStyle = pal.eyeW;
        ctx.fill();
        ctx.save();
        ctx.clip();
        const ix = pose.lookX * ew * 0.3, iy = -pose.lookY * eh * 0.28;
        const g = ctx.createLinearGradient(0, iy - eh * 0.6, 0, iy + eh * 0.6);
        g.addColorStop(0, pal.irisDark);
        g.addColorStop(0.35, pal.iris);
        g.addColorStop(1, '#D6FAFF');
        ctx.beginPath();
        ctx.ellipse(ix, iy, ew * 0.72, eh * 0.62, 0, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(ix, iy - eh * 0.06, ew * 0.32, eh * 0.3, 0, 0, Math.PI * 2);
        ctx.fillStyle = pal.pupil;
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(ix - ew * 0.28, iy - eh * 0.24, ew * 0.2, eh * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ix + ew * 0.25, iy + eh * 0.2, ew * 0.09, 0, Math.PI * 2);
        ctx.fill();
        // lid (cool half-lidded look)
        ctx.fillStyle = pal.skin;
        ctx.fillRect(-ew * 1.2, -eh, ew * 2.4, eh * (0.38 + lid * 0.55));
        ctx.restore();
        // upper lash line
        ctx.beginPath();
        const ly = -eh * 0.62 + eh * (lid * 0.55);
        ctx.moveTo(-ew * 1.08, ly + eh * 0.12);
        ctx.quadraticCurveTo(0, ly - eh * 0.14, ew * 1.12, ly + eh * 0.02);
        ctx.lineWidth = Math.max(1.4, lw * 1.25);
        ctx.strokeStyle = pal.lash;
        ctx.lineCap = 'round';
        ctx.stroke();
        // thick straight brow
        ctx.lineWidth = Math.max(2, lw * 1.8);
        ctx.beginPath();
        ctx.moveTo(-ew * 1.1, -eh * 1.15);
        ctx.lineTo(ew * 1.1, -eh * 1.3);
        ctx.strokeStyle = pal.hairSh;
        ctx.stroke();
        ctx.lineCap = 'butt';
        ctx.restore();
      }
      // nose + mouth
      const mx = fx + (1 - tn) * 0.34 * r;
      ctx.strokeStyle = pal.skinSh;
      ctx.lineWidth = lw * 0.9;
      ctx.beginPath();
      ctx.moveTo(mx + 0.06 * r, 0.42 * r);
      ctx.lineTo(mx + 0.02 * r, 0.5 * r);
      ctx.stroke();
      ctx.strokeStyle = pal.mouth;
      ctx.lineWidth = lw * 1.1;
      ctx.beginPath();
      const sm = pose.smile;
      ctx.moveTo(mx - 0.1 * r, 0.68 * r - sm * 0.02 * r);
      ctx.quadraticCurveTo(mx, 0.7 * r + sm * 0.07 * r, mx + 0.1 * r, 0.66 * r - sm * 0.04 * r);
      ctx.stroke();
    }
    // side locks (chin length, pointed tips)
    for (const s of [-1, 1]) {
      const x0 = fx * 0.4 + s * 0.84 * r;
      poly(ctx, [
        [x0 - s * 0.05 * r, -0.55 * r], [x0 + s * 0.14 * r, -0.3 * r], [x0 + s * 0.08 * r, 0.1 * r],
        [x0 - s * 0.04 * r, 0.32 * r], [x0 - s * 0.16 * r, 0.05 * r],
      ], s < 0 ? pal.hairSh : pal.hair, pal, lw, true);
    }
    // bangs — messy pointed fringe
    const bg = [];
    bg.push([fx - 1.0 * r, -0.25 * r]);
    bg.push([fx - 0.95 * r, -0.85 * r]);
    bg.push([fx + 0.95 * r, -0.85 * r]);
    bg.push([fx + 1.0 * r, -0.25 * r]);
    const tips = [0.85, 0.5, 0.2, -0.15, -0.5, -0.82];
    const depth = [-0.02, 0.06, -0.06, 0.08, -0.03, 0.04];
    for (let i = 0; i < tips.length; i++) {
      const x = fx + tips[i] * r;
      bg.push([x + 0.11 * r, -0.22 * r]);
      bg.push([x + fl(10 + i, 0.05) - 0.04 * r, depth[i] * r + fl(20 + i, 0.04)]);
    }
    poly(ctx, bg, pal.hair, pal, lw);
    if (!pal.flat) {
      // hair highlight band
      ctx.strokeStyle = pal.hairHi;
      ctx.lineWidth = 0.07 * r;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(fx, -0.1 * r, 0.62 * r, -2.5, -1.9);
      ctx.moveTo(fx + Math.cos(-1.5) * 0.62 * r, -0.1 * r + Math.sin(-1.5) * 0.62 * r);
      ctx.arc(fx, -0.1 * r, 0.62 * r, -1.5, -1.05);
      ctx.stroke();
      ctx.lineCap = 'butt';
    }
    // beanie — slouched dome + ribbed fold
    const bk = -0.1 * r;
    poly(ctx, [[bk - 1.0 * r, -0.5 * r], [bk - 0.9 * r, -1.15 * r], [bk - 0.3 * r, -1.5 * r], [bk + 0.5 * r, -1.42 * r], [bk + 1.0 * r, -0.95 * r], [bk + 1.02 * r, -0.5 * r]], pal.beanieSh, pal, lw, true);
    ctx.beginPath();
    ctx.roundRect(bk - 1.08 * r, -0.78 * r, 2.18 * r, 0.34 * r, 0.12 * r);
    fillStroke(ctx, pal.beanie, pal, lw);
    if (!pal.flat) {
      ctx.strokeStyle = pal.beanieSh;
      ctx.lineWidth = lw * 0.8;
      ctx.beginPath();
      for (let i = 1; i < 12; i++) {
        const x = bk - 1.08 * r + (2.18 * r * i) / 12;
        ctx.moveTo(x, -0.74 * r);
        ctx.lineTo(x, -0.48 * r);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // ------------------------------------------------------------------ main draw
  /**
   * drawAO(ctx, pose, o)
   * o: { x, y, h (height px), facing ±1, spin deg, sx, sy, pivot:'pelvis'|'com', pal, t, wind, alpha }
   */
  function drawAO(ctx, pose, o) {
    const h = o.h;
    const pal = o.pal || BASE_PAL;
    const lw = pal.flat ? 0 : Math.max(1.2, h * 0.0055);
    const t = o.t || 0;
    const wind = o.wind || 0;
    const R = rig(pose, h);
    ctx.save();
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    ctx.translate(o.x, o.y);
    ctx.rotate((o.spin || 0) * DEG);
    ctx.scale((o.facing || 1) * (o.sx ?? 1), o.sy ?? 1);
    if (o.pivot === 'com') ctx.translate(0, 0.07 * h);
    ctx.lineJoin = 'round';
    drawHood(ctx, R, h, pal, lw);
    drawArm(ctx, R.bArm, h, pal, lw, true, pose, true); // her LEFT sleeve carries the blue utility pocket
    drawLeg(ctx, R.bLeg, h, pal, lw, true, false);
    drawTorso(ctx, R, h, pal, lw, pose, t, wind);
    drawLeg(ctx, R.fLeg, h, pal, lw, false, true);
    drawHead(ctx, R, h, pal, lw, pose, t, wind);
    drawArm(ctx, R.fArm, h, pal, lw, false, pose, false);
    ctx.restore();
  }

  // Extreme close-up eye (CUT 02 porthole). Drawn centered at (0,0), width ~ w.
  function drawEyeCloseup(ctx, w, s) {
    // s: { lookX, lookY, glint, t, lid }
    const eh = w * 0.62;
    ctx.save();
    // skin field
    const g0 = ctx.createRadialGradient(0, w * 0.1, w * 0.1, 0, 0, w * 1.4);
    g0.addColorStop(0, BASE_PAL.skin);
    g0.addColorStop(1, '#F7CDBE');
    ctx.fillStyle = g0;
    ctx.fillRect(-w * 2, -w * 2, w * 4, w * 4);
    // blush
    ctx.fillStyle = 'rgba(255,120,140,0)';
    ctx.beginPath();
    ctx.ellipse(w * 0.1, w * 0.78, w * 0.7, w * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    // eye white
    ctx.beginPath();
    ctx.moveTo(-w * 0.62, eh * 0.05);
    ctx.bezierCurveTo(-w * 0.4, -eh * 0.62, w * 0.42, -eh * 0.66, w * 0.64, -eh * 0.08);
    ctx.bezierCurveTo(w * 0.45, eh * 0.48, -w * 0.38, eh * 0.52, -w * 0.62, eh * 0.05);
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(80,120,190,0.18)';
    ctx.fillRect(-w, -eh, w * 2, eh * 0.35);
    const ix = s.lookX * w * 0.12, iy = -s.lookY * eh * 0.22;
    const ir = w * 0.3;
    const g = ctx.createLinearGradient(0, iy - ir * 1.2, 0, iy + ir * 1.2);
    g.addColorStop(0, '#062A78');
    g.addColorStop(0.45, '#1D7FE0');
    g.addColorStop(0.8, '#62DCFF');
    g.addColorStop(1, '#E2FCFF');
    ctx.beginPath();
    ctx.ellipse(ix, iy, ir * 0.92, ir * 1.12, 0, 0, Math.PI * 2);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.lineWidth = w * 0.012;
    ctx.strokeStyle = '#041A4D';
    ctx.stroke();
    // iris rays
    ctx.strokeStyle = 'rgba(190,245,255,0.35)';
    ctx.lineWidth = w * 0.006;
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(ix + Math.cos(a) * ir * 0.4, iy + Math.sin(a) * ir * 0.5);
      ctx.lineTo(ix + Math.cos(a) * ir * 0.85, iy + Math.sin(a) * ir * 1.05);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(ix, iy - ir * 0.05, ir * 0.36, ir * 0.46, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#04102B';
    ctx.fill();
    // highlights (glint swells on the beat)
    const gl = 1 + (s.glint || 0) * 0.6;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.ellipse(ix - ir * 0.34, iy - ir * 0.42, ir * 0.22 * gl, ir * 0.17 * gl, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ix + ir * 0.3, iy + ir * 0.36, ir * 0.08 * gl, 0, Math.PI * 2);
    ctx.fill();
    // lid shadow
    ctx.fillStyle = BASE_PAL.skin;
    ctx.fillRect(-w, -eh, w * 2, eh * (0.3 + (s.lid || 0)));
    ctx.restore();
    // upper lash (thick, winged)
    ctx.fillStyle = '#0B1226';
    ctx.beginPath();
    const lidY = -eh * 0.62 + eh * (s.lid || 0) * 0.8;
    ctx.moveTo(-w * 0.68, eh * 0.06);
    ctx.bezierCurveTo(-w * 0.42, lidY - eh * 0.06, w * 0.38, lidY - eh * 0.1, w * 0.74, -eh * 0.2);
    ctx.lineTo(w * 0.7, -eh * 0.16);
    ctx.lineTo(w * 0.62, -eh * 0.04);
    ctx.bezierCurveTo(w * 0.4, lidY + eh * 0.06, -w * 0.4, lidY + eh * 0.1, -w * 0.62, eh * 0.08);
    ctx.closePath();
    ctx.fill();
    // lower lash
    ctx.strokeStyle = '#3A2C3A';
    ctx.lineWidth = w * 0.01;
    ctx.beginPath();
    ctx.moveTo(-w * 0.45, eh * 0.32);
    ctx.quadraticCurveTo(0, eh * 0.52, w * 0.45, eh * 0.2);
    ctx.stroke();
    // brow
    ctx.strokeStyle = '#123E9E';
    ctx.lineWidth = w * 0.085;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-w * 0.55, -eh * 0.95);
    ctx.quadraticCurveTo(0, -eh * 1.18, w * 0.6, -eh * 0.98);
    ctx.stroke();
    ctx.lineCap = 'butt';
    // blue bangs sweeping across the top
    const t = s.t || 0;
    const strands = [[-0.95, 1.05], [-0.55, 0.9], [-0.2, 1.1], [0.15, 0.85], [0.5, 1.0], [0.85, 0.92]];
    for (let i = 0; i < strands.length; i++) {
      const [x0, len] = strands[i];
      const sw = Math.sin(t * 9 + i * 1.3) * w * 0.02;
      ctx.beginPath();
      ctx.moveTo((x0 - 0.3) * w, -eh * 2.6);
      ctx.quadraticCurveTo((x0 - 0.12) * w + sw, -eh * 1.3, x0 * w + sw * 1.5, -eh * (1.75 - len * 0.95));
      ctx.quadraticCurveTo((x0 + 0.1) * w + sw, -eh * 1.4, (x0 + 0.3) * w, -eh * 2.6);
      ctx.closePath();
      ctx.fillStyle = i % 2 ? BASE_PAL.hair : BASE_PAL.hairSh;
      ctx.fill();
      ctx.strokeStyle = '#0B1226';
      ctx.lineWidth = w * 0.008;
      ctx.stroke();
    }
    ctx.restore();
  }

  // Huge sneaker for foreground wipes (centered, length ~ len px, pointing +x).
  function drawBigSneaker(ctx, x, y, len, rot) {
    const h = len / 0.16;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot || 0);
    const L = { a: [-0.03 * h, -0.02 * h], a2: 0, ft: 0 };
    drawSneaker(ctx, L, h, BASE_PAL, Math.max(2, h * 0.004), false);
    ctx.restore();
  }

  Object.assign(AO, { POSES, blend, runPose, rig, drawAO, point, groundOffset, silhouette, tinted, PAL: BASE_PAL, drawEyeCloseup, drawBigSneaker, PROP });
})();
