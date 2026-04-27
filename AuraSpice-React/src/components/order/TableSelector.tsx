// ============================================
// TableSelector — Table number picker modal
// ============================================

const TOTAL_TABLES = 20;

interface TableSelectorProps {
  isOpen: boolean;
  current: string;
  onSelect: (table: string) => void;
}

export function TableSelector({ isOpen, current, onSelect }: TableSelectorProps) {
  if (!isOpen) return null;

  const tables = Array.from({ length: TOTAL_TABLES }, (_, i) =>
    String(i + 1).padStart(2, '0')
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
        animation: 'tsOverlayIn 0.25s ease both',
      }}
    >
      <div
        style={{
          background: 'rgba(14, 14, 14, 0.98)',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          borderRadius: 24,
          padding: '2rem',
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 40px 100px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.06)',
          animation: 'tsCardIn 0.35s cubic-bezier(0.16,1,0.3,1) both',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ marginBottom: 8 }}>
            <img src="/icons/table.png" alt="Table" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: '50%' }} draggable={false} />
          </div>
          <h2 style={{
            margin: 0,
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '1.6rem',
            fontWeight: 700,
            color: 'var(--text-light)',
            letterSpacing: 0.5,
          }}>
            Select Your Table
          </h2>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: 6, margin: '6px 0 0' }}>
            Tap your table number to begin ordering
          </p>
        </div>

        {/* Table grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '0.6rem',
          marginBottom: '1.5rem',
        }}>
          {tables.map((t) => {
            const isActive = t === current;
            return (
              <button
                key={t}
                onClick={() => onSelect(t)}
                style={{
                  padding: '14px 0',
                  borderRadius: 12,
                  border: isActive
                    ? '2px solid var(--accent-gold)'
                    : '1px solid rgba(255,255,255,0.08)',
                  background: isActive
                    ? 'rgba(212, 175, 55, 0.18)'
                    : 'rgba(255,255,255,0.04)',
                  color: isActive ? 'var(--accent-gold)' : 'var(--text-muted)',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 0 14px rgba(212,175,55,0.25)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,175,55,0.08)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(212,175,55,0.3)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-light)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.08)';
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                  }
                }}
              >
                {parseInt(t)}
              </button>
            );
          })}
        </div>

        {/* Confirm hint */}
        <p style={{
          textAlign: 'center',
          color: 'var(--text-dim)',
          fontSize: '0.75rem',
          margin: 0,
          lineHeight: 1.5,
        }}>
          Table number is printed on your table card.<br />
          You can change it any time by tapping the table badge.
        </p>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes tsOverlayIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes tsCardIn {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1);     }
        }
      `}</style>
    </div>
  );
}
