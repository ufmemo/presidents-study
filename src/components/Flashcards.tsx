import { useMemo, useState } from 'react';
import type { President } from '../types';
import { Portrait } from './Portrait';

interface Props {
  presidents: President[];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function Flashcards({ presidents }: Props) {
  const [shuffled, setShuffled] = useState(false);
  const [seed, setSeed] = useState(0);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const order = useMemo(() => {
    if (!shuffled) return presidents;
    void seed;
    return shuffle(presidents);
  }, [presidents, shuffled, seed]);

  const president = order[index];

  function go(delta: number) {
    setFlipped(false);
    setIndex((i) => {
      const next = i + delta;
      if (next < 0) return order.length - 1;
      if (next >= order.length) return 0;
      return next;
    });
  }

  function toggleShuffle() {
    setShuffled((s) => !s);
    setSeed((n) => n + 1);
    setIndex(0);
    setFlipped(false);
  }

  return (
    <div className="flashcards">
      <div className="flashcards-controls">
        <span className="flashcards-counter">
          {index + 1} / {order.length}
        </span>
        <button onClick={toggleShuffle} className="ghost-btn">
          {shuffled ? 'In order' : 'Shuffle'}
        </button>
      </div>

      <button
        className={`flashcard ${flipped ? 'flipped' : ''}`}
        onClick={() => setFlipped((f) => !f)}
        aria-label={flipped ? 'Show portrait' : 'Show facts'}
      >
        <div className="flashcard-inner">
          <div className="flashcard-face flashcard-front">
            <div className="flashcard-portrait-wrap">
              <div className="flashcard-portrait-square">
                <Portrait president={president} />
                <span className="flashcard-number-badge">#{president.number}</span>
              </div>
            </div>
            <div className="flashcard-info">
              <div className="flashcard-name">{president.name}</div>
              <div className="flashcard-meta">
                <span>{president.term}</span>
                <span className="dot">·</span>
                <span>{president.party}</span>
              </div>
              <div className="flashcard-era">{president.era}</div>
            </div>
            <div className="flashcard-hint">Tap card for facts</div>
          </div>
          <div className="flashcard-face flashcard-back">
            <div className="flashcard-back-header">
              <Portrait president={president} size={48} />
              <div>
                <div className="flashcard-back-name">{president.name}</div>
                <div className="flashcard-back-sub">
                  #{president.number} · {president.term}
                </div>
              </div>
            </div>
            <ul className="flashcard-facts">
              {president.facts.map((f, i) => (
                <li key={i}>{f}</li>
              ))}
            </ul>
            <div className="flashcard-hint">Tap card to flip back</div>
          </div>
        </div>
      </button>

      <div className="flashcards-nav">
        <button onClick={() => go(-1)} className="primary-btn">
          ← Prev
        </button>
        <button onClick={() => go(1)} className="primary-btn">
          Next →
        </button>
      </div>
    </div>
  );
}
