import type { Mode, President } from "../types";
import { Portrait } from "./Portrait";

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "flashcards", label: "Flashcards", hint: "Read & flip" },
  { id: "multiple", label: "Multiple Choice", hint: "Pick one" },
  { id: "lineage-study", label: "Lineage Study", hint: "Browse all 46" },
  { id: "lineage", label: "Lineage Game", hint: "Test yourself" },
];

// Tiles needed to comfortably fill a tall viewport. Repeats the 46-president
// set as needed.
const WALLPAPER_TILE_COUNT = 80;

interface Props {
  presidents: President[];
  onSelect: (mode: Mode) => void;
}

export function Splash({ presidents, onSelect }: Props) {
  const tiles = Array.from(
    { length: WALLPAPER_TILE_COUNT },
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
