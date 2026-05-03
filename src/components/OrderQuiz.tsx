import { useState } from 'react';
import type { President } from '../types';

interface Props {
  presidents: President[];
}

const ROUND_SIZE = 5;

function pickRound(all: President[]): President[] {
  const copy = [...all];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, ROUND_SIZE);
}

function shuffleRound(round: President[]): President[] {
  // Ensure the shuffled order is not already correct.
  const sorted = [...round].sort((a, b) => a.startYear - b.startYear);
  for (let attempt = 0; attempt < 20; attempt++) {
    const copy = [...round];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    if (copy.some((p, i) => p.number !== sorted[i].number)) return copy;
  }
  return round;
}

export function OrderQuiz({ presidents }: Props) {
  const [round, setRound] = useState(() => pickRound(presidents));
  const [arrangement, setArrangement] = useState(() => shuffleRound(round));
  const [checked, setChecked] = useState(false);

  const correctOrder = [...round].sort((a, b) => a.startYear - b.startYear);

  function move(idx: number, delta: number) {
    if (checked) return;
    const next = idx + delta;
    if (next < 0 || next >= arrangement.length) return;
    const copy = [...arrangement];
    [copy[idx], copy[next]] = [copy[next], copy[idx]];
    setArrangement(copy);
  }

  function check() {
    setChecked(true);
  }

  function nextRound() {
    const newRound = pickRound(presidents);
    setRound(newRound);
    setArrangement(shuffleRound(newRound));
    setChecked(false);
  }

  const allCorrect =
    checked && arrangement.every((p, i) => p.number === correctOrder[i].number);

  return (
    <div className="order-quiz">
      <div className="order-prompt">
        Put these presidents in chronological order — earliest at the top.
      </div>

      <ol className="order-list">
        {arrangement.map((p, i) => {
          const isCorrect = checked && p.number === correctOrder[i].number;
          const isWrong = checked && !isCorrect;
          return (
            <li
              key={p.number}
              className={`order-item ${isCorrect ? 'correct' : ''} ${
                isWrong ? 'wrong' : ''
              }`}
            >
              <div className="order-item-text">
                <span className="order-item-name">{p.name}</span>
                {checked && (
                  <span className="order-item-meta">
                    #{p.number} · {p.term}
                  </span>
                )}
              </div>
              {!checked && (
                <div className="order-item-actions">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move ${p.name} up`}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === arrangement.length - 1}
                    aria-label={`Move ${p.name} down`}
                  >
                    ↓
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {checked && !allCorrect && (
        <div className="order-correct">
          <strong>Correct order:</strong>
          <ol>
            {correctOrder.map((p) => (
              <li key={p.number}>
                {p.name} <span className="muted">(#{p.number}, {p.term})</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {checked && allCorrect && (
        <div className="order-success">All correct. Nice work.</div>
      )}

      <div className="order-actions">
        {!checked ? (
          <button onClick={check} className="primary-btn">
            Check answer
          </button>
        ) : (
          <button onClick={nextRound} className="primary-btn">
            Next round →
          </button>
        )}
      </div>
    </div>
  );
}
