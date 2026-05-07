import { useCountUp } from '../../hooks/useCountUp';

function StatItem({ count, label }: { count: number; label: string }) {
  const { ref, displayValue } = useCountUp(count);
  return (
    <div className="stat-item">
      <h3 ref={ref}>{displayValue}</h3>
      <p>{label}</p>
    </div>
  );
}

export function StatsBar() {
  return (
    <section className="container">
      <div className="stats-row reveal">
        <StatItem count={12}    label="Years of Excellence" />
        <StatItem count={5}     label="Cuisine Categories" />
        <StatItem count={29}    label="Signature Dishes" />
        <StatItem count={15000} label="Happy Guests" />
      </div>
    </section>
  );
}
