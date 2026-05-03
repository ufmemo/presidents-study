interface Props {
  activeNumber: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RestartConfirm({ activeNumber, onCancel, onConfirm }: Props) {
  return (
    <div className="lineage-modal-backdrop" onClick={onCancel}>
      <div className="lineage-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Start over?</h3>
        <p>
          You're on president #{activeNumber}. Starting over goes back to
          George Washington.
        </p>
        <div className="lineage-modal-actions">
          <button className="ghost-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary-btn" onClick={onConfirm}>
            Start over
          </button>
        </div>
      </div>
    </div>
  );
}
