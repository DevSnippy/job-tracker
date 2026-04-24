'use client';
import type { ResumeData, Template } from '@/lib/types';

interface ResumePreviewProps {
  template: Template;
  data: ResumeData;
  scale?: number;
}

function ExpItem({ e, serif, mono, minimal }: { e: ResumeData['experience'][0]; serif?: boolean; mono?: boolean; minimal?: boolean }) {
  return (
    <div style={{ marginBottom: 8, fontFamily: mono ? '"JetBrains Mono", monospace' : serif ? '"Georgia", serif' : undefined }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontWeight: minimal ? 500 : 700, fontSize: 10.5, color: '#111' }}>{e.role}</div>
        <div style={{ fontSize: 9, color: '#666' }}>{e.when}</div>
      </div>
      <div style={{ fontSize: 9.5, color: '#444', fontStyle: serif ? 'italic' : 'normal', marginBottom: 3 }}>{e.company} — {e.loc}</div>
      <ul style={{ margin: 0, paddingLeft: 14, fontSize: 9, lineHeight: 1.55, color: '#333' }}>
        {e.bullets.map((b, i) => <li key={i}>{b}</li>)}
      </ul>
    </div>
  );
}

function Section({ title, children, accent }: { title: string; children: React.ReactNode; accent: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: accent, marginBottom: 6, borderBottom: `1px solid ${accent}22`, paddingBottom: 3 }}>{title}</div>
      {children}
    </div>
  );
}

export default function ResumePreview({ template: t, data, scale = 1 }: ResumePreviewProps) {
  const renderBody = () => {
    switch (t.name) {
      case 'Vanguard': return (
        <div>
          <div style={{ borderBottom: `3px solid ${t.accent}`, paddingBottom: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111' }}>{data.name}</div>
            <div style={{ fontSize: 10.5, color: '#444', marginTop: 2 }}>{data.title}</div>
            <div style={{ fontSize: 9, color: '#666', marginTop: 6, display: 'flex', gap: 10 }}><span>{data.email}</span><span>·</span><span>{data.phone}</span><span>·</span><span>{data.location}</span></div>
          </div>
          <Section title="Summary" accent={t.accent}><div style={{ fontSize: 9.5, lineHeight: 1.55, color: '#333' }}>{data.summary}</div></Section>
          <Section title="Experience" accent={t.accent}>{data.experience.map((e, i) => <ExpItem key={i} e={e} />)}</Section>
          <Section title="Skills" accent={t.accent}><div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{data.skills.map(s => <span key={s} style={{ fontSize: 9, padding: '1px 6px', background: `${t.accent}15`, color: t.accent, borderRadius: 3, fontWeight: 500 }}>{s}</span>)}</div></Section>
        </div>
      );
      case 'Ledger': return (
        <div style={{ fontFamily: '"Georgia", serif' }}>
          <div style={{ textAlign: 'center', borderBottom: '1px solid #222', paddingBottom: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 24, fontWeight: 400, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#111' }}>{data.name}</div>
            <div style={{ fontSize: 10, fontStyle: 'italic', color: '#555', marginTop: 4 }}>{data.title}</div>
            <div style={{ fontSize: 9, color: '#666', marginTop: 6 }}>{data.email} · {data.phone} · {data.location}</div>
          </div>
          <Section title="Profile" accent={t.accent}><div style={{ fontSize: 10, lineHeight: 1.6, color: '#222' }}>{data.summary}</div></Section>
          <Section title="Experience" accent={t.accent}>{data.experience.map((e, i) => <ExpItem key={i} e={e} serif />)}</Section>
          <Section title="Skills" accent={t.accent}><div style={{ fontSize: 9.5, color: '#222' }}>{data.skills.join(' · ')}</div></Section>
        </div>
      );
      case 'Serif Classic': return (
        <div style={{ fontFamily: '"Georgia", serif' }}>
          <div style={{ fontSize: 26, fontWeight: 400, color: '#111', letterSpacing: '-0.01em' }}>{data.name}</div>
          <div style={{ fontSize: 11, fontStyle: 'italic', color: t.accent, marginTop: 2, marginBottom: 2 }}>{data.title}</div>
          <div style={{ fontSize: 9, color: '#666', marginBottom: 12 }}>{data.email} — {data.phone} — {data.location}</div>
          <Section title="Summary" accent={t.accent}><div style={{ fontSize: 10, lineHeight: 1.65, color: '#333', fontStyle: 'italic' }}>{data.summary}</div></Section>
          <Section title="Experience" accent={t.accent}>{data.experience.map((e, i) => <ExpItem key={i} e={e} serif />)}</Section>
          <Section title="Skills" accent={t.accent}><div style={{ fontSize: 9.5, color: '#333' }}>{data.skills.join(', ')}</div></Section>
        </div>
      );
      case 'Modern Grid': return (
        <div style={{ display: 'grid', gridTemplateColumns: '35% 65%', gap: 12 }}>
          <div style={{ background: t.accent, color: '#fff', padding: 12, margin: -14, marginRight: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{data.name}</div>
            <div style={{ fontSize: 9, opacity: 0.85, marginTop: 4 }}>{data.title}</div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,.3)', marginTop: 14, paddingTop: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Contact</div>
              <div style={{ fontSize: 8.5, lineHeight: 1.7 }}><div>{data.email}</div><div>{data.phone}</div><div>{data.location}</div></div>
            </div>
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Skills</div>
              <div style={{ fontSize: 8.5, lineHeight: 1.7 }}>{data.skills.map(s => <div key={s}>{s}</div>)}</div>
            </div>
          </div>
          <div style={{ paddingLeft: 4 }}>
            <Section title="Summary" accent={t.accent}><div style={{ fontSize: 9.5, lineHeight: 1.55, color: '#333' }}>{data.summary}</div></Section>
            <Section title="Experience" accent={t.accent}>{data.experience.map((e, i) => <ExpItem key={i} e={e} />)}</Section>
          </div>
        </div>
      );
      case 'Monospace': return (
        <div style={{ fontFamily: '"JetBrains Mono", monospace' }}>
          <div style={{ fontSize: 11, color: '#666' }}># {data.title}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#111', marginTop: 2 }}>{data.name}</div>
          <div style={{ fontSize: 9, color: '#666', marginTop: 6, marginBottom: 12 }}>{data.email} / {data.phone} / {data.location}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: t.accent, marginBottom: 4 }}>// summary</div>
          <div style={{ fontSize: 9.5, lineHeight: 1.6, color: '#222', marginBottom: 14 }}>{data.summary}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: t.accent, marginBottom: 4 }}>// experience</div>
          {data.experience.map((e, i) => <ExpItem key={i} e={e} mono />)}
          <div style={{ fontSize: 10, fontWeight: 700, color: t.accent, marginTop: 8, marginBottom: 4 }}>// skills</div>
          <div style={{ fontSize: 9, color: '#222' }}>[{data.skills.map(s => `"${s}"`).join(', ')}]</div>
        </div>
      );
      case 'Minimal': return (
        <div>
          <div style={{ fontSize: 30, fontWeight: 300, color: '#111', letterSpacing: '-0.02em' }}>{data.name}</div>
          <div style={{ fontSize: 10.5, color: '#666', marginTop: 2, marginBottom: 2 }}>{data.title}</div>
          <div style={{ fontSize: 9, color: '#999', marginBottom: 18 }}>{data.email} · {data.phone} · {data.location}</div>
          <div style={{ fontSize: 9.5, lineHeight: 1.7, color: '#444', marginBottom: 18 }}>{data.summary}</div>
          <div style={{ fontSize: 10, fontWeight: 500, color: '#111', marginBottom: 6 }}>Experience</div>
          {data.experience.map((e, i) => <ExpItem key={i} e={e} minimal />)}
          <div style={{ fontSize: 10, fontWeight: 500, color: '#111', marginTop: 12, marginBottom: 4 }}>Skills</div>
          <div style={{ fontSize: 9, color: '#666' }}>{data.skills.join(' / ')}</div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div style={{ background: '#fff', color: '#111', width: 612, minHeight: 792, padding: 36, boxShadow: '0 12px 40px rgba(0,0,0,.08)', transform: `scale(${scale})`, transformOrigin: 'top center', borderRadius: 2 }}>
      {renderBody()}
    </div>
  );
}
