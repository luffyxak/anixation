/*
 * AO trailer — 13-cut choreography. renderAt(t) is a pure function of time:
 * every hit is pinned to a detected beat/onset of ReelAudio-30300.mp3 via AO.b(i).
 *
 *  CUT 01  b0–b4    impact reveal (circle slam b0, bars b1, A b2, O b3, push into O)
 *  CUT 02  b4–b8    O → porthole eye, glance up b5, shatter b7
 *  CUT 03  b8–b11   black, giant AO, sprint + power-slide, whip-pan as music drops out
 *  CUT 04  b11–b16  breakdown triptych, strobe silhouettes on onsets b12/b13/b14
 *  CUT 05  b16–b18  slow-mo corkscrew through NO BRAKES ring, snap-zoom face
 *  CUT 06  b18–b20  JUMP vault, palm plant on J at b19
 *  CUT 07  b20–b22  riser: ghost backflip on FLIP stripe
 *  CUT 08  b22–b26  DROP: COOL/FAST/CLEAN/BLUE one per beat + knee slide
 *  CUT 09  b26–b29  grid wall-run, freeze + target lock at b28
 *  CUT 10  b29–b32  dive through 3 panes shattering b29/b30/b31, sneaker wipe
 *  CUT 11  b32–b36  poster montage 01–04, one per beat
 *  CUT 12  b36–b44  hero backflip, landing shockwave b39, freeze b41, whiteout b43
 *  CUT 13  b44–end  AO identity card, ice pulse b46, frost-ring stinger b48
 */
(function () {
  'use strict';
  const AO = window.AO;
  const { clamp, lerp, invLerp, smoothstep, E, win, impactPulse, dampedSpring, prng, shake, b, C = AO.COL } = AO;
  const W = AO.W, H = AO.H;
  const BP = AO.BM.beatPeriod;
  const POSES = AO.POSES;

  // Pelvis y that puts the soles on groundY.
  const ground = (pose, h, gy) => gy - AO.groundOffset(pose, h);
  const pulses = (t, times, decay) => times.reduce((a, e) => a + impactPulse(t, e, decay), 0);

  // Precomputed deterministic shard sets.
  const SH = {
    porthole: AO.makeShards(11, { cx: 0, cy: 0, r: 380, n: 18, colors: [C.cobalt, C.ice, C.white, C.black, C.cobaltDeep] }),
    pane1: AO.makeShards(21, { cx: 0, cy: 0, w: W * 1.1, h: H * 1.1, n: 20, colors: [C.cobalt, C.cobaltDeep] }),
    pane2: AO.makeShards(22, { cx: 0, cy: 0, w: W * 1.1, h: H * 1.1, n: 20, colors: [C.ice, C.iceSoft] }),
    pane3: AO.makeShards(23, { cx: 0, cy: 0, w: W * 1.1, h: H * 1.1, n: 20, colors: [C.white, '#DDE5F0'] }),
    heroA: AO.makeShards(31, { cx: -330, cy: -150, w: 560, h: 720, n: 16, colors: [C.ice, C.iceSoft, C.cobalt, C.silver] }),
    heroO: AO.makeShards(32, { cx: 330, cy: -150, w: 560, h: 720, n: 16, colors: [C.ice, C.iceSoft, C.cobalt, C.silver] }),
  };

  let off13 = null; // offscreen for CUT 13 sweep

  // ======================================================================
  const CUTFN = (AO.scenes = {}); // exposed: override AO.scenes[n] from src/custom.js

  // ---------------------------------------------------------------- CUT 01
  CUTFN[1] = (ctx, t, S) => {
    const t0 = b(0), t1 = b(1), tA = b(2), tO = b(3), tE = S.cut.end;
    const O = { x: 0, y: -20 }; // push into the cobalt circle (AK has no counter to zoom through)
    AO.fill(ctx, C.white);
    const push = E.inExpo(invLerp(tO + 0.12, tE, t));
    AO.camera(ctx, { x: lerp(0, O.x, E.inOutCubic(invLerp(tO + 0.05, tE, t))), y: lerp(0, O.y, push), zoom: 1 + push * 9 + impactPulse(t, tA, 0.12) * 0.02 + impactPulse(t, tO, 0.12) * 0.02 });

    // UI ticks + barcode flicker on hi-hats
    const flick = Math.floor(t * 30) % 7 !== 2;
    if (flick) AO.ticks(ctx, -900, -480, 380, 30, C.black, { labels: true });
    AO.text(ctx, 'FILE 001 // CHARACTER REVEAL', 900, -456, { size: 20, mono: true, weight: 600, fill: C.black, align: 'right' });
    if (t > 0.1 && Math.floor(t * 24) % 5 !== 1) AO.barcode(ctx, 560, 390, 320, 52, 5, C.black);

    // cobalt circle slam (overshoot)
    if (t >= t0) {
      const cp = E.outBack(invLerp(t0, t0 + 0.22, t), 1.45);
      AO.disc(ctx, 0, -20, 330 * lerp(3.2, 1, cp), C.cobalt);
      const rp = invLerp(t0, t0 + 0.45, t);
      AO.ring(ctx, 0, -20, 330 * lerp(0.9, 1.9, E.outExpo(rp)), 10, C.cobalt, 1 - smoothstep(0.1, 1, rp));
      AO.ring(ctx, 0, -20, 390, 2, C.black, 0.5, 0, Math.PI * 2, [6, 10]);
    }
    // black bars wipe across
    const bin = E.outExpo(invLerp(t1, t1 + 0.18, t)), bout = E.inExpo(invLerp(tA - 0.12, tA - 0.01, t));
    if (t >= t1 - 0.01 && t < tA) {
      const span = W * 1.3;
      for (const [y, s] of [[-300, -1], [260, 1]]) {
        ctx.save();
        ctx.translate(s * (lerp(span, 0, bin) + lerp(0, -span, bout)), 0);
        ctx.fillStyle = C.black;
        ctx.fillRect(-W, y, W * 2, 64);
        AO.text(ctx, 'AO  ///  COOL  ///  FAST  ///  CLEAN  ///  BLUE  ///  AO  ///  COOL  ///  FAST', 0, y + 44, { size: 26, mono: true, weight: 700, fill: C.white, track: 6 });
        ctx.restore();
      }
    }
    // A and O punch in, heavy
    const base = 225;
    if (t >= tA) {
      const k = E.outExpo(invLerp(tA, tA + 0.12, t));
      AO.text(ctx, 'A', -330, base, { size: 640, fill: C.black, sx: lerp(2.35, 1, k), sy: lerp(2.35, 1, k) });
    }
    if (t >= tO) {
      const k = E.outExpo(invLerp(tO, tO + 0.12, t));
      AO.text(ctx, 'K', 330, base, { size: 640, fill: C.black, sx: lerp(2.35, 1, k), sy: lerp(2.35, 1, k) });
    }
    const hits = [t0, tA, tO];
    S.shake = pulses(t, hits, 0.15) * 0.022;
    S.fx.uRgb = pulses(t, hits, 0.12) * 0.014;
    S.fx.uInvert = (t >= tA && t < tA + 0.034) || (t >= tO && t < tO + 0.034) ? 1 : 0;
    S.fx.uHalftone = 0.18;
    S.fx.uZoomBlur = push * 0.8;
    S.fx.uFocus = [0.5, 0.5];
  };

  // ---------------------------------------------------------------- CUT 02
  CUTFN[2] = (ctx, t, S) => {
    const tsh = b(7);
    const shattered = t >= tsh;
    AO.fill(ctx, shattered ? C.black : C.white);
    AO.camera(ctx, { zoom: 1 + AO.beatPulse(t, 0.1) * 0.015 });
    const R = 360 * (1 + AO.beatPulse(t, 0.1) * 0.03 + E.inExpo(invLerp(tsh - 0.12, tsh, t)) * 0.1);
    if (!shattered) {
      // outer UI
      ctx.save();
      ctx.rotate(-t * 0.9);
      AO.ring(ctx, 0, 0, R + 70, 3, C.black, 0.8, 0, Math.PI * 2, [18, 14]);
      ctx.restore();
      AO.ring(ctx, 0, 0, R + 120, 1.5, C.black, 0.4);
      AO.brackets(ctx, 0, 0, (R + 150) * 2, C.cobalt, 6, 0, 0.12);
      AO.ticks(ctx, -820, 420, 300, 25, C.black);
      AO.text(ctx, 'OPTIC SCAN  //  ICE-BLUE  7EE8FA', -820, -440, { size: 22, mono: true, weight: 700, fill: C.black, align: 'left' });
      AO.text(ctx, 'K', 760, 380, { size: 160, fill: C.cobalt });
      // porthole content: extreme close-up of her eye
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      ctx.clip();
      const look = E.outExpo(invLerp(b(5), b(5) + 0.22, t));
      const zoom = lerp(1, 1.18, invLerp(S.cut.start, tsh, t));
      ctx.scale(zoom, zoom);
      ctx.translate(0, 40);
      AO.drawEyeCloseup(ctx, 420, {
        lookX: lerp(-0.45, 0.15, look), lookY: lerp(-0.35, 0.95, look), glint: AO.beatPulse(t, 0.12) + impactPulse(t, b(6), 0.2),
        lid: lerp(0.18, 0.06, look), t,
      });
      ctx.restore();
      AO.ring(ctx, 0, 0, R, 46, C.black, 1);
      AO.ring(ctx, 0, 0, R - 30, 4, C.ice, 0.9);
    } else {
      const p = invLerp(tsh, S.cut.end, t);
      AO.ring(ctx, 0, 0, lerp(360, 1300, E.outExpo(p)), lerp(30, 2, p), C.ice, 1 - p);
      AO.drawShards(ctx, SH.porthole, p, { dist: 1100, gravity: 300, edge: C.black });
    }
    const pre = impactPulse(t, tsh - 0.07, 0.1) + impactPulse(t, tsh, 0.2);
    S.fx.uRgb = clamp(pre * 0.03, 0, 0.04);
    S.fx.uRgbAng = 0.22;
    S.fx.uInvert = t >= tsh && t < tsh + 0.04 ? 0.9 : 0;
    S.fx.uScan = shattered ? 0.1 : 0.25;
    S.fx.uBloom = 0.25 + AO.beatPulse(t, 0.12) * 0.3;
    S.shake = impactPulse(t, tsh, 0.18) * 0.03 + AO.beatPulse(t, 0.1) * 0.006;
  };

  // ---------------------------------------------------------------- CUT 03
  CUTFN[3] = (ctx, t, S) => {
    const tS = S.cut.start, tSl = b(9) + 0.17, tW = b(10) + 0.06, tE = S.cut.end;
    const GY = 330, h = 540, v0 = 2400, k = 3;
    const xAt = (tt) => (tt < tSl ? -1450 + v0 * (tt - tS) : -1450 + v0 * (tSl - tS) + (v0 / k) * (1 - Math.exp(-k * (tt - tSl))));
    const x = xAt(t);
    const whip = E.inExpo(invLerp(tW, tE, t));
    AO.fill(ctx, C.black);
    AO.camera(ctx, { x: x * 0.3 + whip * 2600, zoom: 1 + AO.beatPulse(t, 0.1) * 0.012 });
    // enormous white AO (readable immediately; she enters ~0.15s later)
    const slam = E.outExpo(invLerp(tS, tS + 0.16, t));
    AO.text(ctx, 'AK', lerp(60, -120, S.lt), GY, { size: 940, fill: C.white, sx: lerp(1.2, 1, slam), sy: lerp(1.2, 1, slam), track: -20 });
    AO.text(ctx, 'NO. 01 — PARKOUR / STREET', -880, -440, { size: 22, mono: true, weight: 700, fill: C.ice, align: 'left' });
    // pose: sprint (1 cycle per beat) → power slide
    const phase = (t - tS) / BP;
    const ks = E.outCubic(invLerp(tSl - 0.04, tSl + 0.12, t));
    const pose = AO.blend(AO.runPose(phase), POSES.slide, ks);
    const bob = (1 - ks) * -Math.abs(Math.sin(phase * Math.PI * 2)) * 0.03 * h;
    const y = ground(pose, h, GY) + bob;
    // ice streaks trailing
    AO.streaks(ctx, x - 0.15 * h, y - 0.15 * h, 520 + ks * 300, 16, C.ice, 9, t, 320);
    // kicked-up letter sparks from the sliding foot
    const rr = prng(44);
    const seeds = Array.from({ length: 60 }, () => [rr(), rr(), rr(), rr()]);
    AO.particles(ctx, t, 60, (i) => {
      const t0 = tSl + i * 0.006;
      const s = seeds[i];
      return { t0, x: xAt(t0) + 0.42 * h, y: GY - 8, vx: 300 + s[0] * 1300, vy: -(400 + s[1] * 1200), size: 4 + s[2] * 9, col: s[3] > 0.3 ? C.white : C.ice, rot: (s[0] - 0.5) * 30 };
    }, { life: 0.55, drag: 2.2, gravity: 2600 });
    AO.drawAO(ctx, pose, { x, y, h, t, wind: 0.4 + ks * 0.5 });
    const sp = smoothstep(tS + 0.1, tSl, t);
    S.fx.uSpeed = sp * 0.75;
    S.fx.uSpeedCol = AO.hexToRgb(C.ice);
    S.fx.uFocus = [clamp(0.5 + (x - (x * 0.3 + whip * 2600)) / W, 0.1, 0.9), 0.55];
    S.fx.uWhip = whip;
    S.fx.uRgb = impactPulse(t, tS, 0.12) * 0.016 + whip * 0.03;
    S.fx.uBloom = 0.25;
    S.shake = pulses(t, [tS, b(9), b(10)], 0.12) * 0.016 + impactPulse(t, tSl, 0.15) * 0.014;
  };

  // ---------------------------------------------------------------- CUT 04
  CUTFN[4] = (ctx, t, S) => {
    const tS = S.cut.start, tE = S.cut.end, flip = b(15);
    AO.fill(ctx, C.cobaltDeep);
    const panels = [
      { bg: C.cobalt, txt: C.white, sil: C.black, pose: POSES.takeoff, at: b(12), dir: 1 },
      { bg: C.white, txt: C.cobalt, sil: C.cobalt, pose: POSES.tuck, at: b(13), dir: -1 },
      { bg: C.ice, txt: C.white, sil: C.black, pose: POSES.land, at: b(14), dir: 1 },
    ];
    const pw = W / 3;
    panels.forEach((P, i) => {
      const inK = E.outExpo(invLerp(tS + i * 0.05, tS + i * 0.05 + 0.32, t));
      const outK = E.inExpo(invLerp(tE - 0.24 + i * 0.03, tE - 0.02 + i * 0.03, t));
      const oy = (1 - inK) * H * P.dir - outK * H * P.dir;
      ctx.save();
      ctx.translate(i * pw, oy);
      ctx.beginPath();
      ctx.rect(0, 0, pw, H);
      ctx.clip();
      const inverted = t >= flip;
      ctx.fillStyle = inverted ? P.sil : P.bg;
      ctx.fillRect(0, 0, pw, H);
      // vertical scrolling FULL SPEED (slow: breakdown)
      ctx.save();
      ctx.translate(pw / 2, H / 2);
      ctx.rotate(-Math.PI / 2);
      const scroll = (((t - tS) * 280 * P.dir) % 1500) - 750;
      for (let k = -1; k <= 1; k++) AO.text(ctx, 'FULL SPEED', scroll + k * 1500, 110, { size: 300, fill: inverted ? P.bg : P.txt, alpha: 0.9, track: -6 });
      ctx.restore();
      AO.text(ctx, '0' + (i + 1), 28, 56, { size: 34, mono: true, weight: 800, fill: inverted ? P.bg : P.txt, align: 'left' });
      AO.ticks(ctx, 28, H - 70, pw - 56, 20, inverted ? P.bg : P.txt, { small: 8, big: 16 });
      // stroboscopic freeze silhouette on its onset
      if (t >= P.at) {
        const age = t - P.at;
        const pop = E.outExpo(invLerp(P.at, P.at + 0.1, t));
        const h = 560 * lerp(1.12, 1, pop);
        const gx = pw / 2 + Math.sin(t * 50 + i) * 2 * Math.exp(-age * 6);
        const gy = ground(P.pose, h, 800);
        const silCol = inverted ? P.bg : P.sil;
        for (let g = 2; g >= 1; g--) AO.drawAO(ctx, P.pose, { x: gx - g * 70 * P.dir, y: gy, h, facing: P.dir, pal: AO.silhouette(silCol), alpha: 0.18 / g, t });
        AO.drawAO(ctx, P.pose, { x: gx, y: gy, h, facing: P.dir, pal: AO.silhouette(silCol), t });
      }
      ctx.restore();
    });
    // dividers
    ctx.fillStyle = C.black;
    ctx.fillRect(pw - 4, 0, 8, H);
    ctx.fillRect(2 * pw - 4, 0, 8, H);
    const hits = [b(12), b(13), b(14), flip];
    S.fx.uFlash = pulses(t, hits, 0.06) * 0.6;
    S.fx.uRgb = pulses(t, hits, 0.1) * 0.012;
    S.fx.uHalftone = 0.2;
    S.shake = pulses(t, hits, 0.1) * 0.012;
  };

  // ---------------------------------------------------------------- CUT 05
  CUTFN[5] = (ctx, t, S) => {
    const tS = S.cut.start, tE = S.cut.end, tZ = tE - 0.17;
    ctx.save();
    const g = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, 1100);
    g.addColorStop(0, C.cobalt);
    g.addColorStop(1, '#001570');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
    const lt = S.lt;
    // corkscrew: turntable via sx = cos(theta)
    const theta = lerp(0, Math.PI * 2, E.inOutCubic(invLerp(tS, tZ, t)));
    const c = Math.cos(theta);
    const pose = Object.assign({}, POSES.leap, { turn: lerp(0.15, 0.95, Math.abs(Math.sin(theta * 0.5 + 0.5))), smile: 0.55, lid: 0.3 });
    const cy = lerp(60, -40, E.outCubic(lt));
    const h = 560;
    const opt = { x: 0, y: cy, h, t, wind: 0.8, pivot: 'com', sx: Math.sign(c || 1) * Math.max(Math.abs(c), 0.18), spin: Math.sin(theta) * 12 };
    const head = AO.point(pose, opt, 'head');
    const zk = E.outExpo(invLerp(tZ, tZ + 0.12, t));
    AO.camera(ctx, { x: head[0] * zk, y: head[1] * zk, zoom: 1 + zk * 2.6 });
    // typography ring: NO BRAKES • NO LIMITS
    const str = 'NO BRAKES • NO LIMITS • NO BRAKES • NO LIMITS • ';
    const n = str.length;
    const rot = t * 1.6;
    const scatter = E.outExpo(invLerp(tS + 0.44, tZ, t));
    const glyphs = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rot;
      const z = Math.sin(a);
      const rx = 700 * (1 + scatter * (0.4 + AO.hash(i) * 1.2)), ry = 180 * (1 + scatter * 2);
      glyphs.push({ ch: str[i], x: Math.cos(a) * rx, y: z * ry - 20 + scatter * (AO.hash(i + 9) - 0.5) * 500, z, a });
    }
    const drawG = (front) => {
      for (const gl of glyphs) {
        if ((gl.z > 0) !== front) continue;
        ctx.save();
        ctx.translate(gl.x, gl.y);
        ctx.rotate(-0.21 + scatter * (AO.hash(gl.a) - 0.5) * 3);
        AO.text(ctx, gl.ch, 0, 40, { size: 120 * (0.72 + 0.28 * (gl.z + 1) / 2), fill: front ? C.white : C.iceSoft, alpha: (front ? 1 : 0.45) * (1 - scatter * 0.7) });
        ctx.restore();
      }
    };
    drawG(false);
    AO.drawAO(ctx, pose, opt);
    drawG(true);
    S.fx.uZoomBlur = impactPulse(t, tZ, 0.12) * 0.9;
    S.fx.uFocus = [0.5, 0.42];
    S.fx.uRgb = impactPulse(t, tZ, 0.12) * 0.02;
    S.fx.uBloom = 0.3;
    S.shake = impactPulse(t, tZ, 0.12) * 0.012 + AO.onsetPulse(t, 0.3, 0.1) * 0.006;
  };

  // ---------------------------------------------------------------- CUT 06
  CUTFN[6] = (ctx, t, S) => {
    const tS = S.cut.start, tE = S.cut.end, hit = b(19), rel = hit + 0.13;
    AO.fill(ctx, C.white);
    AO.camera(ctx, { zoom: 1 + impactPulse(t, hit, 0.12) * 0.02 });
    const size = 470, base = 250;
    const L = AO.letters(ctx, 'JUMP', size, -6);
    const capH = size * 0.72;
    const compress = t < hit ? 0 : t < rel ? Math.sin(invLerp(hit, rel, t) * Math.PI) : 0;
    const rdt = t > rel ? t - rel : 0;
    // cobalt slash behind
    const slashS = rdt > 0 ? dampedSpring(rdt, 28, 6.5) * 0.14 : 0;
    ctx.save();
    ctx.translate(0, base - capH * 0.5);
    ctx.rotate(-0.32);
    ctx.scale(1 + compress * 0.06 + slashS * 0.4, 1 - compress * 0.12 - slashS * 0.3);
    ctx.fillStyle = C.cobalt;
    ctx.fillRect(-900, -55, 1800, 110);
    ctx.restore();
    const slam = E.outExpo(invLerp(tS, tS + 0.1, t));
    let jTop = null;
    L.forEach((g, i) => {
      const att = Math.pow(0.74, i), delay = i * 0.032;
      const osc = rdt > delay ? dampedSpring(rdt - delay, 34, 7.5) * 0.24 * att : 0;
      const sy = clamp(1 - compress * 0.34 * att + osc, 0.58, 1.24) * lerp(1.15, 1, slam);
      const sx = (1 + (1 - sy) * 0.42) * lerp(1.15, 1, slam);
      AO.text(ctx, g.ch, g.x, base, { size, fill: C.black, sx, sy });
      if (i === 0) jTop = [g.x + g.w * 0.2, base - capH * sy];
    });
    AO.text(ctx, 'VAULT  //  06', -880, -440, { size: 22, mono: true, weight: 700, fill: C.black, align: 'left' });
    AO.barcode(ctx, 620, 400, 260, 40, 61, C.black);
    // vault choreography — hand pinned to the J during the plant
    const h = 520;
    const handOff = (pose) => AO.point(pose, { x: 0, y: 0, h }, 'fHand');
    let pose, x, y, spin = 0;
    if (t < hit) {
      const u = invLerp(tS, hit, t);
      pose = AO.blend(POSES.takeoff, POSES.vaultPlant, E.inOutCubic(u));
      const ho = handOff(POSES.vaultPlant);
      const end = [jTop[0] - ho[0], jTop[1] - ho[1]];
      const start = [-1050, ground(POSES.takeoff, h, 380)];
      x = lerp(start[0], end[0], u);
      y = lerp(start[1], end[1], u) - Math.sin(u * Math.PI) * 160;
    } else if (t < rel) {
      const u = invLerp(hit, rel, t);
      pose = Object.assign({}, POSES.vaultPlant, { fHip: lerp(100, 120, u), bHip: lerp(86, 108, u), tA: lerp(62, 70, u) });
      const ho = handOff(pose);
      x = jTop[0] - ho[0];
      y = jTop[1] - ho[1];
    } else {
      const u = invLerp(rel, tE, t);
      const p0 = Object.assign({}, POSES.vaultPlant, { fHip: 120, bHip: 108, tA: 70 });
      pose = AO.blend(p0, POSES.land, E.outCubic(u));
      const ho = handOff(p0);
      const st = [jTop[0] - ho[0], jTop[1] - ho[1]];
      x = lerp(st[0], 1050, E.inCubic(u) * 0.6 + u * 0.4);
      y = lerp(st[1], ground(POSES.land, h, 380), u) - Math.sin(u * Math.PI) * 120;
      spin = -10 * Math.sin(u * Math.PI);
    }
    AO.drawAO(ctx, pose, { x, y, h, t, wind: 0.7, spin });
    S.fx.uFlash = impactPulse(t, hit, 0.06) * 0.35;
    S.fx.uFlashCol = AO.hexToRgb(C.ice);
    S.fx.uRgb = impactPulse(t, hit, 0.1) * 0.01 + impactPulse(t, tS, 0.1) * 0.006;
    S.fx.uHalftone = 0.15;
    S.shake = impactPulse(t, hit, 0.14) * 0.024 + impactPulse(t, tS, 0.1) * 0.012;
  };

  // ---------------------------------------------------------------- CUT 07
  CUTFN[7] = (ctx, t, S) => {
    const tS = S.cut.start, tE = S.cut.end;
    AO.fill(ctx, C.ice);
    const riser = invLerp(tS, tE, t);
    AO.camera(ctx, { zoom: 1 + riser * riser * 0.14 });
    const ang = -20 * AO.DEG;
    // black diagonal stripe
    ctx.save();
    ctx.rotate(ang);
    ctx.fillStyle = C.black;
    ctx.fillRect(-1500, 40, 3000, 230);
    AO.text(ctx, 'GHOST FRAMES  ×3  //  07', 0, 175, { size: 26, mono: true, weight: 700, fill: C.ice, track: 10 });
    ctx.restore();
    // outlined FLIP: readable first, then rotates 180° with her rotation
    const fr = E.inOutCubic(invLerp(tS + 0.12, tE, t)) * Math.PI;
    AO.text(ctx, 'FLIP', 0, 0, { size: 560, stroke: C.black, lw: 12, base: 'middle', rot: fr, alpha: 0.95 });
    const h = 500;
    const stateAt = (tt) => {
      const u = invLerp(tS, tE, tt);
      const x = lerp(-760, 760, u);
      const y = -Math.tan(-ang) * x + 20 - Math.sin(u * Math.PI) * 240;
      const k1 = smoothstep(0.0, 0.35, u), k2 = smoothstep(0.62, 0.95, u);
      const pose = AO.blend(AO.blend(POSES.takeoff, POSES.tuck, k1), POSES.land, k2);
      return { pose, x, y, spin: -360 * E.inOutCubic(u) };
    };
    // stroboscopic ghosts stamped on onsets, tinted per palette color
    const ghostT = [tS, 7.012, 7.326];
    const tints = [[C.cobalt, 0.75], [C.white, 0.8], [C.black, 0.85]];
    ghostT.forEach((gt, i) => {
      if (t < gt) return;
      const st = stateAt(gt);
      AO.drawAO(ctx, st.pose, { x: st.x, y: st.y, h, t: gt, spin: st.spin, pivot: 'com', wind: 0.8, pal: AO.tinted(tints[i][0], tints[i][1]), alpha: 0.85 - (t - gt) * 0.5 });
    });
    const st = stateAt(t);
    AO.drawAO(ctx, st.pose, { x: st.x, y: st.y, h, t, spin: st.spin, pivot: 'com', wind: 0.9 });
    S.fx.uZoomBlur = riser * riser * 0.45;
    S.fx.uFocus = [0.5, 0.5];
    S.fx.uFlash = pulses(t, ghostT, 0.05) * 0.4 + E.inExpo(invLerp(tE - 0.12, tE, t)) * 0.8;
    S.fx.uRgb = pulses(t, ghostT, 0.1) * 0.014 + riser * 0.006;
    S.shake = pulses(t, ghostT, 0.1) * 0.012 + riser * 0.004;
  };

  // ---------------------------------------------------------------- CUT 08 (DROP)
  CUTFN[8] = (ctx, t, S) => {
    const tS = S.cut.start, tE = S.cut.end;
    const words = [
      { w: 'COOL', bg: C.ice, fg: C.black },
      { w: 'FAST', bg: C.cobalt, fg: C.white },
      { w: 'CLEAN', bg: C.white, fg: C.black },
      { w: 'BLUE', bg: C.black, fg: C.cobalt },
    ];
    const bi = clamp(AO.beatIndex(t) - 22, 0, 3);
    const tw = b(22 + bi);
    const Wd = words[bi];
    AO.fill(ctx, Wd.bg);
    AO.camera(ctx, { zoom: 1 + AO.beatPulse(t, 0.1) * 0.025 + AO.lowAt(t) * 0.01 });
    const k = E.outExpo(invLerp(tw, tw + 0.1, t));
    const size = Math.min(620, (1760 / AO.measure(ctx, Wd.w, 100, -10)) * 100);
    AO.text(ctx, Wd.w, 0, -60, { size, fill: Wd.fg, base: 'middle', sx: lerp(1.6, 1, k), sy: lerp(1.6, 1, k), rot: lerp(-0.08, 0, k), track: -10 });
    AO.text(ctx, '0' + (bi + 1) + ' / 04', 880, -460, { size: 24, mono: true, weight: 800, fill: Wd.fg, align: 'right' });
    AO.barcode(ctx, -900, 400, 240, 40, 80 + bi, Wd.fg, 0.8);
    // knee slide across the foreground
    const h = 700, GY = 520;
    const u = invLerp(tS, tE, t);
    const xAt = (uu) => lerp(-1300, 1300, 0.3 * uu + 0.7 * E.outCubic(uu));
    const x = xAt(u);
    const pose = Object.assign({}, POSES.kneeSlide, { hA: 16 + Math.sin(t * 9) * 3 });
    const y = ground(pose, h, GY);
    const rr = prng(88);
    const seeds = Array.from({ length: 90 }, () => [rr(), rr(), rr(), rr()]);
    AO.particles(ctx, t, 90, (i) => {
      const t0 = tS + i * 0.0155;
      const s = seeds[i];
      return { t0, x: xAt(invLerp(tS, tE, t0)) - 0.12 * h + s[3] * 60, y: GY - 6, vx: -(150 + s[0] * 800), vy: -(150 + s[1] * 650), size: 3 + s[2] * 8, col: s[3] > 0.5 ? C.white : C.iceSoft, shape: s[2] > 0.6 ? 'dot' : 'diamond', rot: 6 };
    }, { life: 0.65, drag: 3, gravity: 900 });
    AO.drawAO(ctx, pose, { x, y, h, t, wind: 1.1 });
    const hits = [b(22), b(23), b(24), b(25)];
    S.fx.uFlash = pulses(t, hits, 0.055) * 0.85;
    S.fx.uFlashCol = [1, 1, 1];
    S.fx.uRgb = pulses(t, hits, 0.12) * 0.022;
    S.fx.uSpeed = 0.35;
    S.fx.uSpeedCol = AO.hexToRgb(Wd.fg);
    S.fx.uFocus = [0.5, 0.45];
    S.fx.uBloom = 0.2;
    S.shake = pulses(t, hits, 0.13) * 0.026;
  };

  // ---------------------------------------------------------------- CUT 09
  CUTFN[9] = (ctx, t, S) => {
    const tS = S.cut.start, tK = b(27) + 0.12, tF = b(28);
    const tc = Math.min(t, tF); // time freeze
    const frozen = t >= tF;
    AO.fill(ctx, C.black);
    AO.camera(ctx, { zoom: 1 + (frozen ? (t - tF) * 0.06 : 0) + AO.beatPulse(t, 0.1) * 0.01 });
    // tilting 3D wireframe grid
    const tilt = lerp(14, 80, E.inOutCubic(invLerp(tS, tK, tc))) * AO.DEG;
    const f = 900, cyH = -60, scroll = (tc * 700) % 120;
    const proj = (u, v) => {
      const X = u, Y = 330 - v * Math.sin(tilt), Z = v * Math.cos(tilt) + 60;
      const s = f / (f + Z);
      return [X * s, cyH + (Y - cyH) * s];
    };
    ctx.save();
    ctx.strokeStyle = C.white;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    for (let u = -2400; u <= 2400; u += 120) {
      const a = proj(u, 0), c = proj(u, 2600);
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(c[0], c[1]);
    }
    for (let v = -scroll; v <= 2600; v += 120) {
      if (v < 0) continue;
      const a = proj(-2400, v), c = proj(2400, v);
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(c[0], c[1]);
    }
    ctx.stroke();
    ctx.restore();
    // wall run → kick off → hang
    const h = 480;
    let pose, x, y, spin;
    if (tc < tK) {
      const u = invLerp(tS, tK, tc);
      pose = AO.runPose((tc - tS) / BP);
      x = lerp(-760, -40, u);
      y = lerp(250, -120, E.inCubic(u) * 0.5 + u * 0.5);
      spin = lerp(-5, -48, smoothstep(0.1, 0.7, u));
    } else {
      const u = invLerp(tK, tF, tc);
      pose = AO.blend(POSES.takeoff, POSES.freeze, E.outCubic(u));
      x = lerp(-40, 140, E.outCubic(u));
      y = lerp(-120, -260, E.outCubic(u));
      spin = lerp(-48, 0, E.outCubic(u));
    }
    if (frozen) y += Math.sin((t - tF) * 5) * 4;
    const opt = { x, y, h, t: tc, spin, pivot: 'com', wind: 0.6 };
    AO.drawAO(ctx, pose, opt);
    if (frozen) {
      const c = AO.point(pose, opt, 'chest');
      const k = E.outBack(invLerp(tF, tF + 0.16, t), 1.6);
      const R = 310 * lerp(1.7, 1, k);
      AO.ring(ctx, c[0], c[1], R, 18, C.cobalt, 1);
      AO.ring(ctx, c[0], c[1], R + 34, 2, C.cobalt, 0.8, 0, Math.PI * 2, [8, 8]);
      ctx.save();
      ctx.translate(c[0], c[1]);
      ctx.rotate((t - tF) * 0.6);
      ctx.strokeStyle = C.ice;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 72; i++) {
        const a = (i / 72) * Math.PI * 2, l = i % 6 === 0 ? 26 : 10;
        ctx.moveTo(Math.cos(a) * (R + 50), Math.sin(a) * (R + 50));
        ctx.lineTo(Math.cos(a) * (R + 50 + l), Math.sin(a) * (R + 50 + l));
      }
      ctx.stroke();
      ctx.restore();
      AO.brackets(ctx, c[0], c[1], R * 2 + 160, C.white, 5, lerp(Math.PI / 4, 0, E.outExpo(invLerp(tF, tF + 0.2, t))), 0.16);
      ctx.save();
      ctx.strokeStyle = C.cobalt;
      ctx.globalAlpha = 0.6;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(c[0] - 1100, c[1]);
      ctx.lineTo(c[0] - R - 60, c[1]);
      ctx.moveTo(c[0] + R + 60, c[1]);
      ctx.lineTo(c[0] + 1100, c[1]);
      ctx.stroke();
      ctx.restore();
      const lines = ['TARGET LOCK', 'ID      AK-01', 'ALT     3.20 M', 'SPD     34.6 KM/H', 'STATUS  COOL'];
      let budget = Math.floor((t - tF) * 110);
      lines.forEach((ln, i) => {
        const s = ln.slice(0, Math.max(0, budget));
        budget -= ln.length;
        AO.text(ctx, s, -880, -360 + i * 42, { size: i === 0 ? 30 : 24, mono: true, weight: 800, fill: i === 0 ? C.ice : C.white, align: 'left' });
      });
    }
    S.fx.uRgb = impactPulse(t, tF, 0.14) * 0.03 + impactPulse(t, tK, 0.1) * 0.012;
    S.fx.uFlash = impactPulse(t, tF, 0.06) * 0.6;
    S.fx.uFlashCol = AO.hexToRgb(C.cobalt);
    S.fx.uScan = frozen ? 0.35 : 0.12;
    S.fx.uSpeed = frozen ? 0 : 0.4;
    S.fx.uSpeedCol = [1, 1, 1];
    S.fx.uFocus = [0.5, 0.45];
    S.shake = (frozen ? impactPulse(t, tF, 0.14) * 0.03 : AO.beatPulse(t, 0.1) * 0.012);
  };

  // ---------------------------------------------------------------- CUT 10
  CUTFN[10] = (ctx, t, S) => {
    const tS = S.cut.start, tE = S.cut.end;
    const s1 = b(29), s2 = b(30), s3 = b(31), tW = s3 + 0.1;
    AO.fill(ctx, C.black);
    AO.camera(ctx, { zoom: 1 + AO.beatPulse(t, 0.1) * 0.02 });
    AO.text(ctx, 'A-K', 0, -120, { size: 760, fill: C.white, base: 'middle', track: -20 });
    const pane = (bg, fg, size) => {
      ctx.fillStyle = bg;
      ctx.fillRect(-W, -H, W * 2, H * 2);
      AO.text(ctx, 'A-K', 0, -150, { size, fill: fg, base: 'middle', track: -10 });
    };
    if (t < s3) pane(C.white, C.black, 520);
    if (t < s2) pane(C.ice, C.cobalt, 340);
    // dive toward camera
    const u = invLerp(tS, tE, t);
    const h = 300 * Math.exp(Math.log(1700 / 300) * u);
    const pose = POSES.dive;
    AO.drawAO(ctx, pose, { x: lerp(120, 0, u), y: lerp(380, 260, u) + h * 0.05, h, t, wind: 1, pivot: 'com', spin: Math.sin(u * 7) * 4 });
    // most recent shatter flies toward camera
    const last = t >= s3 ? [SH.pane3, s3] : t >= s2 ? [SH.pane2, s2] : [SH.pane1, s1];
    const p = invLerp(last[1], last[1] + 0.34, t);
    if (p < 1) AO.drawShards(ctx, last[0], p, { dist: 1300, scaleToCam: 1.6, fade: 0.55, edge: 'rgba(255,255,255,0.6)' });
    // foreground sneaker wipe
    if (t >= tW) {
      const k = E.inOutCubic(invLerp(tW, tE, t));
      const sx = lerp(2600, -300, k);
      ctx.save();
      ctx.fillStyle = C.white;
      ctx.fillRect(sx + 700, -H, W * 3, H * 2);
      ctx.restore();
      AO.drawBigSneaker(ctx, sx, 40, 2600, -0.08);
      AO.streaks(ctx, sx + 2400, 0, 900, 22, C.ice, 12, t, 900);
    }
    const hits = [s1, s2, s3];
    S.fx.uFlash = pulses(t, hits, 0.05) * 0.8;
    S.fx.uRgb = pulses(t, hits, 0.12) * 0.026;
    S.fx.uZoomBlur = pulses(t, hits, 0.12) * 0.6 + u * 0.15;
    S.fx.uFocus = [0.5, 0.45];
    S.fx.uWhip = t >= tW ? E.inOutCubic(invLerp(tW, tE, t)) * 0.6 : 0;
    S.fx.uBloom = 0.25;
    S.shake = pulses(t, hits, 0.14) * 0.028;
  };

  // ---------------------------------------------------------------- CUT 11
  CUTFN[11] = (ctx, t, S) => {
    const i = clamp(AO.beatIndex(t) - 32, 0, 3);
    const t0 = b(32 + i), t1 = i < 3 ? b(33 + i) : S.cut.end;
    const lp = invLerp(t0, t1, t);
    const pop = E.outExpo(invLerp(t0, t0 + 0.1, t));
    const bgs = [C.cobalt, C.white, C.black, C.ice];
    AO.fill(ctx, bgs[i]);
    AO.camera(ctx, { zoom: lerp(1.08, 1, pop) + lp * 0.05 });
    const slide = (a) => lerp(a, 0, E.outExpo(invLerp(t0, t0 + 0.25, t)));
    if (i === 0) {
      AO.text(ctx, '01', -480 + slide(-120), 230, { size: 760, stroke: C.white, lw: 10 });
      AO.text(ctx, 'FLIP', 900, 0, { size: 120, fill: C.ice, rot: Math.PI / 2, base: 'middle' });
      AO.barcode(ctx, -880, 400, 280, 44, 101, C.white);
      ctx.fillStyle = C.ice;
      ctx.fillRect(-960, -470 + slide(-60), 1920, 6);
      AO.drawAO(ctx, POSES.tuck, { x: 420, y: -30, h: 760, t, spin: -150 - lp * 90, pivot: 'com', wind: 0.9 });
    } else if (i === 1) {
      ctx.save();
      ctx.rotate(-0.42);
      ctx.fillStyle = C.black;
      ctx.fillRect(-1600, -70 + slide(300), 3200, 260);
      ctx.restore();
      AO.text(ctx, '02', 560 + slide(120), 150, { size: 600, fill: C.cobalt, stroke: C.white, lw: 8 });
      AO.text(ctx, 'SLIDE', -880, -380, { size: 140, fill: C.cobalt, align: 'left' });
      AO.ticks(ctx, -880, -340, 420, 30, C.black);
      AO.drawAO(ctx, POSES.slide, { x: -360 + lp * 80, y: ground(POSES.slide, 600, 470), h: 600, t, wind: 1 });
    } else if (i === 2) {
      AO.disc(ctx, 360, -10, 400, C.ice);
      AO.halftone(ctx, -960, 260, 1920, 280, 22, C.ice, 'y');
      AO.text(ctx, '03', -500 + slide(-120), 230, { size: 700, fill: C.white });
      AO.text(ctx, 'LAND', 900, 470, { size: 80, fill: C.white, align: 'right' });
      AO.drawAO(ctx, POSES.land, { x: 380, y: ground(POSES.land, 600, 320), h: 600, t, wind: 0.6 });
    } else {
      AO.text(ctx, '04', 0, 340 + slide(80), { size: 960, fill: C.cobalt, alpha: 0.95 });
      AO.text(ctx, 'AK', -880, -400, { size: 90, fill: C.black, align: 'left' });
      AO.text(ctx, 'HANDS IN POCKETS  //  2026', -880, -350, { size: 22, mono: true, weight: 700, fill: C.black, align: 'left' });
      AO.barcode(ctx, 620, -440, 260, 40, 104, C.black);
      AO.drawAO(ctx, POSES.pockets, { x: 0, y: ground(POSES.pockets, 820, 560), h: 820, t, wind: 0.5 });
    }
    S.fx.uFlash = impactPulse(t, t0, 0.05) * 0.7;
    S.fx.uFlashCol = [1, 1, 1];
    S.fx.uRgb = impactPulse(t, t0, 0.1) * 0.02;
    S.fx.uHalftone = 0.22;
    S.shake = impactPulse(t, t0, 0.12) * 0.022;
  };

  // ---------------------------------------------------------------- CUT 12 (hero)
  CUTFN[12] = (ctx, t, S) => {
    const tS = S.cut.start, tL = b(39), tR = b(40) + 0.2, tFz = b(41), tWo = b(43), tE = S.cut.end;
    const tc = Math.min(t, tFz); // iconic freeze from b41
    const GY = 360;
    // cyclorama
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#FFFFFF');
    g.addColorStop(0.62, '#F3F6FB');
    g.addColorStop(1, '#DCE4EF');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    AO.camera(ctx, { zoom: lerp(0.94, 1.12, E.inOutCubic(invLerp(tS, tE, t))), y: -20 });
    // background typography (shatters on landing)
    if (t < tL) {
      AO.text(ctx, 'AK', 0, 210, { size: 1000, stroke: C.ice, lw: 14, track: -30, alpha: 0.9 });
      AO.text(ctx, 'NO BRAKES  •  NO LIMITS  •  FULL SPEED', 0, 300, { size: 34, mono: true, weight: 800, fill: C.silver, track: 8 });
    } else {
      const p = invLerp(tL, tL + 0.7, tc);
      AO.drawShards(ctx, SH.heroA, p, { dist: 1500, fade: 0.6 });
      AO.drawShards(ctx, SH.heroO, p, { dist: 1500, fade: 0.6 });
    }
    // shockwave rings + wind streaks
    if (t >= tL) {
      for (let i = 0; i < 6; i++) {
        const ti = tL + i * 0.055;
        const p = invLerp(ti, ti + 0.9, tc);
        if (p <= 0 || p >= 1) continue;
        const r = lerp(40, 1700, E.outExpo(p));
        ctx.save();
        ctx.globalAlpha = 1 - p;
        ctx.strokeStyle = C.cobalt;
        ctx.lineWidth = lerp(26, 2, p);
        ctx.beginPath();
        ctx.ellipse(0, GY, r, r * 0.26, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        if (i < 3) AO.ring(ctx, 0, GY - 260, r * 0.8, lerp(14, 1, p), C.cobalt, (1 - p) * 0.55);
      }
      const wp = invLerp(tL, tL + 0.5, tc);
      if (wp < 1) {
        const rr = prng(121);
        ctx.save();
        ctx.lineCap = 'round';
        for (let i = 0; i < 40; i++) {
          const a = rr() * Math.PI * 2, r0 = 200 + E.outExpo(wp) * (500 + rr() * 900);
          ctx.strokeStyle = rr() > 0.5 ? C.ice : C.silver;
          ctx.globalAlpha = (1 - wp) * 0.8;
          ctx.lineWidth = 2 + rr() * 5;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * r0, GY - 250 + Math.sin(a) * r0 * 0.6);
          ctx.lineTo(Math.cos(a) * (r0 + 160), GY - 250 + Math.sin(a) * (r0 + 160) * 0.6);
          ctx.stroke();
        }
        ctx.restore();
      }
      for (const bt of [b(40), b(41)]) {
        const p = invLerp(bt, bt + 0.5, tc);
        if (p > 0 && p < 1) AO.ring(ctx, 0, GY - 280, lerp(320, 900, E.outExpo(p)), 6, C.ice, 1 - p);
      }
    }
    // backflip descent (speed-ramped slow motion) → landing → rise to hands-in-pockets
    const h = 640;
    let pose, x, y, spin = 0;
    if (tc < tL) {
      const u0 = invLerp(tS, tL, tc);
      const u = u0 + (0.75 / (2 * Math.PI)) * Math.sin(2 * Math.PI * u0); // fast–slow–fast ramp
      const k1 = smoothstep(0.05, 0.3, u), k2 = smoothstep(0.7, 1, u);
      pose = AO.blend(AO.blend(POSES.layout, POSES.tuck, k1), POSES.heroLand, k2);
      x = lerp(-420, 0, E.outCubic(u));
      const yL = ground(POSES.heroLand, h, GY) - 0.07 * h;
      y = lerp(-820, yL, u) - Math.sin(u * Math.PI) * 260;
      spin = -360 * u;
    } else {
      const k = E.inOutCubic(invLerp(tL + 0.12, tR, tc));
      pose = AO.blend(POSES.heroLand, POSES.pockets, k);
      pose.smile = lerp(0, 0.6, smoothstep(tR - 0.2, tFz, tc));
      x = 0;
      y = ground(pose, h, GY) - 0.07 * h;
    }
    // contact shadow
    const air = clamp(1 - (GY - 0.07 * h - y) / 900, 0, 1);
    ctx.save();
    ctx.globalAlpha = 0.22 * air;
    ctx.fillStyle = C.ink;
    ctx.beginPath();
    ctx.ellipse(0, GY + 4, 170 * air + 30, 22 * air + 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    AO.drawAO(ctx, pose, { x, y, h, t: tc, spin, pivot: 'com', wind: t >= tL ? lerp(1.2, 0.5, invLerp(tL, tL + 0.8, tc)) : 0.9 });
    const hitsL = [tL];
    S.fx.uFlash = impactPulse(t, tL, 0.07) * 0.8;
    S.fx.uFlashCol = [1, 1, 1];
    S.fx.uRgb = impactPulse(t, tL, 0.16) * 0.032 + (t < tFz ? AO.beatPulse(t, 0.1) * 0.004 : 0);
    S.fx.uZoomBlur = impactPulse(t, tL, 0.14) * 0.7;
    S.fx.uFocus = [0.5, 0.62];
    S.fx.uWhite = E.inExpo(invLerp(tWo, tE, t));
    S.fx.uBloom = 0.2 + E.inExpo(invLerp(tWo, tE, t)) * 0.8;
    S.fx.uHalftone = t >= tFz ? 0.18 : 0.05;
    S.shake = pulses(t, hitsL, 0.2) * 0.036 + (t < tFz ? AO.beatPulse(t, 0.1) * 0.006 : 0);
  };

  // ---------------------------------------------------------------- CUT 13 (identity)
  CUTFN[13] = (ctx, t, S) => {
    const tS = S.cut.start, tP = b(46), tX = b(48), tE = S.cut.end;
    AO.fill(ctx, '#F3F6FA');
    AO.camera(ctx, { zoom: lerp(1.0, 1.05, invLerp(tS, tE, t)) + impactPulse(t, tP, 0.1) * 0.015 + impactPulse(t, tX, 0.12) * 0.02 });
    // translucent ice rings + technical arcs
    AO.ring(ctx, 120, -40, 520, 22, C.ice, 0.28);
    AO.ring(ctx, 120, -40, 640, 3, C.ice, 0.55, 0, Math.PI * 2, [3, 12]);
    ctx.save();
    ctx.translate(120, -40);
    ctx.rotate(t * 0.25);
    AO.ring(ctx, 0, 0, 760, 6, C.cobalt, 0.35, 0.2, 1.4);
    AO.ring(ctx, 0, 0, 760, 6, C.cobalt, 0.35, 3.3, 4.1);
    ctx.restore();
    AO.ring(ctx, 120, -40, 880, 1.5, C.silver, 0.6);
    AO.halftone(ctx, -960, 120, 700, 420, 20, C.ice, 'x');
    // enormous AO with ice sweep (offscreen for source-atop)
    if (!off13) {
      off13 = document.createElement('canvas');
      off13.width = W;
      off13.height = H;
    }
    const o = off13.getContext('2d');
    o.setTransform(1, 0, 0, 1, 0, 0);
    o.clearRect(0, 0, W, H);
    o.setTransform(ctx.getTransform());
    AO.text(o, 'AK', 0, 330, { size: 1060, fill: C.black, track: -40 });
    const sp = invLerp(tP, tP + 0.42, t);
    if (sp > 0 && sp < 1) {
      o.globalCompositeOperation = 'source-atop';
      const sx = lerp(-1300, 1300, E.inOutCubic(sp));
      const gr = o.createLinearGradient(sx - 260, 0, sx + 260, 0);
      gr.addColorStop(0, 'rgba(126,232,250,0)');
      gr.addColorStop(0.5, 'rgba(126,232,250,1)');
      gr.addColorStop(1, 'rgba(126,232,250,0)');
      o.fillStyle = gr;
      o.save();
      o.transform(1, 0, -0.35, 1, 0, 0);
      o.fillRect(-1600, -700, 3200, 1400);
      o.restore();
      o.globalCompositeOperation = 'source-over';
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(off13, 0, 0);
    ctx.restore();
    // rough emblem
    AO.emblem(ctx, 690, -250, 170, t);
    // AO standing relaxed, overlapping the letters, wind rippling the jacket
    const h = 780;
    const pose = Object.assign({}, POSES.pockets, { hA: -3 + Math.sin(t * 1.3) * 1.5, smile: 0.5 });
    AO.drawAO(ctx, pose, { x: 60, y: ground(pose, h, 520), h, t, wind: 0.55 + AO.lowAt(t) * 0.3 });
    AO.text(ctx, 'ayo.__chill', -880, 470, { size: 34, mono: true, weight: 800, fill: C.black, align: 'left', track: 4 });
    AO.text(ctx, 'AK  —  2026', 880, 470, { size: 26, mono: true, weight: 800, fill: C.cobalt, align: 'right', track: 4 });
    // frost-ring stinger
    if (t >= tX) {
      const p = invLerp(tX, tX + 0.8, t);
      AO.ring(ctx, 60, -60, lerp(80, 1400, E.outExpo(p)), lerp(30, 2, p), C.ice, 1 - p);
      AO.ring(ctx, 60, -60, lerp(40, 900, E.outExpo(p)), lerp(10, 1, p), C.white, 1 - p);
      const rr = prng(133);
      const seeds = Array.from({ length: 70 }, () => [rr(), rr(), rr()]);
      AO.particles(ctx, t, 70, (i) => {
        const s = seeds[i], a = s[0] * Math.PI * 2, v = 500 + s[1] * 1400;
        return { t0: tX, x: 60, y: -60, vx: Math.cos(a) * v, vy: Math.sin(a) * v, size: 3 + s[2] * 7, col: s[2] > 0.5 ? C.ice : C.white, rot: 4 };
      }, { life: 0.9, drag: 3.2, gravity: 120 });
    }
    S.fx.uWhite = 1 - E.outCubic(invLerp(tS, tS + 0.28, t));
    S.fx.uFlash = impactPulse(t, tX, 0.08) * 0.75 + impactPulse(t, tP, 0.05) * 0.25;
    S.fx.uFlashCol = AO.hexToRgb(C.iceSoft);
    S.fx.uRgb = impactPulse(t, tX, 0.14) * 0.02 + impactPulse(t, tP, 0.1) * 0.01;
    S.fx.uHalftone = 0.12;
    S.fx.uBloom = 0.18;
    S.fx.uVig = 0.18 + invLerp(16.6, tE, t) * 0.6;
    S.shake = impactPulse(t, tX, 0.14) * 0.018 + impactPulse(t, tP, 0.1) * 0.01;
  };

  // ======================================================================
  function renderAt(ctx, fx, rawT) {
    const t = clamp(rawT, 0, AO.DURATION);
    const cut = AO.cutAt(t);
    const S = { cut, lt: invLerp(cut.start, cut.end, t), ls: t - cut.start, fx: fx.u, shake: 0 };
    fx.reset();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.save();
    CUTFN[cut.id](ctx, t, S);
    ctx.restore();
    // shake scaled lightly by song energy; zoom covers edges
    const amt = S.shake * (0.7 + AO.energyAt(t) * 0.5);
    const s = shake(t, amt);
    fx.u.uShake = [s.x, s.y];
    fx.u.uRoll = s.r * 0.6;
    fx.u.uZoom = 1 + amt * 2.2;
    fx.render(t);
    return cut;
  }

  AO.renderAt = renderAt;
})();
