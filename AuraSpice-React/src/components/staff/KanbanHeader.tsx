import { useState } from 'react';

export function KanbanHeader({ onClearAll }: { onClearAll: () => void }) {
  const [clearPending, setClearPending] = useState(false);

  const handleConfirm = async () => {
    await onClearAll();
    setClearPending(false);
  };

  const handleCancel = () => {
    setClearPending(false);
  };

  if (clearPending) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 20 }}>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            color: '#ff4757',
            fontSize: '0.82rem',
            fontWeight: 600,
            marginRight: 8,
          }}
        >
          ⚠ Clear all completed orders?
        </span>
        <button
          onClick={handleConfirm}
          className="btn-outline btn-sm"
          style={{
            borderColor: 'transparent',
            color: 'white',
            background: '#ff4757',
            transition: 'all 0.3s ease',
          }}
          aria-label="Confirm clearing all completed orders"
        >
          Confirm
        </button>
        <button
          onClick={handleCancel}
          className="btn-outline btn-sm"
          style={{
            borderColor: 'var(--glass-border)',
            color: 'var(--text-muted)',
            background: 'transparent',
            transition: 'all 0.3s ease',
          }}
          aria-label="Cancel clearing orders"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
      <button
        onClick={() => setClearPending(true)}
        className="btn-outline btn-sm"
        style={{
          borderColor: '#ff4757',
          color: '#ff4757',
          background: 'transparent',
          transition: 'all 0.3s ease',
        }}
        aria-label="Clear all completed orders"
      >
        Clear All
      </button>
    </div>
  );
}
