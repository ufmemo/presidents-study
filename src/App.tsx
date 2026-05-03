import { useEffect, useState } from "react";
import type { Mode } from "./types";
import { presidents } from "./data/presidents";
import { ModeSelector } from "./components/ModeSelector";
import { Flashcards } from "./components/Flashcards";
import { MultipleChoice } from "./components/MultipleChoice";
import { Lineage } from "./components/lineage";
import { Splash } from "./components/Splash";
import "./App.css";

const VALID_MODES: readonly Mode[] = [
  "flashcards",
  "multiple",
  "lineage",
  "lineage-study",
];

function modeFromHash(): Mode | null {
  const h = window.location.hash.slice(1);
  return (VALID_MODES as readonly string[]).includes(h)
    ? (h as Mode)
    : null;
}

export default function App() {
  // null = splash. Set when the URL hash matches a mode.
  const [mode, setMode] = useState<Mode | null>(modeFromHash);

  // Reflect the current mode in the URL. Empty mode clears the hash so
  // reload returns to the splash.
  useEffect(() => {
    if (mode === null) {
      if (window.location.hash) {
        history.pushState(
          null,
          "",
          window.location.pathname + window.location.search,
        );
      }
      return;
    }
    if (window.location.hash.slice(1) !== mode) {
      window.location.hash = mode;
    }
  }, [mode]);

  // Sync state when the user navigates via back/forward, edits the URL,
  // or another tab in the app updates the hash.
  useEffect(() => {
    const onHashChange = () => setMode(modeFromHash());
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("popstate", onHashChange);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("popstate", onHashChange);
    };
  }, []);

  if (mode === null) {
    return <Splash presidents={presidents} onSelect={setMode} />;
  }

  return (
    <div className="app">
      <ModeSelector mode={mode} onChange={setMode} />
      <main className="app-main">
        {mode === "flashcards" && <Flashcards presidents={presidents} />}
        {mode === "multiple" && <MultipleChoice presidents={presidents} />}
        {mode === "lineage" && (
          <Lineage key="game" presidents={presidents} entry="game" />
        )}
        {mode === "lineage-study" && (
          <Lineage key="study" presidents={presidents} entry="study" />
        )}
      </main>
    </div>
  );
}
