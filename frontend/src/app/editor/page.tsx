'use client';
import { useState } from 'react';
import AppShell from '@/components/AppShell';
import Topbar from '@/components/Topbar';
import Icon from '@/components/ui/Icon';
import ResumePreview from '@/components/resumes/ResumePreview';
import { TEMPLATES, DEFAULT_RESUME_DATA } from '@/lib/data';
import type { ResumeData, Template } from '@/lib/types';

export default function EditorPage() {
  const [template, setTemplate] = useState<Template>(TEMPLATES[0]);
  const [data, setData] = useState<ResumeData>(DEFAULT_RESUME_DATA);
  const [tab, setTab] = useState('basics');

  const update = (k: keyof ResumeData, v: string | string[]) => setData(d => ({ ...d, [k]: v }));
  const updateExp = (i: number, k: string, v: string | string[]) =>
    setData(d => ({ ...d, experience: d.experience.map((e, idx) => idx === i ? { ...e, [k]: v } : e) }));

  return (
    <AppShell>
      <div className="page">
        <Topbar crumbs={['Documents', 'Resume Editor']} actions={
          <>
            <button className="btn ghost"><Icon name="sparkle" /> Tailor with Claude</button>
            <button className="btn"><Icon name="eye" /> Preview</button>
            <button className="btn primary"><Icon name="download" /> Export PDF</button>
          </>
        } />

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '420px 1fr', minHeight: 0, overflow: 'hidden' }}>
          <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--surface)' }}>
            <div className="tabs">
              {['basics','experience','skills','templates'].map(t => (
                <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div style={{ padding: 16, overflow: 'auto', flex: 1 }}>
              {tab === 'basics' && (
                <>
                  <div className="form-grid">
                    <div className="field"><label className="field-label">Full name</label><input className="input" value={data.name} onChange={e => update('name', e.target.value)} /></div>
                    <div className="field"><label className="field-label">Title</label><input className="input" value={data.title} onChange={e => update('title', e.target.value)} /></div>
                    <div className="field"><label className="field-label">Email</label><input className="input" value={data.email} onChange={e => update('email', e.target.value)} /></div>
                    <div className="field"><label className="field-label">Phone</label><input className="input" value={data.phone} onChange={e => update('phone', e.target.value)} /></div>
                    <div className="field" style={{ gridColumn: '1 / -1' }}><label className="field-label">Location</label><input className="input" value={data.location} onChange={e => update('location', e.target.value)} /></div>
                  </div>
                  <div className="field">
                    <label className="field-label">Summary</label>
                    <textarea className="input" rows={5} value={data.summary} onChange={e => update('summary', e.target.value)} />
                  </div>
                </>
              )}
              {tab === 'experience' && (
                <div className="stack-sm">
                  {data.experience.map((e, i) => (
                    <div key={i} className="panel" style={{ padding: 12 }}>
                      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                        <span className="mono-strong">#{i + 1}</span>
                        <div className="row" style={{ gap: 2 }}>
                          <button className="icon-btn"><Icon name="copy" size={12} /></button>
                          <button className="icon-btn"><Icon name="trash" size={12} /></button>
                        </div>
                      </div>
                      <div className="form-grid">
                        <div className="field"><label className="field-label">Role</label><input className="input" value={e.role} onChange={ev => updateExp(i, 'role', ev.target.value)} /></div>
                        <div className="field"><label className="field-label">Company</label><input className="input" value={e.company} onChange={ev => updateExp(i, 'company', ev.target.value)} /></div>
                        <div className="field"><label className="field-label">Location</label><input className="input" value={e.loc} onChange={ev => updateExp(i, 'loc', ev.target.value)} /></div>
                        <div className="field"><label className="field-label">Dates</label><input className="input" value={e.when} onChange={ev => updateExp(i, 'when', ev.target.value)} /></div>
                      </div>
                      <div className="field" style={{ marginBottom: 0 }}>
                        <label className="field-label">Bullets (one per line)</label>
                        <textarea className="input" rows={4} value={e.bullets.join('\n')} onChange={ev => updateExp(i, 'bullets', ev.target.value.split('\n'))} />
                      </div>
                    </div>
                  ))}
                  <button className="btn ghost"><Icon name="plus" size={12} /> Add experience</button>
                </div>
              )}
              {tab === 'skills' && (
                <div>
                  <label className="field-label">Skills (comma-separated)</label>
                  <textarea className="input" rows={4} value={data.skills.join(', ')} onChange={e => update('skills', e.target.value.split(',').map(s => s.trim()))} />
                  <div className="row" style={{ gap: 4, flexWrap: 'wrap', marginTop: 10 }}>
                    {data.skills.map(s => <span key={s} className="chip chip-accent">{s}</span>)}
                  </div>
                </div>
              )}
              {tab === 'templates' && (
                <div className="template-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  {TEMPLATES.map(t => (
                    <div key={t.id} className={`template-card${template.id === t.id ? ' selected' : ''}`} onClick={() => setTemplate(t)}>
                      <div className="preview">
                        <div style={{ transform: 'scale(0.28)', transformOrigin: 'top left', pointerEvents: 'none' }}>
                          <ResumePreview template={t} data={data} />
                        </div>
                      </div>
                      <div className="tmeta">
                        <div><div className="tname">{t.name}</div><div className="tstyle">{t.style}</div></div>
                        {template.id === t.id && <Icon name="check" size={14} />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ background: 'var(--surface-2)', overflow: 'auto', padding: 30, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
            <div style={{ transform: 'scale(0.82)', transformOrigin: 'top center' }}>
              <ResumePreview template={template} data={data} />
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
