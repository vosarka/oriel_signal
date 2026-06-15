// Offline prep (dev only): turn the approved base-bust PNG into a baked
// point-mesh for the 2D ResonanceBody canvas. Samples points weighted toward
// edges/features inside the silhouette, Delaunay-triangulates them, culls
// edges that fall off the body, and writes a normalized data file. The runtime
// ships only the baked data — no image, no triangulation lib.
//
//   node scripts/bake-resonance-body.mjs
//
// in:  client/public/assets/resonance-body-base.png
// out: client/src/lib/resonance-body-mesh.ts

import { readFileSync, writeFileSync } from "node:fs";
import { PNG } from "pngjs";
import Delaunator from "delaunator";

const IN = "client/public/assets/resonance-body-base.png";
const OUT = "client/src/lib/resonance-body-mesh.ts";

// ── tunables ──────────────────────────────────────────────────────────────
const TARGET_POINTS = 1500; // interior/feature points
const MASK_THRESHOLD = 50; // luminance above this = subject (bg is noisy-black)
const EDGE_BOOST = 2.6; // how strongly points prefer edges
const BASE_WEIGHT = 0.32; // baseline fill inside the silhouette
const OUTLINE_STEP = 9; // px between silhouette-outline points
const MAX_TRIES = 700_000;
// ──────────────────────────────────────────────────────────────────────────

const png = PNG.sync.read(readFileSync(IN));
const { width: W, height: H, data } = png;
const lum = new Float32Array(W * H);
const mask = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) {
  const r = data[i * 4],
    g = data[i * 4 + 1],
    b = data[i * 4 + 2];
  const l = 0.299 * r + 0.587 * g + 0.114 * b;
  lum[i] = l;
  mask[i] = l > MASK_THRESHOLD ? 1 : 0;
}
// Keep only the largest connected silhouette blob → drops background specks
// from the noisy near-black background and tightens the bounding box.
{
  const labels = new Int32Array(W * H).fill(-1);
  const stack = [];
  let best = -1;
  let bestSize = 0;
  for (let s = 0; s < W * H; s++) {
    if (!mask[s] || labels[s] !== -1) continue;
    let size = 0;
    labels[s] = s;
    stack.length = 0;
    stack.push(s);
    while (stack.length) {
      const c = stack.pop();
      size++;
      const cx = c % W;
      const cy = (c / W) | 0;
      if (cx > 0 && mask[c - 1] && labels[c - 1] === -1) {
        labels[c - 1] = s;
        stack.push(c - 1);
      }
      if (cx < W - 1 && mask[c + 1] && labels[c + 1] === -1) {
        labels[c + 1] = s;
        stack.push(c + 1);
      }
      if (cy > 0 && mask[c - W] && labels[c - W] === -1) {
        labels[c - W] = s;
        stack.push(c - W);
      }
      if (cy < H - 1 && mask[c + W] && labels[c + W] === -1) {
        labels[c + W] = s;
        stack.push(c + W);
      }
    }
    if (size > bestSize) {
      bestSize = size;
      best = s;
    }
  }
  for (let i = 0; i < W * H; i++) {
    if (mask[i] && labels[i] !== best) mask[i] = 0;
  }
}

const at = (x, y) => lum[y * W + x];
const inside = (x, y) =>
  x >= 0 && y >= 0 && x < W && y < H && mask[y * W + x] === 1;

// Sobel edge magnitude (normalized 0..1)
const edge = new Float32Array(W * H);
let edgeMax = 1e-6;
for (let y = 1; y < H - 1; y++) {
  for (let x = 1; x < W - 1; x++) {
    const gx =
      -at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1) +
      at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1);
    const gy =
      -at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1) +
      at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1);
    const mag = Math.hypot(gx, gy);
    edge[y * W + x] = mag;
    if (mag > edgeMax) edgeMax = mag;
  }
}
for (let i = 0; i < edge.length; i++) edge[i] /= edgeMax;

// Poisson-ish rejection sampling: weight = base + edgeBoost*edge, inside mask,
// with a min-distance grid so points spread evenly.
const minDist = Math.max(4, Math.round(W / 115));
const cell = minDist;
const gw = Math.ceil(W / cell);
const gh = Math.ceil(H / cell);
const grid = new Int32Array(gw * gh).fill(-1);
const pts = [];
const farEnough = (x, y) => {
  const cx = (x / cell) | 0;
  const cy = (y / cell) | 0;
  for (let yy = Math.max(0, cy - 1); yy <= Math.min(gh - 1, cy + 1); yy++)
    for (let xx = Math.max(0, cx - 1); xx <= Math.min(gw - 1, cx + 1); xx++) {
      const idx = grid[yy * gw + xx];
      if (idx >= 0) {
        const dx = pts[idx][0] - x;
        const dy = pts[idx][1] - y;
        if (dx * dx + dy * dy < minDist * minDist) return false;
      }
    }
  return true;
};
const addPoint = (x, y) => {
  grid[((y / cell) | 0) * gw + ((x / cell) | 0)] = pts.length;
  pts.push([x, y]);
};

let tries = 0;
while (pts.length < TARGET_POINTS && tries < MAX_TRIES) {
  tries++;
  const x = (Math.random() * W) | 0;
  const y = (Math.random() * H) | 0;
  if (!inside(x, y)) continue;
  const w = BASE_WEIGHT + EDGE_BOOST * edge[y * W + x];
  if (Math.random() > Math.min(1, w)) continue;
  if (!farEnough(x, y)) continue;
  addPoint(x, y);
}

// Silhouette outline points → crisp body edge (like the reference).
let lastOutline = -OUTLINE_STEP;
for (let y = 0; y < H; y++) {
  for (let x = 1; x < W; x++) {
    const a = mask[y * W + x - 1];
    const b = mask[y * W + x];
    if (a !== b) {
      // boundary pixel; thin it out and respect spacing
      const px = b ? x : x - 1;
      if (farEnough(px, y) && y - lastOutline >= 0) addPoint(px, y);
    }
  }
  if (y - lastOutline >= OUTLINE_STEP) lastOutline = y;
}

// Delaunay triangulation
const coords = new Float64Array(pts.length * 2);
for (let i = 0; i < pts.length; i++) {
  coords[i * 2] = pts[i][0];
  coords[i * 2 + 1] = pts[i][1];
}
const del = Delaunator.from(
  pts,
  p => p[0],
  p => p[1]
);
const tri = del.triangles;

// Build unique edges; cull edges too long or whose span leaves the body.
const maxEdge = W * 0.135;
const onBody = (ax, ay, bx, by) => {
  for (const t of [0.25, 0.5, 0.75]) {
    const mx = (ax + (bx - ax) * t) | 0;
    const my = (ay + (by - ay) * t) | 0;
    if (!inside(mx, my)) return false;
  }
  return true;
};
const edgeSet = new Set();
const edges = [];
const pushEdge = (a, b) => {
  const k = a < b ? a * pts.length + b : b * pts.length + a;
  if (edgeSet.has(k)) return;
  const [ax, ay] = pts[a];
  const [bx, by] = pts[b];
  if (Math.hypot(bx - ax, by - ay) > maxEdge) return;
  if (!onBody(ax, ay, bx, by)) return;
  edgeSet.add(k);
  edges.push([a, b]);
};
for (let i = 0; i < tri.length; i += 3) {
  pushEdge(tri[i], tri[i + 1]);
  pushEdge(tri[i + 1], tri[i + 2]);
  pushEdge(tri[i + 2], tri[i]);
}

// Normalize + emit
const r4 = n => Math.round(n * 1e4) / 1e4;
const points = pts.map(([x, y]) => [r4(x / W), r4(y / H)]);
const sides = points.map(p => (p[0] < 0.5 ? 0 : 1));
const bright = pts.map(([x, y]) => r4(Math.min(1, at(x | 0, y | 0) / 220)));

const out =
  `// AUTO-GENERATED by scripts/bake-resonance-body.mjs — do not edit by hand.\n` +
  `// Baked point-mesh of the approved base bust. Coords normalized 0..1.\n` +
  `// points: [x,y][]  sides: 0=left/cyan 1=right/gold  bright: 0..1  edges: [i,j][]\n` +
  `export const RESONANCE_BODY_MESH = {\n` +
  `  aspect: ${r4(W / H)},\n` +
  `  points: ${JSON.stringify(points)},\n` +
  `  sides: ${JSON.stringify(sides)},\n` +
  `  bright: ${JSON.stringify(bright)},\n` +
  `  edges: ${JSON.stringify(edges)},\n` +
  `} as const;\n`;

writeFileSync(OUT, out);
console.log(
  `baked ${points.length} points, ${edges.length} edges → ${OUT}  (image ${W}x${H}, tries ${tries})`
);
