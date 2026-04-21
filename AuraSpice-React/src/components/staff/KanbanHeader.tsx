import { useState } from 'react';

export function KanbanHeader({ onClearAll }: { onClearAll: () => Promise<void> }) {
  const [clearPending, setClearPending] = useState(false);

  const handleClear = async () => {
    if (clearPending) {
      await onClearAll();
      setClearPending(false);
    } else {
      setClearPending(true);
      setTimeout(() => setClearPending(false), 3000);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
      <button
        onClick={handleClear}
        className="btn-outline btn-sm"
        style={{
          borderColor: clearPending ? 'transparent' : '#ff4757',
          color: clearPending ? 'white' : '#ff4757',
          background: clearPending ? '#ff4757' : 'transparent',
          transition: 'all 0.3s ease',
        }}
      >
        {clearPending ? '⚠ Confirm Clear' : 'Clear All'}
      </button>
    </div>
  );
}
