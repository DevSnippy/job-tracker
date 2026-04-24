'use client';

export default function MatchBar({ value }: { value: number }) {
  const color = value >= 80 ? 'var(--success)' : value >= 60 ? 'var(--accent)' : 'var(--warn)';
  return (
    <div className="row" style={{ gap: 6, minWidth: 70 }}>
      <div style={{ width: 42, height: 4, background: 'var(--surface-2)', borderRadius: 2 }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span className="mono-strong" style={{ fontSize: 11 }}>{value}</span>
    </div>
  );
}
