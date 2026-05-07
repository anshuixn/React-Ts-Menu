export function SkeletonCard() {
  return (
    <div
      className="menu-card"
      style={{ overflow: 'hidden', pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <div
        className="card-image skeleton-shimmer"
        style={{
          height: 180,
          background: 'rgba(255, 255, 255, 0.04)',
        }}
      />
      <div className="card-content" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div
          className="skeleton-shimmer"
          style={{
            height: 18,
            width: '70%',
            borderRadius: 6,
            background: 'rgba(255, 255, 255, 0.06)',
          }}
        />
        <div
          className="skeleton-shimmer"
          style={{
            height: 14,
            width: '100%',
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.04)',
          }}
        />
        <div
          className="skeleton-shimmer"
          style={{
            height: 14,
            width: '50%',
            borderRadius: 4,
            background: 'rgba(255, 255, 255, 0.04)',
          }}
        />
        <div className="card-footer" style={{ marginTop: 'auto' }}>
          <div
            className="skeleton-shimmer"
            style={{
              height: 20,
              width: 60,
              borderRadius: 6,
              background: 'rgba(255, 255, 255, 0.06)',
            }}
          />
          <div
            className="skeleton-shimmer"
            style={{
              height: 36,
              width: 80,
              borderRadius: 8,
              background: 'rgba(212, 175, 55, 0.1)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
