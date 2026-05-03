interface Props {
  zoom: number;
  zoomPct: number;
  isActiveOffscreen: boolean;
  hideCandidates: boolean;
  onRestart: () => void;
  onResetZoom: () => void;
  onRecenter: () => void;
  onToggleHideCandidates: () => void;
}

export function HUD({
  zoom,
  zoomPct,
  isActiveOffscreen,
  hideCandidates,
  onRestart,
  onResetZoom,
  onRecenter,
  onToggleHideCandidates,
}: Props) {
  return (
    <div className="lineage-hud">
      <button
        className={`lineage-hud-btn lineage-hide-toggle ${
          hideCandidates ? "active" : ""
        }`}
        onClick={onToggleHideCandidates}
        title={
          hideCandidates
            ? "Show candidate portraits"
            : "Hide candidate portraits (the photo style can leak the era)"
        }
        aria-pressed={hideCandidates}
      >
        {hideCandidates ? "👁 Hidden" : "🙈 Hide images"}
      </button>
      <button
        className="lineage-hud-btn lineage-restart"
        onClick={onRestart}
        title="Start over"
      >
        ⟲ Start over
      </button>
      {zoom < 0.999 && (
        <button
          className="lineage-hud-btn lineage-zoom-chip"
          onClick={onResetZoom}
          title="Reset zoom"
        >
          {zoomPct}% — reset zoom
        </button>
      )}
      {isActiveOffscreen && (
        <button
          className="lineage-hud-btn lineage-recenter"
          onClick={onRecenter}
          title="Back to current"
        >
          ↩ Back to current
        </button>
      )}
    </div>
  );
}
