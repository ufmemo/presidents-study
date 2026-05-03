import { STORAGE_KEY } from "./constants";
import type { RunState, TrailPick } from "./types";
import { trailY } from "./utils";

const HIDE_CANDIDATES_KEY = "lineage:hide-candidates:v1";

export function loadHideCandidates(): boolean {
  try {
    return localStorage.getItem(HIDE_CANDIDATES_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveHideCandidates(v: boolean) {
  try {
    localStorage.setItem(HIDE_CANDIDATES_KEY, v ? "1" : "0");
  } catch {
    // ignore
  }
}

export function loadRun(): RunState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.v !== 1) return null;
    if (
      typeof parsed.difficulty !== "string" ||
      typeof parsed.phase !== "string" ||
      !Array.isArray(parsed.trail)
    ) {
      return null;
    }
    // Normalize trail to a vertical line going downward (migrates older runs).
    const total = parsed.trail.length;
    const trail: TrailPick[] = parsed.trail.map(
      (p: { number: number }, i: number) => ({
        number: p.number,
        x: 0,
        y: trailY(i, total),
      }),
    );
    // Phase "study" was previously an internal phase under a single Lineage
    // entry; it's been split into its own top-level pill item. Treat any
    // saved "study" as a fresh start so the game start screen appears.
    const phase: "start" | "playing" | "complete" =
      parsed.phase === "playing" || parsed.phase === "complete"
        ? parsed.phase
        : "start";
    return {
      difficulty: parsed.difficulty,
      phase,
      trail,
      // Pentagon coords were relative to old (possibly random) trail positions;
      // discard and rebuild on mount.
      pentagon: null,
    };
  } catch {
    return null;
  }
}

export function saveRun(state: RunState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, ...state }));
  } catch {
    // ignore quota/serialization errors
  }
}
