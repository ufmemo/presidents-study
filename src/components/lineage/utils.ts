import type { President } from "../../types";
import { TIGHT_SPACING, TRAIL_SPACING } from "./constants";

export function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function presidentByNumber(presidents: President[], n: number) {
  return presidents.find((p) => p.number === n);
}

/**
 * World y-coord for the trail entry at `index` when the trail has `total`
 * entries total. The last entry (active) sits TRAIL_SPACING below the entry
 * above it; all earlier entries are spaced by TIGHT_SPACING.
 */
export function trailY(index: number, total: number): number {
  if (total <= 1) return 0;
  if (index === total - 1) {
    return (total - 2) * TIGHT_SPACING + TRAIL_SPACING;
  }
  return index * TIGHT_SPACING;
}
