import './KpiCard.css';

export function KpiCard({ label, value, hint }) {
  return (
    <div className="kpi-mini">
      <div className="kpi-mini-label">{label}</div>
      <div className="kpi-mini-value">{value}</div>
      <div className="kpi-mini-hint">{hint}</div>
    </div>
  );
}
