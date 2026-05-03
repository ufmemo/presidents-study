import { useState } from "react";
import { FINAL_PRES_NUMBER } from "./constants";
import { DifficultyToggle } from "./DifficultyToggle";
import type { Difficulty } from "./types";

interface Props {
  initialDifficulty: Difficulty;
  onPlayAgain: (d: Difficulty) => void;
}

export function CompleteScreen({ initialDifficulty, onPlayAgain }: Props) {
  const [d, setD] = useState<Difficulty>(initialDifficulty);
  return (
    <div className="lineage-screen">
      <div className="lineage-screen-card">
        <h2>You did it!</h2>
        <p>
          You walked all {FINAL_PRES_NUMBER} presidencies — Washington to
          present.
        </p>
        <DifficultyToggle value={d} onChange={setD} />
        <button className="primary-btn" onClick={() => onPlayAgain(d)}>
          Play again
        </button>
      </div>
    </div>
  );
}
