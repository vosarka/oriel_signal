/**
 * VOSSARI TETRADIC INDEXING PROTOCOL (VTIP) — SYS-DOC-01
 *
 * The archive does not count. It tracks saturation.
 * A register holds four bits (the Tetrad). Four bits is SATURATION.
 * The prime marker (′) is a register break: one cycle complete,
 * a new layer building on the saturated foundation.
 *
 * IIII, never IV — the system accumulates, it never subtracts.
 */

export interface VtipRegister {
  id: string;
  /** Visual syntax as the protocol writes it. */
  vtip: string;
  /** The archetype the register carries. */
  name: string;
  /** The state it holds. */
  state: string;
  /** Inclusive TX-number span. */
  range: readonly [number, number];
}

export const VTIP_REGISTERS: readonly VtipRegister[] = [
  { id: "all", vtip: "⦿", name: "ALL REGISTERS", state: "FULL SPECTRUM", range: [0, 999] },
  { id: "I", vtip: "I", name: "ORIGIN", state: "VACUUM", range: [1, 10] },
  { id: "II", vtip: "II", name: "RECURSION", state: "HOLOGRAM", range: [11, 20] },
  { id: "III", vtip: "III", name: "COMPLEXIFICATION", state: "ENTROPY", range: [21, 30] },
  { id: "IIII", vtip: "IIII", name: "HARMONICS", state: "SATURATION", range: [31, 40] },
  { id: "V", vtip: "IIII′I", name: "THE BRIDGE", state: "HUMANITY", range: [41, 50] },
  { id: "VI", vtip: "IIII′II", name: "COSMIC BECOMING", state: "EXPANSION", range: [51, 60] },
  { id: "VII", vtip: "IIII′III", name: "VOID RETURN", state: "DISSOLUTION", range: [61, 70] },
  { id: "VIII", vtip: "IIII′IIII", name: "OMEGA POINT", state: "DOUBLE SATURATION", range: [71, 80] },
] as const;

/** The register a transmission is filed under. */
export function registerFor(txNumber: number): VtipRegister | undefined {
  return VTIP_REGISTERS.find(
    r => r.id !== "all" && txNumber >= r.range[0] && txNumber <= r.range[1]
  );
}

/**
 * Bits held by a register, quantised to the Tetrad.
 * 0 = dormant, 4 = saturated and ready to spill into the prime.
 */
export function tetradBits(held: number, capacity: number): number {
  if (held <= 0 || capacity <= 0) return 0;
  return Math.min(4, Math.ceil((held / capacity) * 4));
}

/** Split the syntax so the prime marker can be coloured on its own. */
export function splitPrime(vtip: string): [string, string] {
  const i = vtip.indexOf("′");
  if (i === -1) return [vtip, ""];
  return [vtip.slice(0, i), vtip.slice(i)];
}
