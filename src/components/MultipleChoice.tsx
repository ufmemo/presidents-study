import { useMemo, useState } from 'react';
import type { President } from '../types';

interface Props {
  presidents: President[];
}

type QuestionKind = 'numberToName' | 'nameToNumber' | 'factToName' | 'termToName';

interface Question {
  prompt: string;
  choices: string[];
  correctIndex: number;
  /** Shown after the user answers, to give context. */
  explanation: string;
  /** Used to keep React happy across re-renders. */
  key: string;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sampleDistinct<T>(arr: T[], n: number, exclude: (item: T) => boolean): T[] {
  const pool = arr.filter((item) => !exclude(item));
  const out: T[] = [];
  while (out.length < n && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

function buildQuestion(presidents: President[]): Question {
  const kinds: QuestionKind[] = [
    'numberToName',
    'nameToNumber',
    'factToName',
    'factToName',
    'termToName',
  ];
  const kind = pickRandom(kinds);
  const target = pickRandom(presidents);
  const key = `${kind}-${target.number}-${Math.random().toString(36).slice(2, 8)}`;

  // Prefer distractors from the same era — harder, more educational.
  const eraPeers = presidents.filter(
    (p) => p.era === target.era && p.number !== target.number,
  );
  const otherDistractors = sampleDistinct(
    presidents,
    3,
    (p) => p.number === target.number,
  );
  const distractorPool =
    eraPeers.length >= 3
      ? sampleDistinct(eraPeers, 3, () => false)
      : [
          ...eraPeers,
          ...otherDistractors.filter(
            (p) => !eraPeers.some((e) => e.number === p.number),
          ),
        ].slice(0, 3);

  switch (kind) {
    case 'numberToName': {
      const choices = [...distractorPool, target]
        .map((p) => p.name)
        .sort(() => Math.random() - 0.5);
      return {
        prompt: `Who was the ${ordinal(target.number)} president?`,
        choices,
        correctIndex: choices.indexOf(target.name),
        explanation: `${target.name} (${target.term}, ${target.party}).`,
        key,
      };
    }
    case 'nameToNumber': {
      const numbers = new Set<number>([target.number]);
      while (numbers.size < 4) {
        const n = 1 + Math.floor(Math.random() * 46);
        if (n !== target.number) numbers.add(n);
      }
      const choices = Array.from(numbers)
        .sort(() => Math.random() - 0.5)
        .map((n) => ordinal(n));
      return {
        prompt: `What number president was ${target.name}?`,
        choices,
        correctIndex: choices.indexOf(ordinal(target.number)),
        explanation: `${target.name} was the ${ordinal(target.number)} president (${target.term}).`,
        key,
      };
    }
    case 'factToName': {
      const fact = pickRandom(target.facts);
      const choices = [...distractorPool, target]
        .map((p) => p.name)
        .sort(() => Math.random() - 0.5);
      return {
        prompt: `Which president is associated with: "${fact}"?`,
        choices,
        correctIndex: choices.indexOf(target.name),
        explanation: `${target.name} (${target.term}).`,
        key,
      };
    }
    case 'termToName': {
      const choices = [...distractorPool, target]
        .map((p) => p.name)
        .sort(() => Math.random() - 0.5);
      return {
        prompt: `Which president served ${target.term}?`,
        choices,
        correctIndex: choices.indexOf(target.name),
        explanation: `${target.name} — ${target.era}.`,
        key,
      };
    }
  }
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function MultipleChoice({ presidents }: Props) {
  const [question, setQuestion] = useState<Question>(() => buildQuestion(presidents));
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  // useMemo to ensure the question object is stable for the current render
  const _ = useMemo(() => question.key, [question.key]);
  void _;

  function pick(i: number) {
    if (selected !== null) return;
    setSelected(i);
    setScore((s) => ({
      correct: s.correct + (i === question.correctIndex ? 1 : 0),
      total: s.total + 1,
    }));
  }

  function next() {
    setQuestion(buildQuestion(presidents));
    setSelected(null);
  }

  return (
    <div className="multiple-choice">
      <div className="mc-header">
        <span className="mc-score">
          Score: {score.correct} / {score.total}
        </span>
        {score.total > 0 && (
          <button
            className="ghost-btn"
            onClick={() => setScore({ correct: 0, total: 0 })}
          >
            Reset
          </button>
        )}
      </div>

      <div className="mc-prompt">{question.prompt}</div>

      <div className="mc-choices">
        {question.choices.map((choice, i) => {
          const isCorrect = selected !== null && i === question.correctIndex;
          const isWrongPick = selected === i && i !== question.correctIndex;
          return (
            <button
              key={i}
              className={`mc-choice ${isCorrect ? 'correct' : ''} ${
                isWrongPick ? 'wrong' : ''
              }`}
              onClick={() => pick(i)}
              disabled={selected !== null}
            >
              {choice}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className="mc-feedback">
          {selected === question.correctIndex ? (
            <span className="mc-correct">Correct.</span>
          ) : (
            <span className="mc-wrong">
              Not quite — answer: <strong>{question.choices[question.correctIndex]}</strong>
            </span>
          )}
          <div className="mc-explanation">{question.explanation}</div>
          <button onClick={next} className="primary-btn">
            Next question →
          </button>
        </div>
      )}
    </div>
  );
}
