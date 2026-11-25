// Frame-exact MP4 export of the AO trailer (video + song).
// Drives index.html in headless Chrome, renders each frame with __setTrailerTime(t)
// (deterministic, so no dropped frames regardless of machine speed), pipes PNGs to ffmpeg.
//
// Usage:  node tools/export.mjs [fps=60] [out=AO-trailer.mp4]
// Needs:  npm install puppeteer-core   (uses your installed Google Chrome, no download)
//         ffmpeg on PATH
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fps = Number(process.argv[2] || 60);
const out = path.resolve(process.argv[3] || path.join(root, 'AO-trailer.mp4'));
const chrome = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const song = path.join(root, 'ReelAudio-30300.mp3');

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: true,
  args: ['--allow-file-access-from-files', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--window-size=1920,1080', '--hide-scrollbars'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto(pathToFileURL(path.join(root, 'index.html')).href + '?capture=1', { waitUntil: 'load' });
await page.waitForFunction(() => window.AO && window.__setTrailerTime);
const duration = await page.evaluate(() => window.AO.DURATION);
const frames = Math.round(duration * fps);
console.log(`Exporting ${frames} frames @ ${fps}fps (${duration.toFixed(2)}s) → ${out}`);

const ff = spawn('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
  '-i', song,
  '-map', '0:v', '-map', '1:a',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '256k',
  '-shortest', '-movflags', '+faststart',
  out,
], { stdio: ['pipe', 'inherit', 'inherit'] });

const t0 = Date.now();
for (let i = 0; i < frames; i++) {
  const b64 = await page.evaluate((t) => {
    window.__setTrailerTime(t);
    const c = document.getElementById('gl') || document.getElementById('c2d');
    return c.toDataURL('image/png').split(',')[1];
  }, i / fps);
  if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await once(ff.stdin, 'drain');
  if (i % fps === 0 || i === frames - 1) {
    const done = i + 1, el = (Date.now() - t0) / 1000;
    process.stdout.write(`\r  frame ${done}/${frames}  (${((done / frames) * 100).toFixed(0)}%, ~${Math.round((el / done) * (frames - done))}s left)   `);
  }
}
ff.stdin.end();
const [code] = await once(ff, 'close');
await browser.close();
console.log(code === 0 ? `\nDone: ${out}` : `\nffmpeg exited with code ${code}`);
process.exit(code);
