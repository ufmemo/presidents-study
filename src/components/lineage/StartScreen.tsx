import { useState } from "react";
import { DifficultyToggle } from "./DifficultyToggle";
import type { Difficulty } from "./types";

interface Props {
  initialDifficulty: Difficulty;
  onStart: (d: Difficulty) => void;
}

export function StartScreen({ initialDifficulty, onStart }: Props) {
  const [d, setD] = useState<Difficulty>(initialDifficulty);

  return (
    <div className="lineage-screen">
      <div className="lineage-screen-card">
        <h2>Lineage</h2>
        <p>
          Walk the presidents in order. The next president is one of five —
          pick the right one to advance.
        </p>
        <DifficultyToggle value={d} onChange={setD} />
        <button className="primary-btn" onClick={() => onStart(d)}>
          Start
        </button>
      </div>
    </div>
  );
}
