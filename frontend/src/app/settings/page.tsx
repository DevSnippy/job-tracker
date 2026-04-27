'use client';
import { useState } from 'react';
import AppShell from '@/components/AppShell';
import Topbar from '@/components/Topbar';
import Icon from '@/components/ui/Icon';

const SOURCES = [
  { n: 'techmap (mluggy/techmap)', sub: 'GitHub-backed job feed — syncs daily via Lever', on: true },
  { n: 'LinkedIn Jobs', sub: 'Chrome extension required', on: false },
];

const NOTIFICATIONS = [
  { n: 'New jobs matching your filters', on: true },
  { n: 'Interview reminders (24h before)', on: true },
  { n: 'Webhook failures', on: true },
  { n: 'Weekly summary email', on: false },
];

export default function SettingsPage() {
  const [sources, setSources] = useState(SOURCES);
  const [notifs, setNotifs] = useState(NOTIFICATIONS);

  const toggleSource = (i: number) => setSources(s => s.map((x, idx) => idx === i ? { ...x, on: !x.on } : x));
  const toggleNotif = (i: number) => setNotifs(s => s.map((x, idx) => idx === i ? { ...x, on: !x.on } : x));

  return (
    <AppShell>
      <div className="page">
        <Topbar crumbs={['Account', 'Settings']} />
        <div className="page-body" style={{ padding: 22, maxWidth: 820 }}>
          <div className="panel" style={{ padding: 18, marginBottom: 14 }}>
            <h4 className="section-title">Sync &amp; sources</h4>
            {sources.map((s, i) => (
              <div key={s.n} className="row" style={{ gap: 10, padding: '10px 0', borderTop: i ? '1px solid var(--border)' : undefined }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500 }}>{s.n}</div>
                  <div className="muted" style={{ fontSize: 11.5 }}>{s.sub}</div>
                </div>
                <div className={`switch${s.on ? ' on' : ''}`} onClick={() => toggleSource(i)} />
              </div>
            ))}
          </div>

          <div className="panel" style={{ padding: 18, marginBottom: 14 }}>
            <h4 className="section-title">Notifications</h4>
            {notifs.map((s, i) => (
              <div key={s.n} className="row" style={{ gap: 10, padding: '10px 0', borderTop: i ? '1px solid var(--border)' : undefined }}>
                <div style={{ flex: 1 }}>{s.n}</div>
                <div className={`switch${s.on ? ' on' : ''}`} onClick={() => toggleNotif(i)} />
              </div>
            ))}
          </div>

          <div className="panel" style={{ padding: 18, marginBottom: 14 }}>
            <h4 className="section-title">Appearance</h4>
            <div className="row" style={{ gap: 10, padding: '10px 0' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>Dark mode</div>
                <div className="muted" style={{ fontSize: 11.5 }}>Default on — toggle via sidebar footer</div>
              </div>
            </div>
            <div className="row" style={{ gap: 10, padding: '10px 0', borderTop: '1px solid var(--border)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>Accent color</div>
                <div className="muted" style={{ fontSize: 11.5 }}>Pick a hue for highlights and chips</div>
              </div>
              <div className="row" style={{ gap: 6 }}>
                {[
                  { label: 'Blue', h: 250 },
                  { label: 'Purple', h: 290 },
                  { label: 'Green', h: 150 },
                  { label: 'Rose', h: 10 },
                ].map(c => (
                  <div
                    key={c.h}
                    onClick={() => document.documentElement.style.setProperty('--accent-h', String(c.h))}
                    style={{ width: 20, height: 20, borderRadius: '50%', background: `oklch(60% 0.18 ${c.h})`, cursor: 'pointer', border: '2px solid transparent' }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="panel" style={{ padding: 18, marginBottom: 14 }}>
            <h4 className="section-title">API keys</h4>
            <div className="field" style={{ marginBottom: 10 }}>
              <label className="field-label">Anthropic API key</label>
              <input className="input mono" type="password" placeholder="sk-ant-…" defaultValue="sk-ant-••••••••••••••••" />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">OpenAI API key (optional)</label>
              <input className="input mono" type="password" placeholder="sk-…" />
            </div>
          </div>

          <div className="panel" style={{ padding: 18 }}>
            <h4 className="section-title">Data &amp; privacy</h4>
            <div className="stack-sm">
              <button className="btn"><Icon name="download" size={12} /> Export all data (JSON)</button>
              <button className="btn" style={{ color: 'var(--danger, #e53e3e)', borderColor: 'var(--danger, #e53e3e)' }}>
                <Icon name="trash" size={12} /> Delete account
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
