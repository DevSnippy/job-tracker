'use client';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Topbar from '@/components/Topbar';
import Icon from '@/components/ui/Icon';
import ResumePreview from '@/components/resumes/ResumePreview';
import { TEMPLATES, DEFAULT_RESUME_DATA } from '@/lib/data';
import { api } from '@/lib/api';
import type { ResumeData, Template, EducationItem } from '@/lib/types';

type SaveState = 'saved' | 'saving' | 'unsaved' | 'error';

function EditorInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const resumeId = searchParams.get('id');

  const [template, setTemplate] = useState<Template>(TEMPLATES[0]);
  const [data, setData] = useState<ResumeData>(DEFAULT_RESUME_DATA);
  const [tab, setTab] = useState('basics');
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [resumeName, setResumeName] = useState('Resume Editor');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!resumeId) return;
    api.resumes.get(resumeId).then(async r => {
      setResumeName(r.name ?? '');
      const t = TEMPLATES.find(t => t.name === r.template) ?? TEMPLATES[0];
      setTemplate(t);
      const rd = r.resume_data as Partial<ResumeData>;
      if (rd && Object.keys(rd).length > 0) {
        setData(prev => ({
          name: rd.name ?? prev.name,
          title: rd.title ?? prev.title,
          email: rd.email ?? prev.email,
          phone: rd.phone ?? prev.phone,
          location: rd.location ?? prev.location,
          summary: rd.summary ?? prev.summary,
          skills: rd.skills ?? prev.skills,
          experience: rd.experience
            ? rd.experience.map(e => ({
                role: e.role ?? '',
                company: e.company ?? '',
                loc: e.loc ?? '',
                when: e.when ?? '',
                bullets: (e.bullets ?? []).map(b => b ?? ''),
              }))
            : prev.experience,
          education: rd.education
            ? rd.education.map((e: Partial<EducationItem>) => ({
                degree: e.degree ?? '',
                school: e.school ?? '',
                loc: e.loc ?? '',
                when: e.when ?? '',
              }))
            : prev.education,
          links: rd.links ?? prev.links ?? [],
        }));
      } else {
        // New resume — seed from user profile so no fake data appears
        const profile = await api.user.get().catch(() => null);
        if (profile) {
          setData({
            name: profile.name ?? '',
            title: profile.headline ?? '',
            email: profile.email ?? '',
            phone: profile.phone ?? '',
            location: profile.location ?? '',
            summary: profile.summary ?? '',
            skills: profile.skills ?? [],
            experience: (profile.experience ?? []).map(e => ({
              role: e.role ?? '',
              company: e.company ?? '',
              loc: e.loc ?? '',
              when: e.when ?? '',
              bullets: (e.bullets ?? []).map(b => b ?? ''),
            })),
            education: (profile.education ?? []).map(e => ({
              degree: e.degree ?? '',
              school: e.school ?? '',
              loc: e.loc ?? '',
              when: e.when ?? '',
            })),
            links: [
              ...(profile.linkedin_url  ? [{ label: 'LinkedIn',  url: profile.linkedin_url  }] : []),
              ...(profile.website_url   ? [{ label: 'Website',   url: profile.website_url   }] : []),
              ...(profile.portfolio_url ? [{ label: 'Portfolio', url: profile.portfolio_url }] : []),
            ],
          });
        }
      }
    }).catch(() => {});
  }, [resumeId]);

  const save = useCallback((d: ResumeData, t: Template) => {
    if (!resumeId) return;
    setSaveState('saving');
    api.resumes.update(resumeId, { template: t.name, resume_data: d as object })
      .then(() => setSaveState('saved'))
      .catch(() => setSaveState('error'));
  }, [resumeId]);

  const scheduleAutosave = useCallback((d: ResumeData, t: Template) => {
    if (!resumeId) return;
    setSaveState('unsaved');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(d, t), 800);
  }, [resumeId, save]);

  const update = (k: keyof ResumeData, v: ResumeData[typeof k]) => {
    setData(d => {
      const next = { ...d, [k]: v };
      scheduleAutosave(next, template);
      return next;
    });
  };

  const updateExp = (i: number, k: string, v: string | string[]) => {
    setData(d => {
      const next = { ...d, experience: d.experience.map((e, idx) => idx === i ? { ...e, [k]: v } : e) };
      scheduleAutosave(next, template);
      return next;
    });
  };

  const addExp = () => {
    setData(d => {
      const next = { ...d, experience: [...d.experience, { role: '', company: '', loc: '', when: '', bullets: [''] }] };
      scheduleAutosave(next, template);
      return next;
    });
  };

  const updateEdu = (i: number, k: keyof EducationItem, v: string) => {
    setData(d => {
      const next = { ...d, education: (d.education ?? []).map((e, idx) => idx === i ? { ...e, [k]: v } : e) };
      scheduleAutosave(next, template);
      return next;
    });
  };

  const addEdu = () => {
    setData(d => {
      const next = { ...d, education: [...(d.education ?? []), { degree: '', school: '', loc: '', when: '' }] };
      scheduleAutosave(next, template);
      return next;
    });
  };

  const deleteEdu = (i: number) => {
    setData(d => {
      const next = { ...d, education: (d.education ?? []).filter((_, idx) => idx !== i) };
      scheduleAutosave(next, template);
      return next;
    });
  };

  const copyExp = (i: number) => {
    setData(d => {
      const src = d.experience[i];
      const copy = { ...src, role: src.role + ' (copy)', bullets: [...src.bullets] };
      const exp = [...d.experience.slice(0, i + 1), copy, ...d.experience.slice(i + 1)];
      const next = { ...d, experience: exp };
      scheduleAutosave(next, template);
      return next;
    });
  };

  const deleteExp = (i: number) => {
    setData(d => {
      const next = { ...d, experience: d.experience.filter((_, idx) => idx !== i) };
      scheduleAutosave(next, template);
      return next;
    });
  };

  const changeTemplate = (t: Template) => {
    setTemplate(t);
    scheduleAutosave(data, t);
  };

  const exportPDF = () => {
    const el = printRef.current;
    if (!el) return;
    const win = window.open('', '_blank');
    if (!win) return;
    // ResumePreview is 612px wide = 6.375in at 96dpi. Letter = 8.5in.
    // zoom: 1.3333 scales 612px → 816px to fill the full letter width.
    win.document.write(`<!doctype html><html><head><title>${data.name ? `${data.name} - Resume` : resumeName}</title>
      <style>
        *{box-sizing:border-box}
        @page{margin:0;size:letter}
        html,body{margin:0;padding:0;background:#fff}
        body{zoom:1.3333;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      </style>
    </head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 250);
  };

  const saveLabel = { saved: 'Saved', saving: 'Saving…', unsaved: 'Unsaved changes', error: 'Save failed' }[saveState];
  const saveColor = saveState === 'error' ? 'var(--danger)' : saveState === 'unsaved' ? 'var(--warn)' : 'var(--text-2)';

  return (
    <AppShell>
      <div className="page">
        <Topbar crumbs={['Documents', 'Resumes', resumeName]} actions={
          <>
            {resumeId && (
              <span style={{ fontSize: 11, fontWeight: 500, color: saveColor }}>{saveLabel}</span>
            )}
            <button className="btn ghost" onClick={() => router.push('/resumes')}>
              <Icon name="arrowLeft" size={12} /> All resumes
            </button>
            <button className="btn primary" onClick={exportPDF} title={data.name ? `${data.name} - Resume.pdf` : undefined}>
              <Icon name="download" /> Export PDF
              {data.name && <span style={{ fontSize: 10.5, opacity: 0.75, marginLeft: 4, fontWeight: 400 }}>{data.name} - Resume</span>}
            </button>
          </>
        } />

        {/* off-screen 1:1 scale copy for PDF export */}
        <div ref={printRef} style={{ position: 'absolute', left: -9999, top: 0, pointerEvents: 'none', visibility: 'hidden' }}>
          <ResumePreview template={template} data={data} />
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '420px 1fr', minHeight: 0, overflow: 'hidden' }}>
          <div style={{ borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--surface)' }}>
            <div className="tabs">
              {['basics', 'experience', 'education', 'skills', 'templates'].map(t => (
                <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div style={{ padding: 16, overflow: 'auto', flex: 1 }}>

              {tab === 'basics' && (
                <>
                  <div className="form-grid">
                    <div className="field">
                      <label className="field-label">Full name</label>
                      <input className="input" value={data.name} onChange={e => update('name', e.target.value)} />
                    </div>
                    <div className="field">
                      <label className="field-label">Title</label>
                      <input className="input" value={data.title} onChange={e => update('title', e.target.value)} />
                    </div>
                    <div className="field">
                      <label className="field-label">Email</label>
                      <input className="input" value={data.email} onChange={e => update('email', e.target.value)} />
                    </div>
                    <div className="field">
                      <label className="field-label">Phone</label>
                      <input className="input" value={data.phone} onChange={e => update('phone', e.target.value)} />
                    </div>
                    <div className="field" style={{ gridColumn: '1 / -1' }}>
                      <label className="field-label">Location</label>
                      <input className="input" value={data.location} onChange={e => update('location', e.target.value)} />
                    </div>
                  </div>
                  <div className="field">
                    <label className="field-label">Summary</label>
                    <textarea className="input" rows={5} value={data.summary} onChange={e => update('summary', e.target.value)} />
                  </div>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                      <label className="field-label" style={{ marginBottom: 0 }}>Links</label>
                      <button className="btn sm ghost" onClick={() => update('links', [...(data.links ?? []), { label: 'LinkedIn', url: '' }])}>
                        <Icon name="plus" size={11} /> Add link
                      </button>
                    </div>
                    {(data.links ?? []).map((link, i) => (
                      <div key={i} className="row" style={{ gap: 6, marginBottom: 6 }}>
                        <select className="input" style={{ width: 110, flexShrink: 0, fontSize: 12 }}
                          value={link.label}
                          onChange={e => update('links', (data.links ?? []).map((l, idx) => idx === i ? { ...l, label: e.target.value } : l))}>
                          {['LinkedIn', 'GitHub', 'Website', 'Portfolio', 'Twitter', 'Other'].map(o => <option key={o}>{o}</option>)}
                        </select>
                        <input className="input" style={{ flex: 1 }} value={link.url} placeholder="https://…"
                          onChange={e => update('links', (data.links ?? []).map((l, idx) => idx === i ? { ...l, url: e.target.value } : l))} />
                        <button className="icon-btn" onClick={() => update('links', (data.links ?? []).filter((_, idx) => idx !== i))}>
                          <Icon name="close" size={11} />
                        </button>
                      </div>
                    ))}
                    {(data.links ?? []).length === 0 && (
                      <div className="muted" style={{ fontSize: 11.5 }}>Add LinkedIn, GitHub, portfolio… they'll appear in the resume header.</div>
                    )}
                  </div>
                </>
              )}

              {tab === 'experience' && (
                <div className="stack-sm">
                  {data.experience.map((e, i) => (
                    <div key={i} className="panel" style={{ padding: 12 }}>
                      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                        <span className="mono-strong" style={{ fontSize: 11 }}>#{i + 1} {e.company || e.role || 'New entry'}</span>
                        <div className="row" style={{ gap: 2 }}>
                          <button className="icon-btn" title="Duplicate" onClick={() => copyExp(i)}>
                            <Icon name="copy" size={12} />
                          </button>
                          <button className="icon-btn" title="Delete" onClick={() => deleteExp(i)}>
                            <Icon name="trash" size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="form-grid">
                        <div className="field">
                          <label className="field-label">Role</label>
                          <input className="input" value={e.role} onChange={ev => updateExp(i, 'role', ev.target.value)} />
                        </div>
                        <div className="field">
                          <label className="field-label">Company</label>
                          <input className="input" value={e.company} onChange={ev => updateExp(i, 'company', ev.target.value)} />
                        </div>
                        <div className="field">
                          <label className="field-label">Location</label>
                          <input className="input" value={e.loc} onChange={ev => updateExp(i, 'loc', ev.target.value)} />
                        </div>
                        <div className="field">
                          <label className="field-label">Dates</label>
                          <input className="input" value={e.when} onChange={ev => updateExp(i, 'when', ev.target.value)} />
                        </div>
                      </div>
                      <div className="field" style={{ marginBottom: 0 }}>
                        <label className="field-label">Bullets (one per line)</label>
                        <textarea
                          className="input"
                          rows={4}
                          value={e.bullets.join('\n')}
                          onChange={ev => updateExp(i, 'bullets', ev.target.value.split('\n'))}
                        />
                      </div>
                    </div>
                  ))}
                  <button className="btn ghost" style={{ width: '100%' }} onClick={addExp}>
                    <Icon name="plus" size={12} /> Add experience
                  </button>
                </div>
              )}

              {tab === 'education' && (
                <div className="stack-sm">
                  {(data.education ?? []).map((e, i) => (
                    <div key={i} className="panel" style={{ padding: 12 }}>
                      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                        <span className="mono-strong" style={{ fontSize: 11 }}>#{i + 1} {e.school || e.degree || 'New entry'}</span>
                        <button className="icon-btn" title="Delete" onClick={() => deleteEdu(i)}>
                          <Icon name="trash" size={12} />
                        </button>
                      </div>
                      <div className="form-grid">
                        <div className="field">
                          <label className="field-label">Degree / Qualification</label>
                          <input className="input" value={e.degree} onChange={ev => updateEdu(i, 'degree', ev.target.value)} placeholder="B.Sc. Computer Science" />
                        </div>
                        <div className="field">
                          <label className="field-label">School / University</label>
                          <input className="input" value={e.school} onChange={ev => updateEdu(i, 'school', ev.target.value)} placeholder="Tel Aviv University" />
                        </div>
                        <div className="field">
                          <label className="field-label">Location</label>
                          <input className="input" value={e.loc} onChange={ev => updateEdu(i, 'loc', ev.target.value)} placeholder="Tel Aviv" />
                        </div>
                        <div className="field">
                          <label className="field-label">Dates</label>
                          <input className="input" value={e.when} onChange={ev => updateEdu(i, 'when', ev.target.value)} placeholder="2013 — 2017" />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="btn ghost" style={{ width: '100%' }} onClick={addEdu}>
                    <Icon name="plus" size={12} /> Add education
                  </button>
                </div>
              )}

              {tab === 'skills' && (
                <div>
                  <label className="field-label">Skills (comma-separated)</label>
                  <textarea
                    className="input"
                    rows={4}
                    value={data.skills.join(', ')}
                    onChange={e => update('skills', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  />
                  <div className="row" style={{ gap: 4, flexWrap: 'wrap', marginTop: 10 }}>
                    {data.skills.map(s => <span key={s} className="chip chip-accent">{s}</span>)}
                  </div>
                </div>
              )}

              {tab === 'templates' && (
                <div className="template-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                  {TEMPLATES.map(t => (
                    <div key={t.id} className={`template-card${template.id === t.id ? ' selected' : ''}`} onClick={() => changeTemplate(t)}>
                      <div className="preview">
                        <div style={{ transform: 'scale(0.28)', transformOrigin: 'top left', pointerEvents: 'none' }}>
                          <ResumePreview template={t} data={data} />
                        </div>
                      </div>
                      <div className="tmeta">
                        <div>
                          <div className="tname">{t.name}</div>
                          <div className="tstyle">{t.style}</div>
                        </div>
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

export default function EditorPage() {
  return (
    <Suspense fallback={
      <AppShell>
        <div className="page" style={{ display: 'grid', placeItems: 'center', flex: 1 }}>
          <span className="muted">Loading…</span>
        </div>
      </AppShell>
    }>
      <EditorInner />
    </Suspense>
  );
}
