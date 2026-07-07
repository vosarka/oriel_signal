#!/usr/bin/env node
/**
 * Regenerate server/data/vrc-engine-constants.json from VTRS v2 canon.
 * Run: pnpm exec node scripts/generate-vrc-engine-constants.mjs
 */
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

execSync(
  `pnpm exec tsx -e "
import { VTRS_CENTERS, VTRS_LINKS } from './client/src/components/oriel-signal/vtrs/vtrs-data.ts';
import { writeFileSync } from 'fs';
const planetary_inputs = [
  { id: 'sun', name: 'Sun', swiss_eph_id: 0 },
  { id: 'moon', name: 'Moon', swiss_eph_id: 1 },
  { id: 'mercury', name: 'Mercury', swiss_eph_id: 2 },
  { id: 'venus', name: 'Venus', swiss_eph_id: 3 },
  { id: 'mars', name: 'Mars', swiss_eph_id: 4 },
  { id: 'jupiter', name: 'Jupiter', swiss_eph_id: 5 },
  { id: 'saturn', name: 'Saturn', swiss_eph_id: 6 },
  { id: 'uranus', name: 'Uranus', swiss_eph_id: 7 },
  { id: 'neptune', name: 'Neptune', swiss_eph_id: 8 },
  { id: 'pluto', name: 'Pluto', swiss_eph_id: 9 },
  { id: 'north_node', name: 'North Node', swiss_eph_id: 11 },
  { id: 'south_node', name: 'South Node', swiss_eph_id: 'CALCULATED (Opposite of NN)' },
  { id: 'earth', name: 'Earth', swiss_eph_id: 'CALCULATED (Opposite of Sun)' },
];
const doc = {
  meta: { system: 'Vossari Resonance Codex', version: '2.0', description: 'VTRS v2 immutable data arrays — 8 Tetradic centers, 32 resonance links.', architecture: 'VTRS', supersedes: '1.0 (9-center / 36-channel legacy)' },
  planetary_inputs,
  centers: VTRS_CENTERS.map(c => ({ id: c.id.toUpperCase(), name: c.name, type: c.phaseSyntax, roman: c.roman, codons: c.codons })),
  channels: VTRS_LINKS.map(l => ({ id: l.codonA + '-' + l.codonB, name: l.name, gate_a: l.codonA, gate_b: l.codonB, connects: [l.centerA.toUpperCase(), l.centerB.toUpperCase()], circuit: l.circuit, link_id: l.id })),
};
writeFileSync('server/data/vrc-engine-constants.json', JSON.stringify(doc, null, 2) + '\\n');
console.log('Wrote server/data/vrc-engine-constants.json:', doc.centers.length, 'centers,', doc.channels.length, 'channels');
"`,
  { cwd: root, stdio: "inherit" }
);