// ============================================
// OrbButton — Agent 5 (emoji → image icons)
// Floating orb buttons (cart + status)
// ============================================
interface OrbButtonProps {
  id: string;
  icon: string;       // now an image path e.g. "/icons/cart.png"
  badge?: number;
  glowClass?: string;
  badgeId?: string;
  ariaLabel: string;
  ariaExpanded: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
}

export function OrbButton({ id, icon, badge, glowClass, badgeId, ariaLabel, ariaExpanded, onClick, style }: OrbButtonProps) {
  // Detect if it's an image path or a plain emoji/string
  const isImage = icon.startsWith('/') || icon.startsWith('http');

  return (
    <button
      id={id}
      className="orb-btn"
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      onClick={onClick}
      style={style}
    >
      <span className={`orb-glow ${glowClass ?? ''}`} />
      <span className="orb-icon">
        {isImage ? (
          <img
            src={icon}
            alt={ariaLabel}
            style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: '50%' }}
            draggable={false}
          />
        ) : (
          icon
        )}
      </span>
      {badge !== undefined && badge > 0 && (
        <span id={badgeId} className="orb-badge badge-bounce">{badge}</span>
      )}
    </button>
  );
}

// ============================================
// SuccessOverlay — Agent 5
// ============================================
export function SuccessOverlay({ active }: { active: boolean }) {
  return (
    <div id="success-overlay" className={`success-overlay${active ? ' active' : ''}`}>
      <div className="success-checkmark">
        <svg viewBox="0 0 50 50">
          <polyline points="8,25 20,37 42,13" />
        </svg>
      </div>
      <h3 style={{ color: 'var(--text-light)', marginBottom: 10 }}>Order Placed!</h3>
      <p style={{ color: 'var(--text-muted)' }}>Sending to the kitchen…</p>
    </div>
  );
}
