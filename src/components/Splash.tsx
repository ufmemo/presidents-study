import { useEffect, useState } from "react";
import type { Mode, President } from "../types";
import { Portrait } from "./Portrait";

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "flashcards", label: "Flashcards", hint: "Read & flip" },
  { id: "multiple", label: "Multiple Choice", hint: "Pick one" },
  { id: "lineage-study", label: "Lineage Study", hint: "Browse all 46" },
  { id: "lineage", label: "Lineage Game", hint: "Test yourself" },
];

// Approximate cell size in pixels (cell width + gap), matches the CSS
// `grid-template-columns: repeat(auto-fill, minmax(64px, 1fr))` plus 6px gap.
const TILE_CELL_SIZE = 70;
// Min/max guards: don't render fewer than ~one mobile screen, don't render
// more than the cap on huge displays (DOM perf).
const MIN_TILES = 80;
const MAX_TILES = 800;

function calcTileCount(w: number, h: number): number {
  const cols = Math.ceil(w / TILE_CELL_SIZE);
  const rows = Math.ceil(h / TILE_CELL_SIZE);
  // +20 buffer covers partial rows and the safe-area padding.
  return Math.min(Math.max(cols * rows + 20, MIN_TILES), MAX_TILES);
}

interface Props {
  presidents: President[];
  onSelect: (mode: Mode) => void;
}

export function Splash({ presidents, onSelect }: Props) {
  const [tileCount, setTileCount] = useState(() =>
    typeof window === "undefined"
      ? MIN_TILES
      : calcTileCount(window.innerWidth, window.innerHeight),
  );

  useEffect(() => {
    const onResize = () => {
      setTileCount(calcTileCount(window.innerWidth, window.innerHeight));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const tiles = Array.from(
    { length: tileCount },
    (_, i) => presidents[i % presidents.length],
  );

  return (
    <div className="splash">
      <div className="splash-wallpaper" aria-hidden>
        {tiles.map((p, i) => (
          <div className="splash-tile" key={`tile-${i}`}>
            <Portrait president={p} />
          </div>
        ))}
      </div>

      <div className="splash-card">
        <h1 className="splash-title">APUSH Presidents</h1>
        <p className="splash-subtitle">Study the 46 U.S. presidents</p>
        <ul className="splash-menu">
          {MODES.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                className="splash-menu-item"
                onClick={() => onSelect(m.id)}
              >
                <span className="splash-menu-label">{m.label}</span>
                <span className="splash-menu-hint">{m.hint}</span>
                <span className="splash-menu-arrow" aria-hidden>
                  →
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
