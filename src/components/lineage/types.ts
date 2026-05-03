export type Difficulty = "easy" | "hard";
export type Phase = "start" | "playing" | "complete";

export interface TrailPick {
  number: number;
  x: number;
  y: number;
}

export interface Candidate {
  number: number;
  x: number;
  y: number;
  /** Set when this slot is the Ryan Gosling easter egg (Easy mode only).
   * The egg's `number` is a sentinel (EGG_NUMBER) that never matches the
   * pentagon's correctNumber, so clicking it is always wrong. */
  egg?: { name: string; imageFile: string };
}

export interface Pentagon {
  candidates: Candidate[];
  correctNumber: number;
}

export interface RunState {
  difficulty: Difficulty;
  phase: Phase;
  trail: TrailPick[];
  pentagon: Pentagon | null;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export interface MorphPick {
  number: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}
