import type { President } from "../../types";
import {
  EGG_IMAGES,
  EGG_NAME,
  EGG_NUMBER,
  EGG_RATE,
  FINAL_PRES_NUMBER,
  PENTAGON_ANGLES,
  PENTAGON_RADIUS,
} from "./constants";
import type { Candidate, Difficulty, Pentagon, TrailPick } from "./types";
import { presidentByNumber } from "./utils";

export function pickDistractors(
  presidents: President[],
  currentNumber: number,
  correctNumber: number,
  difficulty: Difficulty,
): President[] {
  const current = presidentByNumber(presidents, currentNumber);
  const correct = presidentByNumber(presidents, correctNumber);
  if (!correct) return [];
  const usedNames = new Set<string>();
  if (current) usedNames.add(current.name);
  usedNames.add(correct.name);

  let pool = presidents.filter(
    (p) => p.number !== correctNumber && !usedNames.has(p.name),
  );
  if (difficulty === "hard") {
    const narrow = pool.filter((p) => Math.abs(p.number - currentNumber) <= 20);
    if (narrow.length >= 4) pool = narrow;
  }

  const result: President[] = [];
  const taken = new Set<string>(usedNames);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  for (const p of shuffled) {
    if (taken.has(p.name)) continue;
    result.push(p);
    taken.add(p.name);
    if (result.length === 4) break;
  }
  return result;
}

export function buildPentagon(
  presidents: President[],
  active: TrailPick,
  difficulty: Difficulty,
): Pentagon | null {
  const correctNumber = active.number + 1;
  if (correctNumber > FINAL_PRES_NUMBER) return null;
  if (!presidentByNumber(presidents, correctNumber)) return null;

  const distractors = pickDistractors(
    presidents,
    active.number,
    correctNumber,
    difficulty,
  );
  if (distractors.length < 4) return null;

  const correctSlot = Math.floor(Math.random() * 5);
  const occupants: number[] = [];
  let di = 0;
  for (let i = 0; i < 5; i++) {
    occupants.push(
      i === correctSlot ? correctNumber : distractors[di++].number,
    );
  }
  const candidates: Candidate[] = occupants.map((number, i) => {
    const angle = PENTAGON_ANGLES[i];
    return {
      number,
      x: active.x + PENTAGON_RADIUS * Math.cos(angle),
      y: active.y + PENTAGON_RADIUS * Math.sin(angle),
    };
  });

  // Easter egg: in Easy mode, EGG_RATE chance per pentagon to swap one of
  // the four distractors for Ryan Gosling. Sentinel EGG_NUMBER never matches
  // correctNumber, so clicking him always triggers the wrong-pick reaction.
  if (difficulty === "easy" && Math.random() < EGG_RATE) {
    const distractorIndices = candidates
      .map((c, i) => (c.number === correctNumber ? -1 : i))
      .filter((i) => i >= 0);
    const target =
      distractorIndices[Math.floor(Math.random() * distractorIndices.length)];
    const imageFile = EGG_IMAGES[Math.floor(Math.random() * EGG_IMAGES.length)];
    candidates[target] = {
      number: EGG_NUMBER,
      x: candidates[target].x,
      y: candidates[target].y,
      egg: { name: EGG_NAME, imageFile },
    };
  }

  return { candidates, correctNumber };
}
