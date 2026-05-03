import type { Mode } from '../types';

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: 'flashcards', label: 'Flashcards', hint: 'Read & flip' },
  { id: 'order', label: 'Order Quiz', hint: 'Put in order' },
  { id: 'multiple', label: 'Multiple Choice', hint: 'Pick one' },
];

interface Props {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

export function ModeSelector({ mode, onChange }: Props) {
  return (
    <nav className="mode-selector" aria-label="Study mode">
      {MODES.map((m) => (
        <button
          key={m.id}
          className={`mode-tab ${mode === m.id ? 'active' : ''}`}
          onClick={() => onChange(m.id)}
          aria-pressed={mode === m.id}
        >
          <span className="mode-tab-label">{m.label}</span>
          <span className="mode-tab-hint">{m.hint}</span>
        </button>
      ))}
    </nav>
  );
}
