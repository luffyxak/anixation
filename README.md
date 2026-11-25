# anixation: AK, a beat-locked motion-graphics trailer in pure code

A 17-second, 13-cut character reveal trailer built with **Canvas2D, one GLSL post-FX pass and plain JavaScript**. There are no images, no video files and no 3D models. Every frame is drawn by code, and every cut and hit is locked to the beats of the song.

> **Remix it.** Swap the character, write your own scenes, drop in your own song. Start with [CUSTOMIZE.md](CUSTOMIZE.md). The creative brief it started from is in [PROMPT.md](PROMPT.md).

## Remix it with AI (Claude Code, ChatGPT, Gemini)

You don't need to code. Give this project to an AI assistant and tell it what you want.

**Step 1: give it the project.** Pick whichever fits your tool:

- **Copy the link:** `https://github.com/luffyxak/anixation`, then paste it into your AI chat.
- **Download the ZIP:** click the green **Code** button above, then **Download ZIP**. Upload the ZIP (or unzip it and upload the files) to ChatGPT, Gemini or Claude.
- **Claude Code** (works best, since it can edit and run the files directly):
  ```bash
  git clone https://github.com/luffyxak/anixation.git && cd anixation && claude
  ```

**Step 2: paste a prompt like this one**, then change the part in brackets:

```text
This is a pure-code motion-graphics trailer (Canvas2D + GLSL), synced to a song's beats.
Read README.md and CUSTOMIZE.md first. Every frame must be computed from time t
(no per-frame accumulation, no Math.random), and hits must use AO.b(i) beat times.

I want to: [change the letters to "XY" and the end-card name to "@myname" /
make the character a red-haired girl in a black hoodie / replace cut 5 with my own
scene / use my song my-song.mp3 and re-snap all cuts to its drop].

Put scene and character changes in src/custom.js where possible.
Give me the full updated files.
```

**Step 3: open `index.html`** to watch it. Scrub with the arrow keys, and run `npm run export` to save an MP4.

Ideas to try: your own name or logo, a new character, a new colour palette, a different song, extra cuts, a vertical 9:16 version for Reels/TikTok.

## Run it

No build step and no server. Just open the page:

1. Clone or download this repo.
2. Double-click `index.html` (Chrome, Safari, Edge or Firefox).
3. Click or press **Space** to play.

| Key | Action |
| --- | --- |
| Click / Space | Play / pause |
| R | Replay from the start |
| M | Mute |
| ← / → | Step one frame (hold Shift for 0.25s) |
| Scrub bar | Seek anywhere |

To show a single frame, add `?t=` to the address, for example `index.html?t=13.43`. From the browser console, `window.__setTrailerTime(13.43)` does the same.

## Export an MP4

Needs [Node.js](https://nodejs.org), [ffmpeg](https://ffmpeg.org) and Google Chrome.

```bash
npm install
```

```bash
npm run export
```

This writes `trailer.mp4` (1920×1080, 60fps, with the song). Use `npm run export:30` for 30fps. The export renders each frame at its exact time, so it never drops frames or drifts off the beat, however slow your machine is. If Chrome isn't in `/Applications`, set its path: `CHROME="/path/to/chrome" npm run export`.

## Why it's smooth

1. **Every frame comes from the clock alone.** `AO.renderAt(ctx, fx, t)` draws the whole frame from the time `t`. Nothing builds up between frames, and there's no `Math.random` (randomness uses a fixed seed). So scrubbing is frame-exact and exports match playback.
2. **The song is the clock.** Playback reads the audio position, smoothed with `performance.now()`, so the visuals can't drift off the beat.
3. **Beats are data.** `tools/analyze_beats.py` found the tempo (172 BPM), every beat, the drum hits, and the energy and bass curves. Scenes refer to beats as `AO.b(i)`, the i-th beat, so hits land exactly.
4. **Small motion primitives:**
   - **Windowed easing:** `E.outExpo(invLerp(start, end, t))` runs an easing curve over a time window.
   - **Hits:** `impactPulse(t, beat)` is a sharp spike that fades out. It drives shake, RGB split and flashes.
   - **Bounces:** `dampedSpring(dt)` gives a rebound that settles.

## Song → cut map

| Cut | Time (s) | Beats | What syncs |
| :-: | --- | --- | --- |
| 01 | 0.00–1.43 | b0–b4 | circle slam b0, bars b1, **A** b2, **K** b3 |
| 02 | 1.43–2.73 | b4–b8 | eye in the porthole, glance up b5, shatter b7 |
| 03 | 2.73–3.73 | b8–b11 | giant AK, one run cycle per beat → power-slide, whip-pan |
| 04 | 3.73–5.36 | b11–b16 | breakdown triptych, silhouettes freeze on b12/b13/b14 |
| 05 | 5.36–6.14 | b16–b18 | slow-mo spin through the NO BRAKES ring, snap-zoom |
| 06 | 6.14–6.83 | b18–b20 | JUMP vault, palm plant on the J at b19 |
| 07 | 6.83–7.53 | b20–b22 | riser: ghost backflip, FLIP rotates |
| 08 | 7.53–8.92 | b22–b26 | **drop**: COOL / FAST / CLEAN / BLUE, one per beat |
| 09 | 8.92–9.96 | b26–b29 | grid wall-run, freeze and target lock at b28 |
| 10 | 9.96–11.00 | b29–b32 | panes shatter on b29/b30/b31, sneaker wipe |
| 11 | 11.00–12.39 | b32–b36 | posters 01–04, one per beat |
| 12 | 12.39–15.16 | b36–b44 | hero landing shockwave b39, freeze b41, whiteout b43 |
| 13 | 15.16–17.16 | b44–end | identity card, ice sweep b46, frost-ring stinger b48 |

## Files

```text
index.html             player: song clock, scrub bar, keys, ?t= frame mode
ReelAudio-30300.mp3    the song
src/beatmap.js         generated beats, drum hits and energy (window.BEATMAP)
src/core.js            math, easing, pulses, springs, beat helpers, cut table
src/fx.js              WebGL2 post FX: RGB split, flash, invert, whiteout, halftone,
                       speed lines, zoom/whip blur, bloom, shake, grain
src/ao.js              the character rig, poses, eye close-up, big sneaker
src/gfx.js             type, barcodes, UI ticks, brackets, halftone, rings,
                       shards, particles, emblem, 2D camera
src/cuts.js            the 13 scenes and renderAt(t)
tools/analyze_beats.py beat analysis for any song (needs ffmpeg + numpy)
tools/export.mjs       frame-exact MP4 export (headless Chrome + ffmpeg)
tools/poses.html       pose sheet for the character; open it to preview poses
```

The code's global namespace is `AO` (the character's original name). It's just a name, so you can leave it as is.

## Credits

Inspired by [ChetasLua/ao-bot-reveal-trailer](https://github.com/ChetasLua/ao-bot-reveal-trailer). Built with Claude Code.
