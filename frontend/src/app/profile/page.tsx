'use client';
import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import AppShell from '@/components/AppShell';
import Topbar from '@/components/Topbar';
import Icon from '@/components/ui/Icon';
import { api } from '@/lib/api';
import type { UserProfile, ExperienceItem, EducationItem } from '@/lib/types';

const LEVELS  = ['Junior', 'Mid-level', 'Senior', 'Staff', 'Principal'];
const TRACKS  = ['Individual Contributor', 'Tech Lead', 'Engineering Manager', 'Director+'];

const EMPTY: UserProfile = {
  name: '', email: '', phone: '', headline: '', location: '',
  interested_titles: [], preferred_levels: [], preferred_tracks: [],
  summary: '', experience: [], education: [], skills: [],
  linkedin_url: '', website_url: '', portfolio_url: '', cover_letter: '',
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseMsg, setParseMsg] = useState<string | null>(null);
  const [titleInput, setTitleInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);
  const skillRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const normalize = (p: Partial<typeof EMPTY>): typeof EMPTY => ({
    name: p.name ?? '',
    email: p.email ?? '',
    phone: p.phone ?? '',
    headline: p.headline ?? '',
    location: p.location ?? '',
    summary: p.summary ?? '',
    interested_titles: p.interested_titles ?? [],
    preferred_levels: p.preferred_levels ?? [],
    preferred_tracks: p.preferred_tracks ?? [],
    skills: p.skills ?? [],
    linkedin_url: p.linkedin_url ?? '',
    website_url: p.website_url ?? '',
    portfolio_url: p.portfolio_url ?? '',
    cover_letter: p.cover_letter ?? '',
    experience: (p.experience ?? []).map(e => ({
      role: e.role ?? '',
      company: e.company ?? '',
      loc: e.loc ?? '',
      when: e.when ?? '',
      bullets: (e.bullets ?? []).map(b => b ?? ''),
    })),
    education: (p.education ?? []).map(e => ({
      degree: e.degree ?? '',
      school: e.school ?? '',
      loc: e.loc ?? '',
      when: e.when ?? '',
    })),
  });

  useEffect(() => {
    api.user.get().then(p => setProfile(normalize(p))).catch(() => {});
  }, []);

  const set = (k: keyof UserProfile, v: string) => setProfile(p => ({ ...p, [k]: v }));

  // Interested titles
  const toggleChip = (field: 'preferred_levels' | 'preferred_tracks', value: string) =>
    setProfile(p => {
      const cur = p[field] ?? [];
      return { ...p, [field]: cur.includes(value) ? cur.filter(x => x !== value) : [...cur, value] };
    });

  const addTitle = (raw: string) => {
    const t = raw.trim();
    if (!t || (profile.interested_titles ?? []).includes(t)) return;
    setProfile(p => ({ ...p, interested_titles: [...(p.interested_titles ?? []), t] }));
  };
  const removeTitle = (t: string) =>
    setProfile(p => ({ ...p, interested_titles: (p.interested_titles ?? []).filter(x => x !== t) }));
  const onTitleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTitle(titleInput); setTitleInput(''); }
    else if (e.key === 'Backspace' && !titleInput && (profile.interested_titles ?? []).length)
      removeTitle((profile.interested_titles ?? [])[profile.interested_titles.length - 1]);
  };

  // Skills
  const addSkill = (raw: string) => {
    const s = raw.trim();
    if (!s || (profile.skills ?? []).includes(s)) return;
    setProfile(p => ({ ...p, skills: [...(p.skills ?? []), s] }));
  };
  const removeSkill = (s: string) =>
    setProfile(p => ({ ...p, skills: (p.skills ?? []).filter(x => x !== s) }));
  const onSkillKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(skillInput); setSkillInput(''); }
    else if (e.key === 'Backspace' && !skillInput && (profile.skills ?? []).length)
      removeSkill((profile.skills ?? [])[profile.skills.length - 1]);
  };

  // Experience
  const addExp = () =>
    setProfile(p => ({ ...p, experience: [...(p.experience ?? []), { role: '', company: '', loc: '', when: '', bullets: [''] }] }));
  const removeExp = (i: number) =>
    setProfile(p => ({ ...p, experience: (p.experience ?? []).filter((_, idx) => idx !== i) }));
  const updateExp = (i: number, k: keyof ExperienceItem, v: string | string[]) =>
    setProfile(p => ({ ...p, experience: (p.experience ?? []).map((e, idx) => idx === i ? { ...e, [k]: v } : e) }));

  // Education
  const addEdu = () =>
    setProfile(p => ({ ...p, education: [...(p.education ?? []), { degree: '', school: '', loc: '', when: '' }] }));
  const removeEdu = (i: number) =>
    setProfile(p => ({ ...p, education: (p.education ?? []).filter((_, idx) => idx !== i) }));
  const updateEdu = (i: number, k: keyof EducationItem, v: string) =>
    setProfile(p => ({ ...p, education: (p.education ?? []).map((e, idx) => idx === i ? { ...e, [k]: v } : e) }));

  // Upload & parse
  const handleUpload = async (file: File) => {
    setParsing(true);
    setParseMsg(null);
    try {
      const parsed = await api.user.parseResume(file);
      setProfile(prev => ({
        ...prev,
        ...(parsed.name      && { name: parsed.name }),
        ...(parsed.email     && { email: parsed.email }),
        ...(parsed.headline  && { headline: parsed.headline }),
        ...(parsed.location  && { location: parsed.location }),
        ...(parsed.summary   && { summary: parsed.summary }),
        ...(parsed.skills?.length     && { skills: parsed.skills }),
        ...(parsed.experience?.length && { experience: parsed.experience }),
        ...(parsed.education?.length  && { education: parsed.education }),
      }));
      setParseMsg(`Filled ${[parsed.name, parsed.experience?.length ? `${parsed.experience.length} jobs` : '', parsed.skills?.length ? `${parsed.skills.length} skills` : ''].filter(Boolean).join(', ')} from your resume. Review and save.`);
    } catch {
      setParseMsg('Could not parse the file. Try a .txt or .docx, or fill in manually.');
    } finally {
      setParsing(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const saved = await api.user.update(profile);
      setProfile(normalize(saved));
      setSaveMsg({ ok: true, text: 'Profile saved.' });
    } catch (e) {
      setSaveMsg({ ok: false, text: e instanceof Error ? e.message : 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const initials = profile.name
    ? profile.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <AppShell>
      <div className="page">
        <Topbar crumbs={['Account', 'My Profile']} actions={
          <>
            <input ref={fileRef} type="file" accept=".pdf,.docx,.txt" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} />
            <button className="btn" onClick={() => fileRef.current?.click()} disabled={parsing}>
              {parsing ? <><span className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> Parsing…</> : <><Icon name="upload" size={12} /> Import resume</>}
            </button>
            <button className="btn primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </>
        } />

        <div className="page-body">
        <div style={{ padding: 22, maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Parse banner */}
          {parseMsg && (
            <div className="panel" style={{ padding: '10px 14px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12.5 }}>{parseMsg}</span>
              <button className="icon-btn" onClick={() => setParseMsg(null)}><Icon name="close" size={12} /></button>
            </div>
          )}

          {/* Save feedback banner */}
          {saveMsg && (
            <div className="panel" style={{ padding: '10px 14px', background: saveMsg.ok ? 'var(--success-soft)' : 'var(--danger-soft, #fef2f2)', border: `1px solid ${saveMsg.ok ? 'var(--success-border, #bbf7d0)' : 'var(--danger-border, #fecaca)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12.5, color: saveMsg.ok ? 'var(--success)' : 'var(--danger)' }}>{saveMsg.text}</span>
              <button className="icon-btn" onClick={() => setSaveMsg(null)}><Icon name="close" size={12} /></button>
            </div>
          )}

          {/* Avatar header */}
          <div className="panel" style={{ padding: 18 }}>
            <div className="row" style={{ gap: 14 }}>
              <div style={{ width: 64, height: 64, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent), oklch(65% 0.15 calc(var(--accent-h) + 50)))', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 24, flexShrink: 0 }}>
                {initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 600 }}>{profile.name || 'Your name'}</div>
                <div className="muted">{profile.headline || 'Add a headline'}{profile.location ? ` · ${profile.location}` : ''}</div>
              </div>
            </div>
          </div>

          {/* Personal info */}
          <div className="panel" style={{ padding: 18 }}>
            <h4 className="section-title">Personal info</h4>
            <div className="form-grid">
              <div className="field"><label className="field-label">Full name</label><input className="input" value={profile.name} onChange={e => set('name', e.target.value)} placeholder="Your name" /></div>
              <div className="field"><label className="field-label">Headline</label><input className="input" value={profile.headline} onChange={e => set('headline', e.target.value)} placeholder="e.g. Senior Frontend Engineer" /></div>
              <div className="field"><label className="field-label">Email</label><input className="input" value={profile.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com" /></div>
              <div className="field"><label className="field-label">Phone</label><input className="input" value={profile.phone} onChange={e => set('phone', e.target.value)} placeholder="+1 555 000 0000" /></div>
              <div className="field"><label className="field-label">Location</label><input className="input" value={profile.location} onChange={e => set('location', e.target.value)} placeholder="Tel Aviv, IL" /></div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Professional summary</label>
              <textarea className="input" rows={4} value={profile.summary} onChange={e => set('summary', e.target.value)} placeholder="A short paragraph about your background and what you're looking for…" />
            </div>
          </div>

          {/* Application defaults */}
          <div className="panel" style={{ padding: 18 }}>
            <h4 className="section-title">Application defaults</h4>
            <div className="muted" style={{ fontSize: 11.5, marginBottom: 14 }}>These are auto-filled when the apply agent submits a job form.</div>
            <div className="form-grid">
              <div className="field"><label className="field-label">LinkedIn URL</label><input className="input" value={profile.linkedin_url} onChange={e => set('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/yourname" /></div>
              <div className="field"><label className="field-label">Personal website</label><input className="input" value={profile.website_url} onChange={e => set('website_url', e.target.value)} placeholder="https://yoursite.com" /></div>
              <div className="field"><label className="field-label">Portfolio URL</label><input className="input" value={profile.portfolio_url} onChange={e => set('portfolio_url', e.target.value)} placeholder="https://github.com/yourname" /></div>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Cover letter template</label>
              <textarea className="input" rows={5} value={profile.cover_letter} onChange={e => set('cover_letter', e.target.value)} placeholder="Dear Hiring Manager,&#10;&#10;I'm excited to apply for the {role} position at {company}…" />
              <div className="muted" style={{ fontSize: 11.5, marginTop: 5 }}>Used as the default cover letter when applying. The agent will fill this in as-is.</div>
            </div>
          </div>

          {/* Skills */}
          <div className="panel" style={{ padding: 18 }}>
            <h4 className="section-title">Skills</h4>
            <div
              className="input"
              style={{ display: 'flex', flexWrap: 'wrap', gap: 4, height: 'auto', minHeight: 38, cursor: 'text', alignItems: 'center' }}
              onClick={() => skillRef.current?.focus()}
            >
              {(profile.skills ?? []).map(s => (
                <span key={s} className="chip chip-accent" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {s}
                  <span style={{ cursor: 'pointer', lineHeight: 1 }} onClick={e => { e.stopPropagation(); removeSkill(s); }}>
                    <Icon name="close" size={10} />
                  </span>
                </span>
              ))}
              <input
                ref={skillRef}
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={onSkillKey}
                onBlur={() => { addSkill(skillInput); setSkillInput(''); }}
                placeholder={(profile.skills ?? []).length === 0 ? 'e.g. React, TypeScript, Node.js…' : ''}
                style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, minWidth: 140, fontSize: 'inherit', color: 'inherit' }}
              />
            </div>
            <div className="muted" style={{ fontSize: 11.5, marginTop: 5 }}>Press Enter or comma to add. These are used when tailoring your resume.</div>
          </div>

          {/* Experience */}
          <div className="panel" style={{ padding: 18 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
              <h4 className="section-title" style={{ margin: 0 }}>Work experience</h4>
              <button className="btn sm ghost" onClick={addExp}><Icon name="plus" size={11} /> Add position</button>
            </div>

            {(profile.experience ?? []).length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-3)', fontSize: 12.5 }}>
                No experience added yet. Click "Add position" or import your resume above.
              </div>
            )}

            <div className="col" style={{ gap: 12 }}>
              {(profile.experience ?? []).map((e, i) => (
                <div key={i} style={{ padding: 14, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                    <span className="muted mono-strong" style={{ fontSize: 11 }}>
                      {e.role || e.company ? `${e.role}${e.company ? ` · ${e.company}` : ''}` : `Position #${i + 1}`}
                    </span>
                    <button className="icon-btn" title="Remove" onClick={() => removeExp(i)}>
                      <Icon name="trash" size={12} />
                    </button>
                  </div>
                  <div className="form-grid">
                    <div className="field">
                      <label className="field-label">Role / Title</label>
                      <input className="input" value={e.role} onChange={ev => updateExp(i, 'role', ev.target.value)} placeholder="Senior Engineer" />
                    </div>
                    <div className="field">
                      <label className="field-label">Company</label>
                      <input className="input" value={e.company} onChange={ev => updateExp(i, 'company', ev.target.value)} placeholder="Acme Inc." />
                    </div>
                    <div className="field">
                      <label className="field-label">Location</label>
                      <input className="input" value={e.loc} onChange={ev => updateExp(i, 'loc', ev.target.value)} placeholder="Tel Aviv" />
                    </div>
                    <div className="field">
                      <label className="field-label">Dates</label>
                      <input className="input" value={e.when} onChange={ev => updateExp(i, 'when', ev.target.value)} placeholder="2021 – Present" />
                    </div>
                  </div>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label className="field-label">Responsibilities & achievements (one per line)</label>
                    <textarea
                      className="input"
                      rows={4}
                      value={(e.bullets ?? []).join('\n')}
                      onChange={ev => updateExp(i, 'bullets', ev.target.value.split('\n'))}
                      placeholder="Led migration to a tokenised design system…"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="panel" style={{ padding: 18 }}>
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
              <h4 className="section-title" style={{ margin: 0 }}>Education</h4>
              <button className="btn sm ghost" onClick={addEdu}><Icon name="plus" size={11} /> Add education</button>
            </div>

            {(profile.education ?? []).length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-3)', fontSize: 12.5 }}>
                No education added yet. Click "Add education" or import your resume above.
              </div>
            )}

            <div className="col" style={{ gap: 12 }}>
              {(profile.education ?? []).map((e, i) => (
                <div key={i} style={{ padding: 14, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                    <span className="muted mono-strong" style={{ fontSize: 11 }}>
                      {e.degree || e.school ? `${e.degree}${e.school ? ` · ${e.school}` : ''}` : `Entry #${i + 1}`}
                    </span>
                    <button className="icon-btn" title="Remove" onClick={() => removeEdu(i)}>
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
            </div>
          </div>

          {/* Job preferences */}
          <div className="panel" style={{ padding: 18 }}>
            <h4 className="section-title">Job preferences</h4>

            <div className="field">
              <label className="field-label">Seniority level</label>
              <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                {LEVELS.map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => toggleChip('preferred_levels', l)}
                    className={`chip${(profile.preferred_levels ?? []).includes(l) ? ' chip-accent' : ''}`}
                    style={{ cursor: 'pointer', userSelect: 'none', padding: '4px 10px' }}
                  >{l}</button>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="field-label">Role track</label>
              <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                {TRACKS.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleChip('preferred_tracks', t)}
                    className={`chip${(profile.preferred_tracks ?? []).includes(t) ? ' chip-accent' : ''}`}
                    style={{ cursor: 'pointer', userSelect: 'none', padding: '4px 10px' }}
                  >{t}</button>
                ))}
              </div>
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label className="field-label">Titles you're looking for</label>
              <div
                className="input"
                style={{ display: 'flex', flexWrap: 'wrap', gap: 4, height: 'auto', minHeight: 38, cursor: 'text', alignItems: 'center' }}
                onClick={() => titleRef.current?.focus()}
              >
                {(profile.interested_titles ?? []).map(t => (
                  <span key={t} className="chip chip-accent" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {t}
                    <span style={{ cursor: 'pointer', lineHeight: 1 }} onClick={e => { e.stopPropagation(); removeTitle(t); }}>
                      <Icon name="close" size={10} />
                    </span>
                  </span>
                ))}
                <input
                  ref={titleRef}
                  value={titleInput}
                  onChange={e => setTitleInput(e.target.value)}
                  onKeyDown={onTitleKey}
                  onBlur={() => { addTitle(titleInput); setTitleInput(''); }}
                  placeholder={(profile.interested_titles ?? []).length === 0 ? 'e.g. Frontend Engineer, Full Stack…' : ''}
                  style={{ border: 'none', outline: 'none', background: 'transparent', flex: 1, minWidth: 140, fontSize: 'inherit', color: 'inherit' }}
                />
              </div>
              <div className="muted" style={{ fontSize: 11.5, marginTop: 5 }}>Used to filter the discover feed.</div>
            </div>
          </div>

        </div>
        </div>
      </div>
    </AppShell>
  );
}
