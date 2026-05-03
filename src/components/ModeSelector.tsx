import { useEffect, useRef, useState } from "react";
import type { Mode } from "../types";

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "flashcards", label: "Flashcards", hint: "Read & flip" },
  { id: "multiple", label: "Multiple Choice", hint: "Pick one" },
  { id: "lineage-study", label: "Lineage Study", hint: "Browse all 46" },
  { id: "lineage", label: "Lineage Game", hint: "Test yourself" },
];

interface Props {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

export function ModeSelector({ mode, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const current = MODES.find((m) => m.id === mode) ?? MODES[0];

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <nav className="mode-menu" aria-label="Study mode" ref={containerRef}>
      <button
        type="button"
        className="mode-menu-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="mode-menu-trigger-label">{current.label}</span>
        <span className="mode-menu-trigger-chev" aria-hidden>
          ▾
        </span>
      </button>
      {open && (
        <div className="mode-menu-popover" role="menu">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="menuitemradio"
              aria-checked={m.id === mode}
              className={`mode-menu-item ${m.id === mode ? "active" : ""}`}
              onClick={() => {
                onChange(m.id);
                setOpen(false);
              }}
            >
              <span className="mode-menu-item-label">{m.label}</span>
              <span className="mode-menu-item-hint">{m.hint}</span>
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
