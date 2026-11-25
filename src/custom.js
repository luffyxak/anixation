/*
 * custom.js: your playground. Loaded last, so anything here overrides the defaults.
 * Uncomment an example, save, and refresh index.html. See CUSTOMIZE.md for the full guide.
 */
(function () {
  'use strict';
  const AO = window.AO;
  const { E, invLerp, lerp, impactPulse, b, COL: C } = AO;

  // ── Example 1: replace a scene ───────────────────────────────────────────
  // Scenes are AO.scenes[1..13]. Each is (ctx, t, S) => draw one frame at time t.
  // S.cut = { id, name, start, end }, S.lt = 0..1 progress through the cut,
  // S.fx = post-FX knobs, S.shake = camera shake amount for this frame.
  //
  // AO.scenes[5] = (ctx, t, S) => {
  //   AO.fill(ctx, C.black);                       // background
  //   AO.camera(ctx, { zoom: 1 + AO.beatPulse(t) * 0.03 }); // (0,0) = screen centre now
  //   const pop = E.outExpo(invLerp(S.cut.start, S.cut.start + 0.15, t));
  //   AO.text(ctx, 'HELLO', 0, 0, { size: 420, fill: C.ice, base: 'middle', sx: lerp(1.6, 1, pop), sy: lerp(1.6, 1, pop) });
  //   const pose = AO.runPose((t - S.cut.start) / AO.BM.beatPeriod); // one run cycle per beat
  //   AO.drawAO(ctx, pose, { x: lerp(-900, 900, S.lt), y: 120, h: 520, t, wind: 0.8 });
  //   S.shake = impactPulse(t, b(17), 0.12) * 0.02; // shake on beat 17
  //   S.fx.uRgb = AO.beatPulse(t) * 0.015;          // RGB split on every beat
  // };

  // ── Example 2: replace the character ────────────────────────────────────
  // Every scene draws the hero with AO.drawAO(ctx, pose, o). Swap it for your own art.
  // o = { x, y, h (height px), facing ±1, spin (deg), sx, sy, pal, t, wind, alpha, pivot }
  // (x, y) is the pelvis (or centre of mass when o.pivot === 'com'); feet are ~h*0.48 below.
  //
  // AO.drawAO = (ctx, pose, o) => {
  //   ctx.save();
  //   ctx.translate(o.x, o.y + (o.pivot === 'com' ? 0.07 * o.h : 0));
  //   ctx.rotate(((o.spin || 0) * Math.PI) / 180);
  //   ctx.scale((o.facing || 1) * (o.sx ?? 1), o.sy ?? 1);
  //   if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
  //   const h = o.h;
  //   ctx.fillStyle = (o.pal && o.pal.flat) ? o.pal.skin : '#FF4D6D'; // silhouettes pass a flat palette
  //   ctx.beginPath(); ctx.arc(0, -h * 0.42, h * 0.08, 0, Math.PI * 2); ctx.fill(); // head
  //   ctx.fillRect(-h * 0.07, -h * 0.34, h * 0.14, h * 0.34);                        // body
  //   ctx.fillRect(-h * 0.06, 0, h * 0.04, h * 0.46); ctx.fillRect(h * 0.02, 0, h * 0.04, h * 0.46); // legs
  //   ctx.restore();
  // };

  // ── Example 3: tweak existing poses ─────────────────────────────────────
  // Angles are degrees. 0 = limb straight down, + = swing forward.
  // AO.POSES.pockets.smile = 1;  AO.POSES.wave.fSh = -170;

  // ── Example 4: recolour the palette ─────────────────────────────────────
  // Object.assign(AO.PAL, { hair: '#FF3D7F', hairSh: '#B0124D', hairHi: '#FF9CC2', jacket: '#111111' });
  // Object.assign(AO.COL, { cobalt: '#FF3D00', ice: '#FFD166' });

  void E; void invLerp; void lerp; void impactPulse; void b; void C;
})();
