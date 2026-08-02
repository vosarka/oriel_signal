// ════════════════════════════════════════════════════════════════════════════
// Cosmichronica morph forms — the dimensional-reveal ladder
// ════════════════════════════════════════════════════════════════════════════
// The descent opens as the SPIRAL (a helix). Seen from directly above it is a
// ring that collapses inward to a single POINT (Phase I). That point is really a
// LINE seen end-on — the camera swings to the side and the point stretches into a
// line (Phase II). That line is really a TRIANGLE seen edge-on — the camera
// orbits and the line unfolds into a triangle (Phase III). From there the cloud
// morphs on through the remaining canonical forms.
//
// The reveal is CAMERA work, so geometry orientation is load-bearing:
//   • the line lives along the Y axis (x≈0, z≈0) → a point when viewed top-down.
//   • the triangle lives in the Y-Z plane (x≈0)  → a line when viewed from +Z,
//     a full triangle when viewed from +X.
//
//   0 Void        → LINE  (shown as a POINT, viewed top-down)
//   1 Recursion   → LINE  (same geometry, revealed from the side)
//   2 Entropy     → TRIANGLE (Y-Z plane, revealed by orbiting to +X)
//   3 Harmonics   → MANDALA (X-Y plane, four saturated rings)
//   4 Bridge      → BRIDGE  (X-Y plane, catenary)
//   5 Noosphere   → VORTEX  (rising funnel)
//   6 Translation → SCATTER (spherical dispersal)
//   7 Omega       → DOUBLE POINT (two registers closing as one)
// ════════════════════════════════════════════════════════════════════════════

export const FORM_PARTICLE_COUNT = 4000;
export const PHASE_COUNT = 8;

const BOUND = 2.2; // shared half-extent every form respects

function particleNoise(index: number, salt: number): number {
  const value = Math.sin((index + 1) * (12.9898 + salt * 78.233)) * 43758.5453;
  return value - Math.floor(value);
}

/** Stable per-particle scale and alpha. Most motes stay fine and quiet; a small
 *  minority become the larger, variably luminous anchors visible in the form. */
export function buildParticleAppearance(count: number): {
  sizes: Float32Array;
  colors: Float32Array;
} {
  const sizes = new Float32Array(count);
  const colors = new Float32Array(count * 4);

  for (let i = 0; i < count; i++) {
    const tier = particleNoise(i, 0);
    const size = particleNoise(i, 1);
    const alpha = particleNoise(i, 2);

    sizes[i] =
      tier > 0.965
        ? 0.09 + size * 0.07
        : tier > 0.78
          ? 0.04 + size * 0.045
          : 0.014 + size * 0.028;

    const offset = i * 4;
    colors[offset] = 1;
    colors[offset + 1] = 1;
    colors[offset + 2] = 1;
    colors[offset + 3] =
      tier > 0.965 ? 0.34 + alpha * 0.62 : 0.14 + alpha * 0.62;
  }

  return { sizes, colors };
}

/** Extra camera movement used only while one settled phase becomes the next. */
export function phaseCameraArc(
  fromPhase: number,
  fraction: number
): { azimuth: number; elevation: number; radius: number } {
  const f = Math.max(0, Math.min(1, fraction));
  const transition = Math.sin(f * Math.PI);
  const direction = fromPhase % 2 === 0 ? 1 : -1;

  return {
    azimuth: direction * transition * (0.48 + fromPhase * 0.025),
    elevation: transition * (fromPhase % 3 === 0 ? 0.14 : 0.09),
    radius: transition * 0.5,
  };
}

// ── The genesis helix — the "spiral" that collapses into the first point ──────
export function buildGenesisHelix(count: number = FORM_PARTICLE_COUNT): Float32Array {
  const arr = new Float32Array(count * 3);
  const turns = 3;
  const height = 2 * BOUND;
  const radius = 1.2;
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const y = (t - 0.5) * height;
    const angle = t * turns * Math.PI * 2;
    const slot = i % 10;
    let x: number, z: number;
    if (slot < 4) {
      x = Math.cos(angle) * radius;
      z = Math.sin(angle) * radius;
    } else if (slot < 8) {
      x = Math.cos(angle + Math.PI) * radius;
      z = Math.sin(angle + Math.PI) * radius;
    } else {
      const f = Math.random();
      const ax = Math.cos(angle) * radius;
      const az = Math.sin(angle) * radius;
      const bx = Math.cos(angle + Math.PI) * radius;
      const bz = Math.sin(angle + Math.PI) * radius;
      x = ax + (bx - ax) * f;
      z = az + (bz - az) * f;
    }
    arr[i * 3] = x + (Math.random() - 0.5) * 0.05;
    arr[i * 3 + 1] = y + (Math.random() - 0.5) * 0.05;
    arr[i * 3 + 2] = z + (Math.random() - 0.5) * 0.05;
  }
  return arr;
}

// ── The forms ─────────────────────────────────────────────────────────────────

// The POINT — a tight dense ball of dots. From a distance it reads as a single
// dot; up close (the camera flying in) it resolves into its hundreds of dots.
function makeBall(count: number): Float32Array {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 0.15 * Math.cbrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    arr[i * 3 + 2] = r * Math.cos(phi);
  }
  return arr;
}

// The LINE — along the Z axis (the camera's flight axis). End-on (from +Z) the
// spread dots pile into an apparent point; from the side (+X) they are a line.
function makeLineZ(count: number): Float32Array {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    arr[i * 3] = (Math.random() - 0.5) * 0.05; // x ≈ 0
    arr[i * 3 + 1] = (Math.random() - 0.5) * 0.05; // y ≈ 0
    arr[i * 3 + 2] = (i / count - 0.5) * (2 * BOUND * 1.35); // along Z (±~3)
  }
  return arr;
}

// Triangle in the X-Z plane (y ≈ 0): edge-on (a line along Z) from +X, full face
// from directly above (+Y). So the line unfolds into a triangle as the camera
// rises overhead.
function makeTriangleXZ(count: number): Float32Array {
  const arr = new Float32Array(count * 3);
  const verts: [number, number][] = [
    [0, 2.0], // (x, z) — apex
    [-1.732, -1.0],
    [1.732, -1.0],
  ];
  const edges: [number, number][][] = [
    [verts[0], verts[1]],
    [verts[1], verts[2]],
    [verts[2], verts[0]],
  ];
  for (let i = 0; i < count; i++) {
    const e = edges[i % 3];
    const t = Math.random();
    const x = e[0][0] + (e[1][0] - e[0][0]) * t;
    const z = e[0][1] + (e[1][1] - e[0][1]) * t;
    arr[i * 3] = x + (Math.random() - 0.5) * 0.05;
    arr[i * 3 + 1] = (Math.random() - 0.5) * 0.05; // y ≈ 0 (kept in the X-Z plane)
    arr[i * 3 + 2] = z + (Math.random() - 0.5) * 0.05;
  }
  return arr;
}

function makeMandala(count: number): Float32Array {
  const arr = new Float32Array(count * 3);
  const radii = [0.7, 1.2, 1.7, 2.1]; // IIII — four saturated rings
  for (let i = 0; i < count; i++) {
    const ring = i % radii.length;
    const r = radii[ring];
    const angle = (i / count) * Math.PI * 2 * (ring + 1) * 1.4;
    arr[i * 3] = Math.cos(angle) * r + (Math.random() - 0.5) * 0.1;
    arr[i * 3 + 1] = Math.sin(angle) * r + (Math.random() - 0.5) * 0.1;
    arr[i * 3 + 2] = (Math.random() - 0.5) * 0.35;
  }
  return arr;
}

function makeBridge(count: number): Float32Array {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const x = (t - 0.5) * (2 * BOUND);
    const y = 1.6 - Math.cosh(x / 1.4) * 0.9; // catenary arch
    arr[i * 3] = x;
    arr[i * 3 + 1] = y + (Math.random() - 0.5) * 0.1;
    arr[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
  }
  return arr;
}

function makeVortex(count: number): Float32Array {
  const arr = new Float32Array(count * 3);
  const turns = 6;
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const y = (t - 0.5) * (2 * BOUND);
    const r = 0.25 + t * 1.9;
    const theta = t * turns * Math.PI * 2;
    arr[i * 3] = Math.cos(theta) * r + (Math.random() - 0.5) * 0.06;
    arr[i * 3 + 1] = y;
    arr[i * 3 + 2] = Math.sin(theta) * r + (Math.random() - 0.5) * 0.06;
  }
  return arr;
}

function makeScatter(count: number): Float32Array {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 1.6 + Math.random() * 0.7;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    arr[i * 3 + 2] = r * Math.cos(phi);
  }
  return arr;
}

function makeOmega(count: number): Float32Array {
  const arr = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const cluster = i % 2 === 0 ? -0.55 : 0.55; // two registers closing as one
    const r = 0.42 * Math.cbrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    arr[i * 3] = r * Math.sin(phi) * Math.cos(theta) + cluster;
    arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    arr[i * 3 + 2] = r * Math.cos(phi) + cluster * 0.4;
  }
  return arr;
}

/** Build all eight morph targets, in canonical Register order. The Point→Line
 *  reveal is a camera fly-THROUGH: the ball of dots spreads along the Z flight
 *  axis into a line as the camera passes through and turns back. */
export function buildForms(count: number = FORM_PARTICLE_COUNT): Float32Array[] {
  return [
    makeBall(count), // 0 Void — the POINT (a dense ball of dots)
    makeLineZ(count), // 1 Recursion — the LINE (along the flight axis)
    makeTriangleXZ(count), // 2 Entropy — the TRIANGLE (X-Z plane)
    makeMandala(count), // 3 Harmonics
    makeBridge(count), // 4 Bridge
    makeVortex(count), // 5 Noosphere
    makeScatter(count), // 6 Translation
    makeOmega(count), // 7 Omega
  ];
}

// ── Dwell mapping — shared by the renderer AND the page's text gating ─────────

// Fraction of each form→form segment spent RESTING on the settled shape before a
// quick transition to the next. Higher = longer dwell on each form.
export const DWELL_HOLD = 0.62;

/** Remap a linear 0..last position so it lingers on each integer form, then
 *  transitions swiftly to the next — instead of morphing continuously. */
export function dwellForm(raw: number, last: number): number {
  const i = Math.min(last, Math.floor(raw));
  const s = raw - i;
  if (s <= DWELL_HOLD) return i;
  const u = (s - DWELL_HOLD) / (1 - DWELL_HOLD);
  return i + u * u * (3 - 2 * u);
}

/** Given scroll progress 0..1, return the dwelled form index, the settled integer
 *  register, and whether a form is currently fully settled (its plateau). The page
 *  uses `settled` to only show register text when the form has finished forming. */
export function phaseState(progress: number): {
  value: number;
  index: number;
  settled: boolean;
} {
  const last = PHASE_COUNT - 1;
  const raw = Math.max(0, Math.min(progress * PHASE_COUNT, last));
  const value = dwellForm(raw, last);
  const index = Math.round(value);
  const settled = Math.abs(value - index) < 0.04;
  return { value, index, settled };
}
