# Customize & play

Everything here is plain JavaScript: no build, no framework. Edit a file, save it, refresh `index.html`.

**Start in [`src/custom.js`](src/custom.js).** It loads last, so anything you put there overrides the defaults without touching the core files. It already contains commented examples for each section below.

---

## 1. Change text

All the on-screen words live in [`src/cuts.js`](src/cuts.js). Search for `AO.text(` and edit the string:

```js
AO.text(ctx, 'AK', 0, 330, { size: 1060, fill: C.black });   // the big end-card letters
AO.text(ctx, 'ayo.__chill', -880, 470, { size: 34, mono: true }); // the end-card name
```

`AO.text(ctx, str, x, y, options)` options:

| Option | What it does |
| --- | --- |
| `size` | font size |
| `fill`, `stroke`, `lw` | fill colour, outline colour and outline width |
| `align`, `base` | text alignment and baseline |
| `sx`, `sy`, `rot`, `alpha` | scale, rotation and opacity |
| `track` | letter spacing |
| `mono: true` | monospace font |

## 2. Change colours

The trailer palette is `AO.COL` in [`src/core.js`](src/core.js). The character palette is `BASE_PAL` in [`src/ao.js`](src/ao.js), exposed as `AO.PAL`. To recolour from `custom.js`:

```js
Object.assign(AO.COL, { cobalt: '#FF3D00', ice: '#FFD166' });
Object.assign(AO.PAL, { hair: '#FF3D7F', jacket: '#111111' });
```

## 3. Write or replace a scene

Scenes are `AO.scenes[1]` to `AO.scenes[13]`. Each one is a function that draws a single frame:

```js
AO.scenes[5] = (ctx, t, S) => {
  AO.fill(ctx, AO.COL.black);                 // background
  AO.camera(ctx, { zoom: 1 });                // origin = screen centre, 1920×1080 world
  const pop = AO.E.outExpo(AO.invLerp(S.cut.start, S.cut.start + 0.15, t));
  AO.text(ctx, 'HELLO', 0, 0, { size: 400, fill: AO.COL.ice, base: 'middle', sx: 2 - pop, sy: 2 - pop });
  S.fx.uRgb = AO.beatPulse(t) * 0.015;        // RGB split on every beat
  S.shake = AO.beatPulse(t) * 0.01;           // camera shake on every beat
};
```

- `t` is the absolute time in seconds.
- `S.cut` is `{ id, name, start, end }`.
- `S.lt` is the progress through the cut, from 0 to 1.

**The golden rule for smoothness:** compute everything from `t`. Never do `x += speed` from frame to frame, and never use `Math.random()`. Use `AO.prng(seed)` or `AO.hash(n)` instead. That keeps scrubbing frame-exact and exports identical to playback.

### Motion toolkit (`src/core.js`)

| Helper | Use it for |
| --- | --- |
| `AO.invLerp(a, b, t)` | 0→1 progress while `t` goes from a to b (clamped) |
| `AO.E.outExpo / inExpo / outBack / inOutCubic / outElastic …` | easing curves; combine as `E.outExpo(invLerp(a, b, t))` |
| `AO.impactPulse(t, at, decay)` | a sharp spike at time `at` that fades out, for hits |
| `AO.dampedSpring(dt, w, z)` | a bounce that settles after a release |
| `AO.b(i)` | time of beat *i* in the song |
| `AO.beatPulse(t)`, `AO.onsetPulse(t)`, `AO.hatPulse(t)` | pulses on every beat, drum hit or hi-hat |
| `AO.energyAt(t)`, `AO.lowAt(t)` | song loudness and bass, 0–1 |
| `AO.prng(seed)`, `AO.hash(n)` | randomness with a fixed seed (same result every time) |

### Graphics toolkit (`src/gfx.js`)

| Helper | What it draws |
| --- | --- |
| `fill`, `camera` | background colour; 2D camera (origin at screen centre) |
| `text`, `letters` | display type; per-letter layout for squash or scatter |
| `barcode`, `ticks`, `brackets`, `halftone` | UI and print details |
| `ring`, `disc` | rings and filled circles |
| `makeShards` + `drawShards` | shatter effects |
| `particles` | particles with drag and gravity |
| `streaks` | speed streaks |
| `snowCrystal`, `emblem` | snowflake and the rough end-card emblem |

### Post-FX knobs (`S.fx`, reset every frame)

| Knob | Effect |
| --- | --- |
| `uRgb`, `uRgbAng` | RGB split amount and direction |
| `uFlash`, `uFlashCol` | full-screen flash and its colour |
| `uInvert`, `uWhite` | invert colours; fade to white |
| `uHalftone`, `uScan` | halftone dots; scanlines |
| `uSpeed`, `uSpeedCol`, `uFocus` | radial speed lines, their colour, and centre |
| `uZoomBlur`, `uWhip`, `uWhipAng` | zoom blur; whip-pan blur and its direction |
| `uBloom`, `uVig`, `uGrain` | glow, vignette, film grain |

## 4. Use your own character

Every scene draws the hero through one function: `AO.drawAO(ctx, pose, o)`. Replace it in `custom.js` and your character appears in all 13 cuts. Example 2 in that file is a working stick-figure template.

- `o` is `{ x, y, h, facing, spin, sx, sy, pal, t, wind, alpha, pivot }`.
- `(x, y)` is the pelvis. When `pivot === 'com'` it's the centre of mass instead.
- `h` is the height in pixels. The feet are about `0.48·h` below the pelvis.
- Silhouette and ghost shots pass a flat palette (`o.pal.flat === true`). Fill with `o.pal.skin` in that case.
- `pose` is an object of joint angles in degrees (see below). You can ignore it and draw a fixed pose, or read it to animate limbs.

To keep the built-in rig and change its look instead, edit [`src/ao.js`](src/ao.js):

| Function | Draws |
| --- | --- |
| `drawHead` | hair, face, eyes and beanie |
| `drawTorso` | jacket and shirt |
| `drawLeg`, `drawArm`, `drawSneaker` | limbs and shoes |

Open [`tools/poses.html`](tools/poses.html) to preview every pose at once.

### Poses

`AO.POSES` holds named poses such as `stand`, `pockets`, `runA`, `slide`, `tuck`, `land`, `leap`, `dive` and `wave`. Blend two with `AO.blend(a, b, k)`. A run cycle is `AO.runPose(phase)`.

| Key | Meaning |
| --- | --- |
| `tA`, `hA` | torso lean and head tilt |
| `fSh`/`fEl`, `bSh`/`bEl` | near and far arm: shoulder and elbow |
| `fHip`/`fKn`, `bHip`/`bKn` | near and far leg: hip and knee |
| `turn` | 0 = profile, 1 = facing the camera |
| `flare` | jacket flare |
| `smile`, `lid`, `lookX`, `lookY` | face controls |

For angles, 0 means the limb points straight down and a positive value swings it forward.

## 5. Use your own song

1. Put your song in the folder, then analyse it (needs ffmpeg and numpy):
   ```bash
   python3 tools/analyze_beats.py my-song.mp3 src/beatmap.js
   ```
2. Point the player and the exporter at it:
   - in `index.html`: `<audio id="song" src="my-song.mp3">`
   - in `tools/export.mjs`: the `song` path
3. Re-snap the cuts. In [`src/core.js`](src/core.js), the `edges` array lists the beat index where each cut starts:
   ```js
   const edges = [0, b(4), b(8), b(11), b(16), ...];
   ```
   - Open the page and use the arrow keys to find where the drop and breakdown fall.
   - Move the edges onto those beats.
   - Update any `b(i)` hit times inside the scenes.
4. Change the number of cuts by adding or removing entries in `edges` and `NAMES` (in `core.js`) and adding scenes to `AO.scenes`.

## 6. Debug tips

- `index.html?t=8.5` freezes on one frame, which is great for tweaking a single moment.
- In the browser console: `__setTrailerTime(8.5)`, and `AO.b(22)` gives the time of beat 22.
- Use ← / → to step frame by frame. Hold Shift to step 0.25s.
- If the screen goes black, open the browser console to see the JavaScript error.

Have fun, and share what you make.
