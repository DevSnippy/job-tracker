'use client';
import { useState } from 'react';
import AppShell from '@/components/AppShell';
import Topbar from '@/components/Topbar';
import Icon from '@/components/ui/Icon';

export default function ProfilePage() {
  const [saving, setSaving] = useState(false);

  const save = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 900);
  };

  return (
    <AppShell>
      <div className="page">
        <Topbar crumbs={['Account', 'My Profile']} actions={
          <button className="btn primary" onClick={save}>{saving ? 'Saving…' : 'Save changes'}</button>
        } />
        <div className="page-body" style={{ padding: 22, maxWidth: 900 }}>
          <div className="panel" style={{ padding: 18 }}>
            <div className="row" style={{ gap: 14 }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent), oklch(65% 0.15 calc(var(--accent-h) + 50)))', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 24 }}>YL</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 600 }}>Yonatan Levi</div>
                <div className="muted">Senior Frontend Engineer · Tel Aviv, IL</div>
              </div>
              <button className="btn ghost"><Icon name="upload" size={12} /> Change photo</button>
            </div>
          </div>

          <div className="panel" style={{ padding: 18, marginTop: 14 }}>
            <h4 className="section-title">Personal info</h4>
            <div className="form-grid">
              <div className="field"><label className="field-label">Full name</label><input className="input" defaultValue="Yonatan Levi" /></div>
              <div className="field"><label className="field-label">Headline</label><input className="input" defaultValue="Senior Frontend Engineer" /></div>
              <div className="field"><label className="field-label">Email</label><input className="input" defaultValue="yonatan@pm.me" /></div>
              <div className="field"><label className="field-label">Phone</label><input className="input" defaultValue="+972 54-123-4567" /></div>
              <div className="field"><label className="field-label">Location</label><input className="input" defaultValue="Tel Aviv, IL" /></div>
              <div className="field"><label className="field-label">Website / portfolio</label><input className="input" defaultValue="yonatan.dev" /></div>
              <div className="field"><label className="field-label">LinkedIn</label><input className="input" defaultValue="linkedin.com/in/yonatanlevi" /></div>
              <div className="field"><label className="field-label">GitHub</label><input className="input" defaultValue="github.com/yonatanl" /></div>
            </div>
          </div>

          <div className="panel" style={{ padding: 18, marginTop: 14 }}>
            <h4 className="section-title">Skills & experience summary</h4>
            <div className="field">
              <label className="field-label">One-line pitch</label>
              <input className="input" defaultValue="Senior FE engineer shipping data-dense B2B consoles." />
            </div>
            <div className="field">
              <label className="field-label">Summary</label>
              <textarea className="input" rows={5} defaultValue="7+ years building data-dense B2B consoles. Owned design systems, rebuilt perf-critical tables, and mentored mid-level ICs. Looking for staff-track frontend work at a product-focused company." />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Skills</label>
              <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                {['React','TypeScript','Node.js','GraphQL','Design Systems','Perf','Accessibility','Figma','CSS','Testing'].map(s => (
                  <span key={s} className="chip chip-accent">{s} <Icon name="close" size={10} /></span>
                ))}
                <button className="chip" style={{ cursor: 'pointer', color: 'var(--text-3)' }}><Icon name="plus" size={10} /> Add skill</button>
              </div>
            </div>
          </div>

          <div className="panel" style={{ padding: 18, marginTop: 14 }}>
            <h4 className="section-title">Connected accounts</h4>
            <div className="stack-sm">
              {[
                { n: 'GitHub', sub: 'github.com/yonatanl', connected: true, icon: 'github' },
                { n: 'Google', sub: 'yonatan@gmail.com', connected: true, icon: 'mail' },
                { n: 'LinkedIn', sub: 'Not connected', connected: false, icon: 'link' },
              ].map(a => (
                <div key={a.n} className="row" style={{ padding: '8px 0', borderTop: '1px solid var(--border)', gap: 10 }}>
                  <Icon name={a.icon} size={16} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{a.n}</div>
                    <div className="muted" style={{ fontSize: 11.5 }}>{a.sub}</div>
                  </div>
                  <button className={`btn sm${a.connected ? ' ghost' : ''}`}>{a.connected ? 'Disconnect' : 'Connect'}</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
