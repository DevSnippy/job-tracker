'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import Topbar from '@/components/Topbar';
import Icon from '@/components/ui/Icon';
import { WEBHOOK_EVENTS } from '@/lib/data';
import { api } from '@/lib/api';
import type { WebhookAPI } from '@/lib/api';

export default function IntegrationsPage() {
  const [hooks, setHooks] = useState<WebhookAPI[]>([]);
  const [testing, setTesting] = useState<string | null>(null);
  const [lastTest, setLastTest] = useState<{ id: string; ok: boolean } | null>(null);
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [newEvent, setNewEvent] = useState('job.applied');

  useEffect(() => {
    api.webhooks.list().then(setHooks).catch(() => {});
  }, []);

  const toggle = (id: string) => {
    const hook = hooks.find(h => h.id === id);
    if (!hook) return;
    api.webhooks.update(id, { active: !hook.active })
      .then(updated => setHooks(hs => hs.map(h => h.id === id ? updated : h)))
      .catch(() => {});
  };

  const test = (id: string) => {
    setTesting(id);
    setLastTest(null);
    api.webhooks.test(id)
      .then(updated => {
        setTesting(null);
        setLastTest({ id, ok: updated.status !== 'error' });
        setHooks(hs => hs.map(h => h.id === id ? updated : h));
      })
      .catch(() => setTesting(null));
  };

  const deleteHook = (id: string) => {
    api.webhooks.delete(id)
      .then(() => setHooks(hs => hs.filter(h => h.id !== id)))
      .catch(() => {});
  };

  const add = () => {
    if (!newUrl || !newName) return;
    api.webhooks.create({ name: newName, url: newUrl, events: [newEvent], active: true })
      .then(wh => { setHooks(hs => [wh, ...hs]); setNewName(''); setNewUrl(''); })
      .catch(() => {});
  };

  return (
    <AppShell>
      <div className="page">
        <Topbar crumbs={['Account', 'Integrations']} actions={
          <>
            <button className="btn ghost"><Icon name="external" size={12} /> n8n docs</button>
            <button className="btn primary"><Icon name="plus" /> New webhook</button>
          </>
        } />

        <div className="page-body" style={{ padding: 22, maxWidth: 1000 }}>
          <div className="panel" style={{ padding: 16, marginBottom: 14 }}>
            <div className="row" style={{ gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EA4B71', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700 }}>n8</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>n8n Webhooks</div>
                <div className="muted" style={{ fontSize: 12 }}>Fire a POST to any n8n webhook URL when events happen in Job Tracker. Payload is JSON with the job, resume, and event type.</div>
              </div>
              <span className={`chip${hooks.filter(h => h.active).length ? ' chip-success' : ''} dot`}>{hooks.filter(h => h.active).length} active</span>
            </div>
          </div>

          <div className="panel" style={{ marginBottom: 14 }}>
            <div className="panel-header">Add webhook <span className="subtitle">single POST URL from n8n</span></div>
            <div style={{ padding: 14 }}>
              <div className="form-grid">
                <div className="field">
                  <label className="field-label">Label</label>
                  <input className="input" placeholder="e.g. Notion DB logger" value={newName} onChange={e => setNewName(e.target.value)} />
                </div>
                <div className="field">
                  <label className="field-label">Trigger on</label>
                  <select className="input" value={newEvent} onChange={e => setNewEvent(e.target.value)}>
                    {WEBHOOK_EVENTS.map(ev => <option key={ev} value={ev}>{ev}</option>)}
                    <option value="*">All events</option>
                  </select>
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label className="field-label">n8n webhook URL</label>
                  <div className="row" style={{ gap: 6 }}>
                    <input className="input mono" placeholder="https://n8n.yourdomain.com/webhook/…" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
                    <button className="btn" onClick={add}><Icon name="plus" size={12} /> Add</button>
                    <button className="btn ghost" onClick={() => { setNewUrl('https://n8n.example.com/webhook/sandbox-test'); setNewName('Test webhook'); }}><Icon name="play" size={12} /> Fill test</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">Connected webhooks <span className="subtitle">{hooks.length} total</span></div>
            <table className="data">
              <thead>
                <tr>
                  <th style={{ width: 42 }}></th>
                  <th>Name</th><th>Events</th><th>URL</th><th>Last fired</th><th>Status</th>
                  <th style={{ textAlign: 'right', width: 180 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {hooks.map(h => (
                  <tr key={h.id}>
                    <td><div className={`switch${h.active ? ' on' : ''}`} onClick={() => toggle(h.id)} /></td>
                    <td style={{ fontWeight: 500 }}>{h.name}</td>
                    <td><span className="row" style={{ gap: 3 }}>{h.events.map(e => <span key={e} className="chip mono">{e}</span>)}</span></td>
                    <td className="mono-strong" style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.url}</td>
                    <td className="muted">{h.last_fired}</td>
                    <td>
                      {h.status === 'active' && <span className="chip chip-success dot">OK</span>}
                      {h.status === 'error' && <span className="chip chip-danger dot">error</span>}
                      {h.status === 'untested' && <span className="chip chip-warn dot">untested</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="row" style={{ gap: 4, justifyContent: 'flex-end' }}>
                        <button className="btn sm" onClick={() => test(h.id)} disabled={testing === h.id}>
                          {testing === h.id ? 'Testing…' : <><Icon name="play" size={12} /> Test</>}
                        </button>
                        <button className="icon-btn" onClick={() => navigator.clipboard.writeText(h.url).catch(() => {})}><Icon name="copy" size={12} /></button>
                        <button className="icon-btn" onClick={() => deleteHook(h.id)}><Icon name="trash" size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {lastTest && (
            <div className="panel" style={{ marginTop: 14, padding: 14 }}>
              <div className="row" style={{ gap: 8, marginBottom: 10 }}>
                {lastTest.ok
                  ? <span className="chip chip-success dot">OK</span>
                  : <span className="chip chip-danger dot">Failed</span>}
                <span className="muted">· test payload delivered</span>
              </div>
              <pre className="mono" style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 6, margin: 0, overflow: 'auto', fontSize: 11 }}>
{`POST ${hooks.find(h => h.id === lastTest.id)?.url}
Content-Type: application/json
X-JobTracker-Event: job.applied

{
  "event": "job.applied",
  "timestamp": "${new Date().toISOString()}",
  "job": { "id": "TM-8421", "company": "Wiz", "role": "Senior Frontend Engineer" },
  "resume": { "id": "r1", "name": "Senior Frontend — General.pdf" },
  "user": { "email": "yonatan@pm.me" }
}`}
              </pre>
            </div>
          )}

          <div className="panel" style={{ marginTop: 14, padding: 14 }}>
            <h4 className="section-title">Python backend</h4>
            <div className="row" style={{ gap: 10 }}>
              <span className="chip chip-success dot">connected</span>
              <span className="mono-strong">techmap.py · v0.3.1</span>
              <span className="muted" style={{ flex: 1 }}>pulling from mluggy/techmap · last sync 4m ago</span>
              <button className="btn sm ghost"><Icon name="refresh" size={12} /> Sync now</button>
              <button className="btn sm ghost"><Icon name="github" size={12} /> Source</button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
