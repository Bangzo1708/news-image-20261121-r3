// news-image-20261121 ROUND 3 — "THE WORLD TODAY"
// One-day world news image for Saturday 21 November 2026.
// Drawn fully in code (Node 22 stdlib only, no network, no assets):
// a deterministic 1024x1024 PNG written to $MAKEFUN_OUTPUT_DIR/entry.png
// (or /output/entry.png). Every run writes byte-identical output.
//
// Stories (all first reported / happened on Sat 21 Nov 2026, summarised
// from public news reporting that day):
//  1. Russia's biggest strike of the year on Kyiv — 400+ drones, 110
//     missiles, at least 8 killed; a Russian missile lands in Poland,
//     PM Tusk calls it a provocation, no injuries.
//  2. ICJ rules Myanmar committed genocide against the Rohingya — the
//     first time the court has held a state responsible.
//  3. AI sell-off: Nasdaq -5.3%, S&P 500 and Dow into correction;
//     Nvidia down ~14% amid an SEC accounting probe; Anthropic slides.
//  4. First three-way Trump–Xi–Putin summit in Shenzhen; Trump calls
//     Putin a friend, Zelenskyy calls Putin a killer.
//  5. UK–EU landmark post-Brexit deal: food/drink trade, emissions,
//     youth mobility for 100,000 young people.
//  6. Magnitude 6.8 earthquake shakes central Peru (Junin), felt in
//     Lima 320 km away.
//  7. Pancreatic-cancer pill daraxonrasib: tumours undetectable on
//     scans in 1 of 12 trial patients.
//
// Three layout variants are implemented below (A broadsheet, B globe,
// C hero + tiles). SELECTED picks the one rendered. C was chosen:
// the hero gives the day's biggest story a picture a viewer grasps
// in one second, while six wide tiles keep every headline large
// enough to read at 300 px across — A crowds its columns with small
// type and B shrinks the stories around the globe.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const W = 1024;
const H = 1024;
const SELECTED: string = "C";

// ---------------------------------------------------------------- font --
// 5x7 block font, uppercase ASCII only. Each glyph is 7 rows of 5 bits.
// Kept deliberately coarse: at scale 6-7 it reads as a bold poster face.
const FONT: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["01110", "00100", "00100", "00100", "00100", "00100", "01110"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00110", "01000", "10000", "11111"],
  "3": ["11111", "00010", "00100", "00010", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "00100", "01000"],
  "-": ["00000", "00000", "00000", "01110", "00000", "00000", "00000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  "%": ["10001", "10010", "00010", "00100", "01000", "01001", "10001"],
  "+": ["00000", "00100", "00100", "11111", "00100", "00100", "00000"],
  "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
  "'": ["00100", "00100", "01000", "00000", "00000", "00000", "00000"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00110", "00100", "00000", "00100"],
  "(": ["00010", "00100", "01000", "01000", "01000", "00100", "00010"],
  ")": ["01000", "00100", "00010", "00010", "00010", "00100", "01000"],
  "=": ["00000", "00000", "11111", "00000", "11111", "00000", "00000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
};

type RGB = [number, number, number];

// Palette — newsprint paper, ink black, signal red, deep navy.
const PAPER: RGB = [247, 242, 231];
const INK: RGB = [17, 17, 17];
const RED: RGB = [198, 32, 28];
const NAVY: RGB = [11, 30, 58];
const NAVY2: RGB = [39, 75, 122];
const WHITE: RGB = [255, 255, 255];
const GREY: RGB = [90, 86, 76];
const LINE: RGB = [216, 208, 190];
const GOLD: RGB = [232, 164, 32];
const TEAL: RGB = [15, 118, 110];
const GREEN: RGB = [46, 125, 50];

// ------------------------------------------------------------ canvas ---
const px = new Uint8Array(W * H * 3);

function setPixel(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}

function fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(W, Math.ceil(x + w));
  const y1 = Math.min(H, Math.ceil(y + h));
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) setPixel(xx, yy, c);
  }
}

function fillCircle(cx: number, cy: number, r: number, c: RGB): void {
  // Round first: a fractional index into the Uint8Array is silently
  // dropped, which used to erase every circle drawn at float coords.
  cx = Math.round(cx);
  cy = Math.round(cy);
  const rr = Math.floor(r);
  for (let dy = -rr; dy <= rr; dy++) {
    const dx = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)));
    for (let xx = cx - dx; xx <= cx + dx; xx++) setPixel(xx, cy + dy, c);
  }
}

function ring(cx: number, cy: number, r: number, t: number, c: RGB): void {
  cx = Math.round(cx);
  cy = Math.round(cy);
  const rr = Math.floor(r);
  for (let dy = -rr; dy <= rr; dy++) {
    const dx = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)));
    for (let xx = cx - dx; xx <= cx + dx; xx++) {
      const d = Math.sqrt((xx - cx) * (xx - cx) + dy * dy);
      if (d >= r - t) setPixel(xx, cy + dy, c);
    }
  }
}

// Thick line via stepped filled circles — deterministic, no AA smear.
function thickLine(x0: number, y0: number, x1: number, y1: number, t: number, c: RGB): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let s = 0; s <= steps; s++) {
    const x = Math.round(x0 + ((x1 - x0) * s) / steps);
    const y = Math.round(y0 + ((y1 - y0) * s) / steps);
    fillCircle(x, y, Math.max(1, Math.floor(t / 2)), c);
  }
}

function fillTriangle(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, c: RGB): void {
  const minY = Math.max(0, Math.min(y0, y1, y2));
  const maxY = Math.min(H - 1, Math.max(y0, y1, y2));
  for (let y = minY; y <= maxY; y++) {
    const xs: number[] = [];
    const edges: Array<[number, number, number, number]> = [
      [x0, y0, x1, y1],
      [x1, y1, x2, y2],
      [x2, y2, x0, y0],
    ];
    for (const [ax, ay, bx, by] of edges) {
      if ((ay <= y && by > y) || (by <= y && ay > y)) {
        xs.push(ax + ((y - ay) * (bx - ax)) / (by - ay));
      }
    }
    if (xs.length >= 2) {
      const a = Math.max(0, Math.floor(Math.min(...xs)));
      const b = Math.min(W - 1, Math.ceil(Math.max(...xs)));
      for (let x = a; x <= b; x++) setPixel(x, y, c);
    }
  }
}

function vGradient(y0: number, y1: number, top: RGB, bot: RGB): void {
  for (let y = y0; y < y1; y++) {
    const f = (y - y0) / Math.max(1, y1 - y0 - 1);
    const c: RGB = [
      Math.round(top[0] + (bot[0] - top[0]) * f),
      Math.round(top[1] + (bot[1] - top[1]) * f),
      Math.round(top[2] + (bot[2] - top[2]) * f),
    ];
    fillRect(0, y, W, 1, c);
  }
}

// Deterministic PRNG (mulberry32) — same picture every run.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// -------------------------------------------------------------- text ---
function textWidth(s: string, scale: number): number {
  if (s.length === 0) return 0;
  return s.length * 6 * scale - scale;
}

function drawText(s: string, x: number, y: number, scale: number, c: RGB): void {
  let cx = Math.round(x);
  const cy = Math.round(y);
  for (const ch of s.toUpperCase()) {
    const g = FONT[ch] || FONT["?"];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === "1") fillRect(cx + col * scale, cy + r * scale, scale, scale, c);
      }
    }
    cx += 6 * scale;
  }
}

function drawTextCentered(s: string, cx: number, y: number, scale: number, c: RGB): void {
  drawText(s, cx - textWidth(s, scale) / 2, y, scale, c);
}

// Greedy word wrap that never overflows maxW; returns lines.
function wrapText(s: string, maxW: number, scale: number): string[] {
  const words = s.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur === "" ? w : cur + " " + w;
    if (textWidth(trial, scale) <= maxW || cur === "") cur = trial;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

function drawLines(lines: string[], x: number, y: number, scale: number, c: RGB, lh: number): void {
  lines.forEach((ln, i) => drawText(ln, x, y + i * lh, scale, c));
}

// ------------------------------------------------------------ PNG out ---
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

function encodePNG(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    Buffer.from(px.buffer, y * W * 3, W * 3).copy(raw, y * (1 + W * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

// ------------------------------------------------------------- icons ---
// Flat white pictograms drawn inside a coloured icon box (x, y, size s).

function iconScales(x: number, y: number, s: number, c: RGB): void {
  const cx = x + s / 2;
  thickLine(cx, y + s * 0.12, cx, y + s * 0.82, Math.max(3, s * 0.06), c);
  thickLine(x + s * 0.14, y + s * 0.3, x + s * 0.86, y + s * 0.3, Math.max(3, s * 0.06), c);
  fillCircle(cx, y + s * 0.12, s * 0.06, c);
  for (const side of [-1, 1]) {
    const px0 = cx + side * s * 0.36;
    thickLine(px0, y + s * 0.3, px0, y + s * 0.42, Math.max(2, s * 0.04), c);
    fillTriangle(px0 - s * 0.17, y + s * 0.42, px0 + s * 0.17, y + s * 0.42, px0, y + s * 0.72, c);
  }
  fillRect(x + s * 0.3, y + s * 0.82, s * 0.4, s * 0.06, c);
}

function iconChartDown(x: number, y: number, s: number, c: RGB): void {
  thickLine(x + s * 0.14, y + s * 0.2, x + s * 0.14, y + s * 0.86, Math.max(3, s * 0.05), c);
  thickLine(x + s * 0.14, y + s * 0.86, x + s * 0.86, y + s * 0.86, Math.max(3, s * 0.05), c);
  const pts: Array<[number, number]> = [
    [0.2, 0.3],
    [0.38, 0.45],
    [0.52, 0.38],
    [0.8, 0.72],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    thickLine(x + pts[i][0] * s, y + pts[i][1] * s, x + pts[i + 1][0] * s, y + pts[i + 1][1] * s, Math.max(4, s * 0.07), c);
  }
  fillTriangle(x + s * 0.8, y + s * 0.72, x + s * 0.66, y + s * 0.62, x + s * 0.86, y + s * 0.6, c);
}

function iconSummit(x: number, y: number, s: number, c: RGB): void {
  // Three leaders at one table: three heads + three flags behind.
  const flagCols: RGB[] = [
    [178, 34, 52],
    [222, 41, 16],
    [0, 57, 166],
  ];
  for (let i = 0; i < 3; i++) {
    const fx = x + s * (0.12 + i * 0.3);
    thickLine(fx, y + s * 0.1, fx, y + s * 0.42, Math.max(2, s * 0.04), c);
    fillRect(fx, y + s * 0.1, s * 0.22, s * 0.14, flagCols[i]);
    fillCircle(fx + s * 0.11, y + s * 0.56, s * 0.08, c);
    fillRect(fx - s * 0.02, y + s * 0.72, s * 0.26, s * 0.16, c);
  }
}

function iconHandshake(x: number, y: number, s: number, c: RGB): void {
  // Two overlapping circles (UK + EU) ringed by stars.
  ring(x + s * 0.36, y + s * 0.5, s * 0.26, Math.max(3, s * 0.05), c);
  ring(x + s * 0.64, y + s * 0.5, s * 0.26, Math.max(3, s * 0.05), c);
  const rng = mulberry32(77);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    fillCircle(x + s / 2 + Math.cos(a) * s * 0.42, y + s / 2 + Math.sin(a) * s * 0.42, Math.max(2, s * 0.035), c);
  }
  void rng;
}

function iconQuake(x: number, y: number, s: number, c: RGB): void {
  thickLine(x + s * 0.1, y + s * 0.3, x + s * 0.3, y + s * 0.3, Math.max(3, s * 0.05), c);
  thickLine(x + s * 0.3, y + s * 0.3, x + s * 0.42, y + s * 0.55, Math.max(3, s * 0.05), c);
  thickLine(x + s * 0.42, y + s * 0.55, x + s * 0.58, y + s * 0.28, Math.max(3, s * 0.05), c);
  thickLine(x + s * 0.58, y + s * 0.28, x + s * 0.72, y + s * 0.5, Math.max(3, s * 0.05), c);
  thickLine(x + s * 0.72, y + s * 0.5, x + s * 0.9, y + s * 0.5, Math.max(3, s * 0.05), c);
  // Cracked ground below.
  thickLine(x + s * 0.08, y + s * 0.78, x + s * 0.32, y + s * 0.68, Math.max(3, s * 0.05), c);
  thickLine(x + s * 0.32, y + s * 0.68, x + s * 0.5, y + s * 0.82, Math.max(3, s * 0.05), c);
  thickLine(x + s * 0.5, y + s * 0.82, x + s * 0.68, y + s * 0.7, Math.max(3, s * 0.05), c);
  thickLine(x + s * 0.68, y + s * 0.7, x + s * 0.92, y + s * 0.8, Math.max(3, s * 0.05), c);
}

function iconPill(x: number, y: number, s: number, c: RGB): void {
  // Capsule tilted: two half-capsules + cross of hope.
  const cx = x + s / 2;
  const cy = y + s * 0.42;
  thickLine(cx - s * 0.28, cy - s * 0.16, cx + s * 0.28, cy + s * 0.16, Math.max(8, s * 0.22), c);
  fillCircle(cx - s * 0.28, cy - s * 0.16, Math.max(4, s * 0.11), c);
  fillCircle(cx + s * 0.28, cy + s * 0.16, Math.max(4, s * 0.11), c);
  fillRect(cx - s * 0.03, y + s * 0.68, s * 0.06, s * 0.2, c);
  fillRect(cx - s * 0.13, y + s * 0.75, s * 0.26, s * 0.06, c);
}

function iconGlobe(x: number, y: number, s: number, c: RGB): void {
  ring(x + s / 2, y + s / 2, s * 0.42, Math.max(3, s * 0.05), c);
  fillCircle(x + s * 0.38, y + s * 0.36, s * 0.1, c);
  fillCircle(x + s * 0.6, y + s * 0.3, s * 0.08, c);
  fillCircle(x + s * 0.58, y + s * 0.62, s * 0.12, c);
  fillCircle(x + s * 0.34, y + s * 0.62, s * 0.07, c);
}

// ------------------------------------------------------------ shared ---
function masthead(): void {
  fillRect(0, 0, W, 118, INK);
  drawTextCentered("THE WORLD TODAY", W / 2, 16, 7, WHITE);
  drawTextCentered("SATURDAY 21 NOVEMBER 2026", W / 2, 76, 3, GOLD);
  fillRect(0, 118, W, 8, RED);
}

function footer(): void {
  fillRect(0, 978, W, 46, INK);
  drawTextCentered("ALL REPORTED ON SATURDAY 21 NOVEMBER 2026", W / 2, 993, 2, WHITE);
}

// One story tile: coloured icon box left, kicker + headline + sub right.
type IconFn = (x: number, y: number, s: number, c: RGB) => void;
function storyTile(
  x: number,
  y: number,
  w: number,
  h: number,
  box: RGB,
  icon: IconFn,
  kicker: string,
  headline: string,
  sub: string,
): void {
  fillRect(x, y, w, h, WHITE);
  fillRect(x, y, w, h, WHITE);
  // Thin frame + coloured spine.
  for (let t = 0; t < 2; t++) {
    fillRect(x + t, y + t, w - 2 * t, 1, LINE);
    fillRect(x + t, y + h - 1 - t, w - 2 * t, 1, LINE);
    fillRect(x + t, y, 1, h, LINE);
    fillRect(x + w - 1 - t, y, 1, h, LINE);
  }
  fillRect(x, y, 10, h, box);
  fillRect(x + 10, y, 118, h, box);
  icon(x + 10 + 14, y + (h - 96) / 2, 90, WHITE);
  const tx = x + 146;
  const tw = w - 146 - 16;
  drawText(kicker, tx, y + 14, 2, RED);
  const lines = wrapText(headline, tw, 3);
  drawLines(lines, tx, y + 40, 3, INK, 28);
  const subLines = wrapText(sub, tw, 2);
  drawLines(subLines, tx, y + 40 + lines.length * 28 + 6, 2, GREY, 18);
}

// Skyline + explosions for the hero picture.
function heroScene(x0: number, y0: number, w: number, h: number): void {
  vGradient(y0, y0 + h, NAVY, NAVY2);
  const rng = mulberry32(20261121);
  // Missile trails streaking down-left, high in the sky.
  thickLine(x0 + w * 0.86, y0 + h * 0.08, x0 + w * 0.7, y0 + h * 0.34, 5, WHITE);
  thickLine(x0 + w * 0.72, y0 + h * 0.04, x0 + w * 0.58, y0 + h * 0.3, 4, [255, 220, 140]);
  fillCircle(x0 + w * 0.7, y0 + h * 0.34, 7, WHITE);
  fillCircle(x0 + w * 0.58, y0 + h * 0.3, 6, [255, 220, 140]);
  // Skyline silhouettes along the bottom, kept low (max 100 tall) so
  // the caption lines at y0+~200 stay clear of lit windows.
  let bx = x0;
  while (bx < x0 + w) {
    const bw = 46 + rng() * 66;
    const bh = 36 + rng() * 64;
    fillRect(bx, y0 + h - bh, bw, bh, [6, 14, 30]);
    for (let wy = y0 + h - bh + 12; wy < y0 + h - 10; wy += 18) {
      for (let wx = bx + 8; wx < bx + bw - 8; wx += 16) {
        if (rng() < 0.4) fillRect(wx, wy, 5, 7, [255, 214, 110]);
      }
    }
    bx += bw + 6;
  }
  // Explosions and smoke AFTER the skyline, kept right of x=740 so
  // they never sit behind the headline (which ends near x=708) or
  // the caption lines below it.
  fillCircle(x0 + w * 0.86, y0 + h * 0.3, 58, [232, 120, 32]);
  fillCircle(x0 + w * 0.86, y0 + h * 0.3, 38, GOLD);
  fillCircle(x0 + w * 0.86, y0 + h * 0.3, 18, [255, 236, 170]);
  fillCircle(x0 + w * 0.76, y0 + h * 0.42, 34, [214, 90, 24]);
  fillCircle(x0 + w * 0.76, y0 + h * 0.42, 20, GOLD);
  for (let i = 0; i < 26; i++) {
    const a = rng() * Math.PI * 2;
    const d = 24 + rng() * 44;
    fillCircle(x0 + w * 0.86 + Math.cos(a) * d, y0 + h * 0.3 + Math.sin(a) * d * 0.6, 2 + rng() * 3, GOLD);
  }
  fillCircle(x0 + w * 0.88, y0 + h * 0.16, 20, [70, 78, 92]);
  fillCircle(x0 + w * 0.84, y0 + h * 0.1, 14, [88, 96, 110]);
}

// ------------------------------------------------------ variant C ------
// HERO + TILES — chosen. One dominant picture, six wide readable tiles.
function variantC(): void {
  fillRect(0, 0, W, H, PAPER);
  masthead();
  heroScene(0, 126, W, 344);
  fillRect(24, 150, 292, 40, RED);
  drawText("WAR IN EUROPE", 40, 158, 3, WHITE);
  drawText("MISSILES OVER KYIV", 24, 216, 6, WHITE);
  drawText("ONE LANDS IN POLAND", 24, 262, 6, WHITE);
  drawText("400+ DRONES AND 110 MISSILES. 8 KILLED IN KYIV.", 24, 330, 3, [255, 236, 170]);
  drawText("POLAND CALLS IT A PROVOCATION. NO INJURIES.", 24, 360, 3, WHITE);
  fillRect(0, 470, W, 8, RED);
  const tiles: Array<[RGB, IconFn, string, string, string]> = [
    [TEAL, iconScales, "JUSTICE - THE HAGUE", "MYANMAR GUILTY OF GENOCIDE", "ICJ: FIRST STATE VERDICT FOR ROHINGYA"],
    [RED, iconChartDown, "MARKETS", "AI SELL-OFF HITS WALL STREET", "NASDAQ -5.3%. S AND P IN CORRECTION"],
    [NAVY2, iconSummit, "DIPLOMACY - SHENZHEN", "TRUMP, XI, PUTIN MEET AT LAST", "FIRST THREE-WAY SUMMIT"],
    [GREEN, iconHandshake, "EUROPE - LONDON", "UK-EU LANDMARK POST-BREXIT DEAL", "TRADE, YOUTH MOBILITY FOR 100,000"],
    [GOLD, iconQuake, "DISASTER - PERU", "6.8 QUAKE SHAKES CENTRAL PERU", "TREMORS FELT 320 KM AWAY IN LIMA"],
    [TEAL, iconPill, "HEALTH", "CANCER PILL HOPE IN TRIAL", "1 IN 12 SAW TUMOURS VANISH"],
  ];
  const tw = 496;
  const th = 158;
  tiles.forEach((t, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    storyTile(16 + col * (tw + 16), 494 + row * (th + 12), tw, th, t[0], t[1], t[2], t[3], t[4]);
  });
  footer();
}

// ------------------------------------------------------ variant A ------
// BROADSHEET — classic front page: thin hero strip, three text columns.
function variantA(): void {
  fillRect(0, 0, W, H, PAPER);
  masthead();
  heroScene(0, 126, W, 200);
  drawText("MISSILES OVER KYIV", 24, 170, 5, WHITE);
  drawText("ONE LANDS IN POLAND", 24, 210, 5, WHITE);
  drawText("400+ DRONES, 110 MISSILES, 8 KILLED", 24, 258, 3, [255, 236, 170]);
  fillRect(0, 326, W, 8, RED);
  const cols: Array<Array<[RGB, IconFn, string, string, string]>> = [
    [
      [TEAL, iconScales, "JUSTICE", "MYANMAR GUILTY OF GENOCIDE", "ICJ: FIRST STATE VERDICT FOR ROHINGYA"],
      [GOLD, iconQuake, "DISASTER", "6.8 QUAKE SHAKES PERU", "FELT 320 KM AWAY IN LIMA"],
    ],
    [
      [RED, iconChartDown, "MARKETS", "AI SELL-OFF HITS WALL ST", "NASDAQ -5.3%. S AND P IN CORRECTION"],
      [TEAL, iconPill, "HEALTH", "CANCER PILL HOPE", "TUMOURS UNDETECTABLE IN 1 OF 12"],
    ],
    [
      [NAVY2, iconSummit, "DIPLOMACY", "TRUMP, XI, PUTIN MEET", "FIRST THREE-WAY SUMMIT IN SHENZHEN"],
      [GREEN, iconHandshake, "EUROPE", "UK-EU LANDMARK DEAL", "TRADE AND YOUTH MOBILITY FOR 100,000"],
    ],
  ];
  cols.forEach((stories, ci) => {
    const cx = 16 + ci * 336;
    stories.forEach((s, ri) => {
      const y = 350 + ri * 306;
      fillRect(cx, y, 320, 290, WHITE);
      fillRect(cx, y, 320, 96, s[0]);
      s[1](cx + 112, y + 8, 80, WHITE);
      drawText(s[2], cx + 16, y + 116, 2, RED);
      drawLines(wrapText(s[3], 288, 3), cx + 16, y + 142, 3, INK, 28);
      drawLines(wrapText(s[4], 288, 2), cx + 16, y + 226, 2, GREY, 18);
    });
    if (ci < 2) fillRect(cx + 328, 350, 2, 612, LINE);
  });
  footer();
}

// ------------------------------------------------------ variant B ------
// GLOBE — a big world globe in the middle, six story cards around it.
function variantB(): void {
  fillRect(0, 0, W, H, PAPER);
  masthead();
  // Globe centre.
  const gx = W / 2;
  const gy = 470;
  fillCircle(gx, gy, 218, NAVY2);
  ring(gx, gy, 218, 6, NAVY);
  fillCircle(gx - 52, gy - 58, 58, GREEN);
  fillCircle(gx + 66, gy - 30, 44, GREEN);
  fillCircle(gx + 40, gy + 78, 62, GREEN);
  fillCircle(gx - 84, gy + 66, 34, GREEN);
  ring(gx, gy, 150, 3, [140, 180, 220]);
  drawTextCentered("21 NOV 2026", gx, gy - 12, 3, WHITE);
  drawTextCentered("ONE WORLD", gx, gy + 22, 3, GOLD);
  // Story cards left and right of the globe.
  const left: Array<[RGB, IconFn, string, string, string]> = [
    [RED, iconChartDown, "MARKETS", "AI SELL-OFF HITS WALL STREET", "NASDAQ -5.3%"],
    [TEAL, iconScales, "JUSTICE", "MYANMAR GUILTY OF GENOCIDE", "ICJ FIRST VERDICT"],
    [GOLD, iconQuake, "PERU", "6.8 QUAKE SHAKES PERU", "FELT IN LIMA"],
  ];
  const right: Array<[RGB, IconFn, string, string, string]> = [
    [NAVY2, iconSummit, "SHENZHEN", "TRUMP, XI, PUTIN MEET", "FIRST 3-WAY SUMMIT"],
    [GREEN, iconHandshake, "UK-EU", "LANDMARK POST-BREXIT DEAL", "FOR 100,000 YOUTH"],
    [TEAL, iconPill, "HEALTH", "CANCER PILL HOPE", "1 IN 12 CLEAR"],
  ];
  const drawSide = (list: typeof left, x: number) => {
    list.forEach((s, i) => {
      const y = 170 + i * 200;
      fillRect(x, y, 268, 176, WHITE);
      fillRect(x, y, 268, 10, s[0]);
      s[1](x + 16, y + 26, 56, s[0]);
      drawText(s[2], x + 16, y + 96, 2, RED);
      drawLines(wrapText(s[3], 236, 3), x + 16, y + 118, 3, INK, 26);
    });
  };
  drawSide(left, 16);
  drawSide(right, W - 284);
  // War banner across the bottom — the day's biggest story.
  fillRect(16, 786, W - 32, 176, NAVY);
  fillRect(16, 786, W - 32, 8, RED);
  drawText("WAR IN EUROPE", 40, 812, 3, GOLD);
  drawText("MISSILES OVER KYIV", 40, 848, 5, WHITE);
  drawText("ONE LANDS IN POLAND", 40, 888, 5, WHITE);
  drawText("400+ DRONES, 110 MISSILES, 8 KILLED", 40, 930, 2, [255, 236, 170]);
  footer();
}

// ------------------------------------------------------------ render ---
function render(): void {
  px.fill(0);
  if (SELECTED === "A") variantA();
  else if (SELECTED === "B") variantB();
  else variantC();
}

function main(): void {
  render();
  const outDir = process.env.MAKEFUN_OUTPUT_DIR || "/output";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "entry.png"), encodePNG());
}

main();
