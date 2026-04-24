'use client';
import React, { useState, useEffect } from 'react';
import Icon from '../ui/Icon';
import { ELEMENTOR_JOB } from '@/lib/data';
import { api } from '@/lib/api';
import type { Job } from '@/lib/types';

const STEPS = [
  { key: 'fetch', label: 'Fetch JD' },
  { key: 'analyze', label: 'Analyze' },
  { key: 'qa', label: 'Your input' },
  { key: 'generate', label: 'Tailor' },
  { key: 'review', label: 'Review & export' },
];

interface TailorFlowProps {
  jobId: string;
  initialStep?: string | null;
  onClose: () => void;
  onNavigateResume: () => void;
}

export default function TailorFlow({ jobId, initialStep = null, onClose, onNavigateResume }: TailorFlowProps) {
  const [job, setJob] = useState<Job | null>(jobId === 'elementor-fs' ? ELEMENTOR_JOB : null);

  useEffect(() => {
    if (jobId !== 'elementor-fs') {
      api.jobs.get(jobId).then(data => setJob(data as Job)).catch(() => {});
    }
  }, [jobId]);

  const initIdx = initialStep ? Math.max(0, STEPS.findIndex(s => s.key === initialStep)) : 0;
  const [stepIdx, setStepIdx] = useState(initIdx);
  const step = STEPS[stepIdx];

  const [fetchLog, setFetchLog] = useState<string[]>([]);
  useEffect(() => {
    if (step.key !== 'fetch' || !job) return;
    const lines = [
      `→ GET ${job.url ?? `techmap://${job.id}`}`,
      `→ 200 OK · text/html · 84 KB`,
      `→ detecting schema.org JobPosting…`,
      `→ parsed title, company, location, description`,
      `→ extracting requirements with NLP…`,
      `✓ done in 1.4s`,
    ];
    setFetchLog([]);
    let i = 0;
    const t = setInterval(() => {
      setFetchLog(f => [...f, lines[i]]);
      i++;
      if (i >= lines.length) { clearInterval(t); setTimeout(() => setStepIdx(1), 500); }
    }, 240);
    return () => clearInterval(t);
  }, [stepIdx]);

  const analysis = {
    must: ['5+ years full-stack web development', 'Strong PHP + modern JS (React)', 'Relational DB (MySQL) at scale', 'REST API design'],
    nice: ['WordPress ecosystem experience', 'TypeScript', 'CI/CD (Jenkins, GitHub Actions)', 'Performance optimization'],
    keywords: ['PHP','WordPress','React','MySQL','REST','TypeScript','Node','Docker'],
  };

  const [answers, setAnswers] = useState({ php_years: '', wordpress: '', headline: '', emphasis: [] as string[], extra: '' });
  const setAns = (k: string, v: string | string[]) => setAnswers(a => ({ ...a, [k]: v }));
  const toggleEmphasis = (v: string) => setAnswers(a => ({ ...a, emphasis: a.emphasis.includes(v) ? a.emphasis.filter(x => x !== v) : [...a.emphasis, v] }));

  const [generated, setGenerated] = useState(false);
  useEffect(() => {
    if (step.key === 'generate') {
      setGenerated(false);
      const t = setTimeout(() => setGenerated(true), 1800);
      return () => clearTimeout(t);
    }
  }, [stepIdx]);

  const canAdvance = step.key === 'fetch' ? false : step.key === 'qa' ? !!(answers.php_years && answers.wordpress) : true;

  if (!job) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 100, display: 'grid', placeItems: 'center' }} onClick={onClose}>
      <div className="panel" style={{ padding: 32 }}><span className="muted">Loading…</span></div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 100, display: 'grid', placeItems: 'center' }} onClick={onClose}>
      <div className="panel" style={{ width: 'min(1120px, 94vw)', height: '86vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
        <div className="panel-header" style={{ padding: '12px 16px' }}>
          <div className="row" style={{ gap: 10 }}>
            <span style={{ width: 28, height: 28, borderRadius: 6, background: job.color, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700 }}>{job.company[0]}</span>
            <div>
              <div style={{ fontWeight: 600 }}>Tailor resume — {job.company}</div>
              <div className="muted" style={{ fontSize: 11.5 }}>{job.role} · {job.loc} · {job.remote}</div>
            </div>
          </div>
          <span style={{ flex: 1 }} />
          <button className="icon-btn" onClick={onClose}><Icon name="close" /></button>
        </div>

        <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div className="row" style={{ gap: 6 }}>
            {STEPS.map((s, i) => (
              <React.Fragment key={s.key}>
                <div className="row" style={{ gap: 6, color: i <= stepIdx ? 'var(--text)' : 'var(--text-3)' }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: i < stepIdx ? 'var(--accent)' : i === stepIdx ? 'var(--accent-soft)' : 'var(--surface-3)', color: i < stepIdx ? 'var(--text-inv)' : i === stepIdx ? 'var(--accent)' : 'var(--text-3)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600 }}>
                    {i < stepIdx ? '✓' : i + 1}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: i === stepIdx ? 500 : 400 }}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <span style={{ flex: 1, height: 1, background: i < stepIdx ? 'var(--accent)' : 'var(--border)' }} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
          {step.key === 'fetch' && (
            <div style={{ maxWidth: 720, margin: '40px auto' }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>Tunneling to the job posting…</div>
              <div className="muted" style={{ marginBottom: 16, fontSize: 12.5 }}>Backend is fetching the page and extracting structured data.</div>
              <div className="panel mono" style={{ padding: 14, background: 'var(--surface-2)', fontSize: 11.5, minHeight: 180 }}>
                <div className="muted">$ jobtracker fetch --url={job.url ?? job.id}</div>
                {fetchLog.map((l, i) => <div key={i}>{l}</div>)}
                <span className="mono" style={{ animation: 'blink 1s step-end infinite' }}>▌</span>
              </div>
            </div>
          )}

          {step.key === 'analyze' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              <div className="panel" style={{ padding: 14 }}>
                <h4 className="section-title">Full job description</h4>
                <div style={{ fontSize: 12.5, lineHeight: 1.65, color: 'var(--text-2)', maxHeight: 420, overflow: 'auto' }}>
                  <p><strong style={{ color: 'var(--text)' }}>About Elementor.</strong> Elementor is the leading web creation platform for WordPress, powering 18M+ websites worldwide.</p>
                  <p><strong style={{ color: 'var(--text)' }}>The role.</strong> We&apos;re hiring a Full Stack Developer to join the editor team. You&apos;ll work across our PHP backend and React-based editor, shipping features that millions of creators use weekly.</p>
                  <p><strong style={{ color: 'var(--text)' }}>Requirements.</strong></p>
                  <ul><li>5+ years of full-stack web development</li><li>Strong PHP + modern JS (React)</li><li>Production experience with MySQL</li><li>REST API design</li></ul>
                  <p><strong style={{ color: 'var(--text)' }}>Nice to have.</strong> WordPress ecosystem, TypeScript, Jenkins, perf work.</p>
                </div>
              </div>
              <div className="col" style={{ gap: 14 }}>
                <div className="panel" style={{ padding: 14 }}>
                  <h4 className="section-title">Must-haves <span className="mono-strong muted" style={{ textTransform: 'none', letterSpacing: 0 }}>extracted</span></h4>
                  <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.75, fontSize: 12.5 }}>{analysis.must.map(r => <li key={r}>{r}</li>)}</ul>
                </div>
                <div className="panel" style={{ padding: 14 }}>
                  <h4 className="section-title">Nice to have</h4>
                  <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.75, fontSize: 12.5, color: 'var(--text-2)' }}>{analysis.nice.map(r => <li key={r}>{r}</li>)}</ul>
                </div>
                <div className="panel" style={{ padding: 14 }}>
                  <h4 className="section-title">ATS keywords</h4>
                  <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>{analysis.keywords.map(k => <span key={k} className="chip chip-accent">{k}</span>)}</div>
                </div>
              </div>
            </div>
          )}

          {step.key === 'qa' && (
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
              <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                <Icon name="sparkle" />
                <span style={{ fontSize: 15, fontWeight: 600 }}>A few quick questions</span>
              </div>
              <div className="muted" style={{ marginBottom: 20, fontSize: 12.5 }}>The JD calls out specifics your default resume doesn&apos;t cover. Answer these and Claude will weave them into your tailored version.</div>
              <Q label="How many years of production PHP do you have?" subtitle="They list 5+ years full-stack, PHP-weighted.">
                <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                  {['< 2','2–4','5–7','8+'].map(o => <button key={o} className={`btn sm${answers.php_years === o ? ' primary' : ''}`} onClick={() => setAns('php_years', o)}>{o}</button>)}
                </div>
              </Q>
              <Q label="WordPress ecosystem experience?" subtitle="Nice-to-have — bump it up if you've got it.">
                <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                  {['None','Hobbyist','Shipped plugins/themes','Core contributor'].map(o => <button key={o} className={`btn sm${answers.wordpress === o ? ' primary' : ''}`} onClick={() => setAns('wordpress', o)}>{o}</button>)}
                </div>
              </Q>
              <Q label="Any of these to emphasize?" subtitle="Pick as many as apply.">
                <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                  {['Perf work','Design system','Mentorship','Query optimization','CI/CD ownership','Cross-team collaboration'].map(o => (
                    <button key={o} className={`btn sm${answers.emphasis.includes(o) ? ' primary' : ''}`} onClick={() => toggleEmphasis(o)}>
                      {answers.emphasis.includes(o) && <Icon name="check" size={11} />} {o}
                    </button>
                  ))}
                </div>
              </Q>
              <Q label="Tailored headline" subtitle="What should sit under your name? (Optional)">
                <input className="input" placeholder="e.g. Full-stack engineer · PHP + React at scale" value={answers.headline} onChange={e => setAns('headline', e.target.value)} />
              </Q>
              <Q label="Anything else we should weave in?" subtitle="A specific project, a niche skill, a tone preference…">
                <textarea className="input" rows={3} placeholder="e.g. Led a MySQL migration that halved p95 query time." value={answers.extra} onChange={e => setAns('extra', e.target.value)} />
              </Q>
              <div className="muted" style={{ fontSize: 11.5, marginTop: 14 }}><Icon name="zap" size={11} /> Skip any — we&apos;ll fill gaps conservatively from your default resume.</div>
            </div>
          )}

          {step.key === 'generate' && (
            <div style={{ maxWidth: 640, margin: '80px auto', textAlign: 'center' }}>
              {!generated ? (
                <>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}><Icon name="sparkle" size={22} /></div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Tailoring your resume…</div>
                  <div className="muted" style={{ fontSize: 12.5, marginBottom: 20 }}>Rewriting the summary, reordering bullets, injecting ATS keywords.</div>
                  <div className="panel mono" style={{ padding: 12, textAlign: 'left', background: 'var(--surface-2)', fontSize: 11.5 }}>
                    <div>→ loading default resume: Senior Frontend — General</div>
                    <div>→ applying answers from Q&amp;A ({Object.values(answers).filter(v => v && (Array.isArray(v) ? v.length > 0 : true)).length} inputs)</div>
                    <div>→ prompting model · claude-haiku-4-5</div>
                    <div>→ scoring ATS coverage…</div>
                    <div className="muted">… ~2s</div>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--success-soft)', color: 'var(--success)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}><Icon name="check" size={24} stroke={2.25} /></div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Tailored draft ready</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>ATS match 87 → <strong style={{ color: 'var(--success)' }}>94</strong>. 6 edits applied.</div>
                </>
              )}
            </div>
          )}

          {step.key === 'review' && <TailorReview job={job} answers={answers} />}
        </div>

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <div className="row" style={{ gap: 6 }}>
            {stepIdx > 0 && stepIdx < STEPS.length - 1 && step.key !== 'fetch' && <button className="btn" onClick={() => setStepIdx(stepIdx - 1)}>Back</button>}
            {step.key === 'analyze' && <button className="btn primary" onClick={() => setStepIdx(2)}>Continue <Icon name="arrowRight" size={12} /></button>}
            {step.key === 'qa' && <button className="btn primary" disabled={!canAdvance} onClick={() => setStepIdx(3)}><Icon name="sparkle" size={12} /> Tailor resume</button>}
            {step.key === 'generate' && generated && <button className="btn primary" onClick={() => setStepIdx(4)}>Review <Icon name="arrowRight" size={12} /></button>}
            {step.key === 'review' && (
              <>
                <button className="btn"><Icon name="download" size={12} /> Export PDF</button>
                <button className="btn primary" onClick={onNavigateResume}><Icon name="edit" size={12} /> Open in editor</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Q({ label, subtitle, children }: { label: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{label}</div>
      {subtitle && <div className="muted" style={{ fontSize: 11.5, marginBottom: 8 }}>{subtitle}</div>}
      {children}
    </div>
  );
}

function TailorReview({ job, answers }: { job: Job; answers: { php_years: string; wordpress: string; headline: string; emphasis: string[]; extra: string } }) {
  const before = {
    headline: 'Senior Frontend Engineer',
    summary: 'Senior engineer with 7+ years building data-dense B2B consoles. Owned design systems, shipped perf-critical tables, and mentored mid-level ICs.',
    skills: ['React','TypeScript','Node.js','GraphQL','Design Systems','Perf','Accessibility','Figma'],
    bullets: ['Led migration to a tokenized design system across 40+ surfaces.','Rebuilt the large-dataset table layer — p95 interaction 420ms → 90ms.','Mentored three mid-level engineers; set code-review culture.'],
  };
  const after = {
    headline: answers.headline || 'Full-stack Engineer · PHP + React at scale',
    summary: `Full-stack engineer with 7+ years shipping production web apps on PHP and React.${answers.wordpress && answers.wordpress !== 'None' ? ' ' + answers.wordpress + ' in the WordPress ecosystem.' : ''}${answers.emphasis.length ? ' Strengths: ' + answers.emphasis.slice(0,3).join(', ').toLowerCase() + '.' : ''}`,
    skills: ['PHP','React','MySQL','Node.js','REST API','TypeScript','WordPress','CI/CD','Docker','Perf'],
    bullets: ['Architected a PHP + React editor surface used by 18M+ creators weekly.','Optimized MySQL queries powering the rule engine — p95 halved from 420ms → 90ms.','Designed REST APIs consumed by the editor and third-party plugins.','Mentored three mid-level engineers; set code-review culture across the full stack.'],
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 18 }}>
      <div className="col" style={{ gap: 14 }}>
        <div className="row" style={{ gap: 8 }}>
          <span className="chip chip-success dot">ATS match · 94</span>
          <span className="chip">6 edits</span>
          <span className="chip">tone: collaborative</span>
          <span style={{ flex: 1 }} />
          <div className="row" style={{ gap: 2, border: '1px solid var(--border)', borderRadius: 6, padding: 2 }}>
            <button className="btn sm primary" style={{ padding: '3px 8px' }}>Diff</button>
            <button className="btn sm ghost" style={{ padding: '3px 8px' }}>Preview</button>
          </div>
        </div>
        <div><h4 className="section-title">Headline</h4><DiffLine old={before.headline} now={after.headline} /></div>
        <div><h4 className="section-title">Summary</h4><DiffLine old={before.summary} now={after.summary} /></div>
        <div>
          <h4 className="section-title">Skills reordered</h4>
          <div className="row" style={{ gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>{before.skills.map(s => <span key={s} className="chip" style={{ opacity: .5, textDecoration: 'line-through' }}>{s}</span>)}</div>
          <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>{after.skills.map(s => <span key={s} className={`chip${before.skills.includes(s) ? '' : ' chip-accent'}`}>{s}</span>)}</div>
        </div>
        <div>
          <h4 className="section-title">Experience bullets — rewritten for this role</h4>
          {after.bullets.map((b, i) => <DiffLine key={i} old={before.bullets[i] || '(new bullet)'} now={b} />)}
        </div>
      </div>
      <aside className="col" style={{ gap: 12 }}>
        <div className="panel" style={{ padding: 14 }}>
          <h4 className="section-title">ATS coverage</h4>
          <div className="stack-sm">
            {[{ k: 'PHP', before: 10, after: 92 },{ k: 'React', before: 88, after: 95 },{ k: 'MySQL', before: 20, after: 88 },{ k: 'REST API', before: 55, after: 90 },{ k: 'WordPress', before: 0, after: answers.wordpress && answers.wordpress !== 'None' ? 70 : 20 }].map(r => (
              <div key={r.k}>
                <div className="row" style={{ justifyContent: 'space-between', fontSize: 11.5 }}>
                  <span>{r.k}</span>
                  <span className="mono-strong"><span style={{ color: 'var(--text-3)' }}>{r.before}</span> → <span style={{ color: 'var(--success)' }}>{r.after}</span></span>
                </div>
                <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 2, marginTop: 3, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, width: `${r.before}%`, height: '100%', background: 'var(--surface-3)', borderRadius: 2 }} />
                  <div style={{ position: 'absolute', left: 0, top: 0, width: `${r.after}%`, height: '100%', background: 'var(--accent)', borderRadius: 2, opacity: .9 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel" style={{ padding: 14 }}>
          <h4 className="section-title">Saved as</h4>
          <div className="row" style={{ gap: 8 }}>
            <Icon name="doc" />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, fontSize: 12.5 }}>Fullstack — {job.company}.pdf</div>
              <div className="muted mono" style={{ fontSize: 11 }}>tailored · just now</div>
            </div>
          </div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>Linked to {job.company} · {job.role}. Reuse it from the job card.</div>
        </div>
        <div className="panel" style={{ padding: 14 }}>
          <h4 className="section-title">Questions you answered</h4>
          <dl style={{ margin: 0, fontSize: 11.5, display: 'grid', gridTemplateColumns: '90px 1fr', gap: '4px 10px' }}>
            <dt className="muted">PHP years</dt><dd>{answers.php_years || '—'}</dd>
            <dt className="muted">WordPress</dt><dd>{answers.wordpress || '—'}</dd>
            <dt className="muted">Emphasis</dt><dd>{answers.emphasis.length ? answers.emphasis.join(', ') : '—'}</dd>
            {answers.extra && <><dt className="muted">Note</dt><dd>{answers.extra}</dd></>}
          </dl>
        </div>
      </aside>
    </div>
  );
}

function DiffLine({ old: o, now: n }: { old: string; now: string }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
      <div className="panel" style={{ padding: 10, background: 'var(--surface-2)', fontSize: 12, color: 'var(--text-3)', textDecoration: 'line-through' }}>{o}</div>
      <div className="panel" style={{ padding: 10, background: 'var(--accent-soft)', borderColor: 'var(--accent-border)', fontSize: 12 }}>{n}</div>
    </div>
  );
}
