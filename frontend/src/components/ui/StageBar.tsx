'use client';

export default function StageBar({ stage }: { stage: number }) {
  const stages = ["S", "I", "A", "C", "O"];
  return (
    <div className="stage-bar">
      {stages.map((s, i) => (
        <span key={i} className={`st${i < stage ? " done" : ""}${i === stage ? " current" : ""}`}>{s}</span>
      ))}
    </div>
  );
}
