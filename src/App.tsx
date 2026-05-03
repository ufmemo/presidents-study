import { useState } from "react";
import type { Mode } from "./types";
import { presidents } from "./data/presidents";
import { ModeSelector } from "./components/ModeSelector";
import { Flashcards } from "./components/Flashcards";
import { OrderQuiz } from "./components/OrderQuiz";
import { MultipleChoice } from "./components/MultipleChoice";
import "./App.css";

export default function App() {
  const [mode, setMode] = useState<Mode>("flashcards");

  return (
    <div className="app">
      <ModeSelector mode={mode} onChange={setMode} />

      <main className="app-main">
        {mode === "flashcards" && <Flashcards presidents={presidents} />}
        {mode === "order" && <OrderQuiz presidents={presidents} />}
        {mode === "multiple" && <MultipleChoice presidents={presidents} />}
      </main>
    </div>
  );
}
