'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '../ui/Icon';
import ResumePreview from '@/components/resumes/ResumePreview';
import { TEMPLATES } from '@/lib/data';
import type { EducationItem } from '@/lib/types';
import { api } from '@/lib/api';
import type { TailorAnalysis } from '@/lib/api';
import type { Job, ResumeData, UserProfile } from '@/lib/types';

const STEPS = [
  { key: 'fetch',    label: 'Fetch JD' },
  { key: 'analyze',  label: 'Analyze' },
  { key: 'qa',       label: 'Your input' },
  { key: 'generate', label: 'Tailor' },
  { key: 'review',   label: 'Review & export' },
  { key: 'apply',    label: 'Apply' },
];

interface TailoredResume extends ResumeData {
  ats_score?: number;
  changes?: string[];
}

interface TailorFlowProps {
  jobId: string;
  onClose: () => void;
  onNavigateResume: () => void;
}

export default function TailorFlow({ jobId, onClose, onNavigateResume }: TailorFlowProps) {
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData>({
    name: '', title: '', email: '', phone: '', location: '',
    summary: '', experience: [], education: [], skills: [], links: [],
  });
  const [resumeContent, setResumeContent] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [analysis, setAnalysis] = useState<TailorAnalysis | null>(null);
  const [tailored, setTailored] = useState<TailoredResume | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Apply agent state
  const [applyLogs, setApplyLogs] = useState<string[]>([]);
  const [applyScreenshot, setApplyScreenshot] = useState<string | null>(null);
  const [applyPreflight, setApplyPreflight] = useState<{
    session_id: string;
    fields_filled: Array<{ label: string; value: string }>;
    submit_text: string;
  } | null>(null);
  const [applyDone, setApplyDone] = useState<{ success: boolean | null; msg: string } | null>(null);
  const [applyRunning, setApplyRunning] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [personalizedLetter, setPersonalizedLetter] = useState<string | null>(null);
  const [letterLoading, setLetterLoading] = useState(false);
  const resumePrintRef = useRef<HTMLDivElement>(null);

  // Keys increment to trigger the API-call effects (prevents double-firing)
  const [analyzeKey, setAnalyzeKey] = useState(0);
  const [tailorKey, setTailorKey] = useState(0);

  useEffect(() => {
    api.jobs.get(jobId).then(d => setJob(d as Job)).catch(() => {});

    // Load user profile and default resume in parallel, then merge
    Promise.all([
      api.user.get().catch(() => null),
      api.resumes.list().then(async list => {
        const def = list.find(r => r.default) ?? list[0];
        if (!def) return null;
        return api.resumes.get(def.id).catch(() => null);
      }).catch(() => null),
    ]).then(([profile, full]) => {
      if (profile) setUserProfile(profile);
      if (full?.content) setResumeContent(full.content);

      const rd = (full?.resume_data && Object.keys(full.resume_data).length > 0)
        ? full.resume_data as Partial<ResumeData>
        : {};

      // Profile is always authoritative — use its values even if empty string
      setResumeData({
        name:     profile != null ? (profile.name     ?? '') : (rd.name     ?? ''),
        title:    profile != null ? (profile.headline ?? '') : (rd.title    ?? ''),
        email:    profile != null ? (profile.email    ?? '') : (rd.email    ?? ''),
        phone:    profile != null ? (profile.phone    ?? '') : (rd.phone    ?? ''),
        location: profile != null ? (profile.location ?? '') : (rd.location ?? ''),
        summary:  profile != null ? (profile.summary  ?? '') : (rd.summary  ?? ''),
        skills:   profile != null ? (profile.skills   ?? []) : (rd.skills   ?? []),
        experience: profile != null
          ? (profile.experience ?? []).map(e => ({
              role: e.role ?? '', company: e.company ?? '',
              loc: e.loc ?? '', when: e.when ?? '',
              bullets: (e.bullets ?? []).map(b => b ?? ''),
            }))
          : (rd.experience ?? []),
        education: profile != null
          ? (profile.education ?? []).map((e: EducationItem) => ({
              degree: e.degree ?? '', school: e.school ?? '',
              loc: e.loc ?? '', when: e.when ?? '',
            }))
          : (rd.education ?? []),
        links: profile != null
          ? [
              ...(profile.linkedin_url  ? [{ label: 'LinkedIn',  url: profile.linkedin_url  }] : []),
              ...(profile.website_url   ? [{ label: 'Website',   url: profile.website_url   }] : []),
              ...(profile.portfolio_url ? [{ label: 'Portfolio', url: profile.portfolio_url }] : []),
            ]
          : (rd.links ?? []),
      });
    });
  }, [jobId]);

  // Analyze effect — fires when analyzeKey bumps
  useEffect(() => {
    if (analyzeKey === 0 || !job) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    api.tailor.analyze({
      job_description: job.description ?? '',
      resume_data: resumeData as object,
      user_profile: (userProfile ?? {}) as object,
      resume_content: resumeContent,
    })
      .then(d => { setAnalysis(d); setLoading(false); })
      .catch(e => { setError(e.message ?? 'Analysis failed'); setLoading(false); });
  }, [analyzeKey]);

  // Tailor effect — fires when tailorKey bumps
  useEffect(() => {
    if (tailorKey === 0 || !job) return;
    setLoading(true);
    setError(null);
    setTailored(null);
    api.tailor.tailorSync({
      job_description: job.description ?? '',
      resume_data: resumeData as object,
      clarifications: answers,
      user_profile: (userProfile ?? {}) as object,
      resume_content: resumeContent,
    })
      .then(d => { setTailored(d as TailoredResume); setLoading(false); })
      .catch(e => { setError(e.message ?? 'Tailoring failed'); setLoading(false); });
  }, [tailorKey]);

  // Personalize cover letter when entering apply step
  useEffect(() => {
    if (stepIdx !== 5 || !userProfile?.cover_letter || !job) return;
    setLetterLoading(true);
    setPersonalizedLetter(null);
    api.apply.personalizeLetter({
      template: userProfile.cover_letter,
      company: job.company,
      role: job.role,
      candidate_name: resumeData.name || userProfile.name || '',
      candidate_profile: userProfile as object,
    })
      .then(r => { setPersonalizedLetter(r.letter); setLetterLoading(false); })
      .catch(() => setLetterLoading(false));
  }, [stepIdx]);

  const goAnalyze = () => { setStepIdx(1); setAnalyzeKey(k => k + 1); };
  const goTailor  = () => { setStepIdx(3); setTailorKey(k => k + 1); };

  const saveAndOpen = async () => {
    if (!tailored || !job) return;
    const { ats_score, changes, ...clean } = tailored;
    try {
      const r = await api.resumes.create({
        name: `Tailored — ${job.company}`,
        template: 'Vanguard',
        resume_data: clean as object,
      });
      onClose();
      router.push(`/editor?id=${r.id}`);
    } catch {
      onNavigateResume();
    }
  };

  const readSSE = async (res: Response, onEvt: (e: Record<string, unknown>) => void) => {
    const reader = res.body!.getReader();
    const dec = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const parts = buf.split('\n\n');
      buf = parts.pop()!;
      for (const part of parts) {
        const line = part.split('\n').find(l => l.startsWith('data: '));
        if (!line) continue;
        try { onEvt(JSON.parse(line.slice(6))); } catch {}
      }
    }
  };

  const resumeDisplayData = tailored ?? resumeData;
  const candidateName = resumeDisplayData.name || userProfile?.name || 'Resume';

  const getResumeHTML = () => {
    const el = resumePrintRef.current;
    if (!el) return '';
    return `<!doctype html><html><head><title>${candidateName} - Resume</title>
      <style>*{box-sizing:border-box}@page{margin:0;size:letter}html,body{margin:0;padding:0;background:#fff}body{zoom:1.3333;-webkit-print-color-adjust:exact;print-color-adjust:exact}</style>
    </head><body>${el.innerHTML}</body></html>`;
  };

  const [pdfExporting, setPdfExporting] = useState(false);

  const exportResumePDF = async () => {
    const html = getResumeHTML();
    if (!html) return;
    setPdfExporting(true);
    try {
      const blob = await api.apply.exportPDF({ html, filename: `${candidateName} - Resume` });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${candidateName} - Resume.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setPdfExporting(false);
    }
  };

  const startApply = async () => {
    if (!job?.url) { setApplyError('No job URL — cannot launch apply agent.'); return; }
    setApplyRunning(true);
    setApplyError(null);
    setApplyLogs([]);
    setApplyScreenshot(null);
    setApplyPreflight(null);
    setApplyDone(null);
    try {
      const { ats_score: _a, changes: _c, ...cleanTailored } = tailored ?? {} as TailoredResume;
      const res = await api.apply.start({
        url: job.url,
        user_profile: (userProfile ?? {}) as object,
        resume_data: (tailored ? cleanTailored : resumeData) as object,
        resume_html: getResumeHTML(),
        resume_pdf_name: `${candidateName} - Resume`,
      });
      await readSSE(res, evt => {
        if (evt.type === 'log') setApplyLogs(l => [...l, evt.msg as string]);
        else if (evt.type === 'screenshot') setApplyScreenshot(evt.data as string);
        else if (evt.type === 'error') { setApplyError(evt.msg as string); setApplyRunning(false); }
        else if (evt.type === 'preflight') {
          setApplyPreflight(evt as unknown as { session_id: string; fields_filled: Array<{ label: string; value: string }>; submit_text: string });
          setApplyRunning(false);
        }
      });
    } catch (e: unknown) {
      setApplyError((e as Error).message ?? 'Apply agent failed');
      setApplyRunning(false);
    }
  };

  const confirmApply = async () => {
    if (!applyPreflight) return;
    setApplyRunning(true);
    try {
      const res = await api.apply.confirm(applyPreflight.session_id);
      await readSSE(res, evt => {
        if (evt.type === 'log') setApplyLogs(l => [...l, evt.msg as string]);
        else if (evt.type === 'screenshot') setApplyScreenshot(evt.data as string);
        else if (evt.type === 'error') { setApplyError(evt.msg as string); setApplyRunning(false); }
        else if (evt.type === 'done') {
          setApplyDone({ success: evt.success as boolean | null, msg: evt.msg as string });
          setApplyRunning(false);
        }
      });
    } catch (e: unknown) {
      setApplyError((e as Error).message ?? 'Submit failed');
      setApplyRunning(false);
    }
  };

  const step = STEPS[stepIdx];

  if (!job) return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 100, display: 'grid', placeItems: 'center' }} onClick={onClose}>
      <div className="panel" style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }} onClick={e => e.stopPropagation()}>
        <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
        <span className="muted" style={{ fontSize: 12.5 }}>Loading job…</span>
      </div>
    </div>
  );

  return (
    <>
    {/* Hidden full-res resume for PDF generation */}
    <div ref={resumePrintRef} style={{ position: 'fixed', left: -9999, top: 0, pointerEvents: 'none', visibility: 'hidden', zIndex: -1 }}>
      <ResumePreview template={TEMPLATES[0]} data={resumeDisplayData} />
    </div>

    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 100, display: 'grid', placeItems: 'center' }} onClick={onClose}>
      <div className="panel" style={{ width: 'min(1120px,94vw)', height: '86vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
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

        {/* Step bar */}
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

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>

          {/* ── Step 0: Fetch JD ── */}
          {step.key === 'fetch' && (
            <div style={{ maxWidth: 720, margin: '30px auto' }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Job description</div>
              <div className="muted" style={{ marginBottom: 16, fontSize: 12.5 }}>
                Pulled from the posting. Claude will use this to tailor your resume.
              </div>
              {!job.description ? (
                <div className="panel" style={{ padding: 24, display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div className="spinner" />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 12.5 }}>Fetching job posting…</div>
                    <div className="muted" style={{ fontSize: 11.5 }}>{job.url || job.id}</div>
                  </div>
                </div>
              ) : (
                <div className="col" style={{ gap: 12 }}>
                  <div className="panel mono" style={{ padding: 14, background: 'var(--surface-2)', fontSize: 11.5 }}>
                    <div>→ GET {job.url || `jobtracker://${job.id}`}</div>
                    <div>→ 200 OK · text/html</div>
                    <div style={{ color: 'var(--success)' }}>✓ {job.description.split(/\s+/).length} words extracted</div>
                  </div>
                  <div className="panel" style={{ padding: 14, maxHeight: 260, overflow: 'auto', fontSize: 12.5, lineHeight: 1.7, color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>
                    {job.description.slice(0, 800)}{job.description.length > 800 ? '…' : ''}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 1: Analyze ── */}
          {step.key === 'analyze' && (
            <div style={{ flex: 1 }}>
              {loading && (
                <div style={{ maxWidth: 720, margin: '60px auto', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
                  <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
                  <div style={{ fontSize: 15, fontWeight: 600 }}>Analyzing job requirements…</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>Extracting must-haves, keywords, and gaps in your resume.</div>
                </div>
              )}
              {error && !loading && (
                <div style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
                  <div style={{ color: 'var(--danger)', marginBottom: 14, fontSize: 13 }}>{error}</div>
                  <button className="btn" onClick={() => setAnalyzeKey(k => k + 1)}>Retry</button>
                </div>
              )}
              {analysis && !loading && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                  <div className="panel" style={{ padding: 14 }}>
                    <h4 className="section-title">Job description</h4>
                    <div style={{ fontSize: 12.5, lineHeight: 1.7, color: 'var(--text-2)', maxHeight: 380, overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                      {(job.description ?? '').slice(0, 1000)}{(job.description?.length ?? 0) > 1000 ? '…' : ''}
                    </div>
                  </div>
                  <div className="col" style={{ gap: 14 }}>
                    <div className="panel" style={{ padding: 14 }}>
                      <h4 className="section-title">Must-haves</h4>
                      <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.75, fontSize: 12.5 }}>
                        {analysis.requirements.map(r => <li key={r}>{r}</li>)}
                      </ul>
                    </div>
                    {analysis.nice_to_have.length > 0 && (
                      <div className="panel" style={{ padding: 14 }}>
                        <h4 className="section-title">Nice to have</h4>
                        <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.75, fontSize: 12.5, color: 'var(--text-2)' }}>
                          {analysis.nice_to_have.map(r => <li key={r}>{r}</li>)}
                        </ul>
                      </div>
                    )}
                    <div className="panel" style={{ padding: 14 }}>
                      <h4 className="section-title">ATS keywords</h4>
                      <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
                        {analysis.keywords.map(k => <span key={k} className="chip chip-accent">{k}</span>)}
                      </div>
                    </div>
                    {analysis.ats_gaps.length > 0 && (
                      <div className="panel" style={{ padding: 14 }}>
                        <h4 className="section-title">Gaps in your resume</h4>
                        <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.75, fontSize: 12.5, color: 'var(--warn)' }}>
                          {analysis.ats_gaps.map(g => <li key={g}>{g}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 2: Q&A ── */}
          {step.key === 'qa' && (
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
              <div className="row" style={{ gap: 8, marginBottom: 4 }}>
                <Icon name="sparkle" />
                <span style={{ fontSize: 15, fontWeight: 600 }}>A few quick questions</span>
              </div>
              <div className="muted" style={{ marginBottom: 20, fontSize: 12.5 }}>
                Help Claude tailor more accurately. All fields are optional — skip anything that doesn&apos;t apply.
              </div>
              {(analysis?.ats_gaps ?? []).slice(0, 3).map(gap => (
                <div key={gap} style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{gap}</div>
                  <div className="muted" style={{ fontSize: 11.5, marginBottom: 8 }}>Do you have relevant experience to address this?</div>
                  <div className="row" style={{ gap: 4 }}>
                    {['Yes, definitely', 'Somewhat', 'Not really'].map(opt => (
                      <button
                        key={opt}
                        className={`btn sm${answers[gap] === opt ? ' primary' : ''}`}
                        onClick={() => setAnswers(a => ({ ...a, [gap]: opt }))}
                      >{opt}</button>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>Anything else to highlight?</div>
                <div className="muted" style={{ fontSize: 11.5, marginBottom: 8 }}>Specific projects, achievements, or tone preferences you want woven in.</div>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="e.g. Led a database migration that cut latency by 60%…"
                  value={answers['__extra__'] ?? ''}
                  onChange={e => setAnswers(a => ({ ...a, __extra__: e.target.value }))}
                />
              </div>
              <div className="muted" style={{ fontSize: 11.5 }}>
                <Icon name="zap" size={11} /> Claude will fill in any blanks conservatively from your saved resume.
              </div>
            </div>
          )}

          {/* ── Step 3: Generate ── */}
          {step.key === 'generate' && (
            <div style={{ maxWidth: 640, margin: '60px auto', textAlign: 'center' }}>
              {loading && (
                <>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-soft)', color: 'var(--accent)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                    <Icon name="sparkle" size={22} />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Tailoring your resume…</div>
                  <div className="muted" style={{ fontSize: 12.5, marginBottom: 20 }}>
                    Rewriting the summary, reordering bullets, and injecting ATS keywords.
                  </div>
                  <div className="panel mono" style={{ padding: 12, textAlign: 'left', background: 'var(--surface-2)', fontSize: 11.5 }}>
                    <div>→ job description: {(job.description ?? '').split(/\s+/).length} words</div>
                    <div>→ resume: Tailored — {job.company}</div>
                    {Object.values(answers).some(Boolean) && (
                      <div>→ applying {Object.values(answers).filter(Boolean).length} user hints</div>
                    )}
                    <div>→ prompting claude-haiku-4-5…</div>
                    <div className="muted">… <span style={{ animation: 'blink 1s step-end infinite' }}>▌</span></div>
                  </div>
                </>
              )}
              {error && !loading && (
                <>
                  <div style={{ color: 'var(--danger)', marginBottom: 14, fontSize: 13 }}>{error}</div>
                  <button className="btn" onClick={() => setTailorKey(k => k + 1)}>Retry</button>
                </>
              )}
              {tailored && !loading && (
                <>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--success-soft)', color: 'var(--success)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                    <Icon name="check" size={24} />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Tailored draft ready</div>
                  {tailored.ats_score != null && (
                    <div className="muted" style={{ fontSize: 12.5 }}>
                      ATS score: <strong style={{ color: 'var(--success)' }}>{tailored.ats_score}</strong> / 100
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Step 4: Review ── */}
          {step.key === 'review' && tailored && (
            <TailorReview original={resumeData} tailored={tailored} job={job} />
          )}

          {/* ── Step 5: Apply ── */}
          {step.key === 'apply' && (
            <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {applyLogs.length === 0 && !applyRunning && !applyError && !applyDone && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>Ready to apply — here's what will be submitted</div>
                    <div className="muted" style={{ fontSize: 12.5 }}>Claude will open the posting, fill these in, and show you a preview before submitting.</div>
                  </div>

                  {/* Target */}
                  <div className="panel" style={{ padding: 14 }}>
                    <h4 className="section-title" style={{ marginBottom: 10 }}>Job</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '6px 16px', fontSize: 12.5 }}>
                      <span className="muted">Company</span><span style={{ fontWeight: 500 }}>{job.company}</span>
                      <span className="muted">Role</span><span style={{ fontWeight: 500 }}>{job.role}</span>
                      <span className="muted">URL</span><span className="mono" style={{ fontSize: 11.5, wordBreak: 'break-all' }}>{job.url}</span>
                    </div>
                  </div>

                  {/* Contact fields */}
                  <div className="panel" style={{ padding: 14 }}>
                    <h4 className="section-title" style={{ marginBottom: 10 }}>Contact info</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '6px 16px', fontSize: 12.5 }}>
                      {[
                        ['First name', (resumeData.name || userProfile?.name || '').split(' ')[0]],
                        ['Last name',  (resumeData.name || userProfile?.name || '').split(' ').slice(1).join(' ')],
                        ['Email',      resumeData.email || userProfile?.email],
                        ['Phone',      resumeData.phone || userProfile?.phone],
                        ['Location',   resumeData.location || userProfile?.location],
                      ].map(([label, value]) => value ? (
                        <React.Fragment key={label as string}>
                          <span className="muted">{label}</span>
                          <span style={{ fontWeight: 500 }}>{value}</span>
                        </React.Fragment>
                      ) : null)}
                    </div>
                  </div>

                  {/* Resume */}
                  <div className="panel" style={{ padding: 14 }}>
                    <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                      <div className="col" style={{ gap: 2 }}>
                        <h4 className="section-title" style={{ margin: 0 }}>Resume</h4>
                        <div className="muted mono" style={{ fontSize: 11 }}>{candidateName} - Resume.pdf</div>
                      </div>
                      <div className="row" style={{ gap: 6 }}>
                        {tailored && <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 500 }}>✓ Tailored</span>}
                        <button className="btn sm" onClick={exportResumePDF} disabled={pdfExporting}>
                          {pdfExporting
                            ? <><span className="spinner" style={{ width: 11, height: 11, borderWidth: 2 }} /> Generating…</>
                            : <><Icon name="download" size={11} /> Download PDF</>}
                        </button>
                      </div>
                    </div>
                    {/* Scaled visual preview */}
                    <div style={{ border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden', background: '#fff', maxHeight: 420 }}>
                      <div style={{ zoom: 0.58, transformOrigin: 'top left', background: '#fff' }}>
                        <ResumePreview template={TEMPLATES[0]} data={resumeDisplayData} />
                      </div>
                    </div>
                  </div>

                  {/* Links */}
                  {(userProfile?.linkedin_url || userProfile?.website_url || userProfile?.portfolio_url) && (
                    <div className="panel" style={{ padding: 14 }}>
                      <h4 className="section-title" style={{ marginBottom: 10 }}>Links</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '6px 16px', fontSize: 12.5 }}>
                        {[
                          ['LinkedIn',  userProfile?.linkedin_url],
                          ['Website',   userProfile?.website_url],
                          ['Portfolio', userProfile?.portfolio_url],
                        ].map(([label, value]) => value ? (
                          <React.Fragment key={label as string}>
                            <span className="muted">{label}</span>
                            <span style={{ fontWeight: 500, wordBreak: 'break-all' }}>{value}</span>
                          </React.Fragment>
                        ) : null)}
                      </div>
                    </div>
                  )}

                  {/* Cover letter */}
                  {userProfile?.cover_letter && (
                    <div className="panel" style={{ padding: 14 }}>
                      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
                        <h4 className="section-title" style={{ margin: 0 }}>Cover letter</h4>
                        {letterLoading && (
                          <div className="row" style={{ gap: 6 }}>
                            <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                            <span className="muted" style={{ fontSize: 11.5 }}>Personalizing…</span>
                          </div>
                        )}
                        {personalizedLetter && !letterLoading && (
                          <span style={{ fontSize: 11, color: 'var(--success)', fontWeight: 500 }}>✓ Personalized</span>
                        )}
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-2)', whiteSpace: 'pre-wrap', maxHeight: 180, overflow: 'auto', lineHeight: 1.7 }}>
                        {personalizedLetter || userProfile.cover_letter}
                      </div>
                    </div>
                  )}

                  {(!userProfile?.linkedin_url && !userProfile?.website_url && !userProfile?.cover_letter) && (
                    <div className="muted" style={{ fontSize: 11.5 }}>
                      Tip: add a LinkedIn URL and cover letter template in your profile to fill those fields automatically.
                    </div>
                  )}
                </div>
              )}
              {applyLogs.length > 0 && (
                <div className="panel mono" style={{ padding: 12, background: 'var(--surface-2)', fontSize: 11.5, maxHeight: 200, overflow: 'auto' }}>
                  {applyLogs.map((l, i) => <div key={i} style={{ lineHeight: 1.8 }}>{l}</div>)}
                  {applyRunning && <div className="muted">… <span style={{ animation: 'blink 1s step-end infinite' }}>▌</span></div>}
                </div>
              )}
              {applyError && (
                <div className="panel" style={{ padding: 14, borderColor: 'var(--danger)' }}>
                  <div style={{ color: 'var(--danger)', fontSize: 13 }}>{applyError}</div>
                </div>
              )}
              {applyPreflight && !applyDone && !applyRunning && (
                <div className="panel" style={{ padding: 16 }}>
                  <h4 className="section-title" style={{ marginBottom: 12 }}>Review before submitting</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '6px 16px', fontSize: 12.5 }}>
                    {applyPreflight.fields_filled.map((f, i) => (
                      <React.Fragment key={i}>
                        <span className="muted">{f.label}</span>
                        <span style={{ fontWeight: 500 }}>{f.value}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}
              {applyScreenshot && (
                <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  <img src={applyScreenshot} alt="Browser preview" style={{ width: '100%', display: 'block' }} />
                </div>
              )}
              {applyDone && (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: applyDone.success ? 'var(--success-soft)' : 'var(--surface-2)', color: applyDone.success ? 'var(--success)' : 'var(--text-2)', display: 'grid', placeItems: 'center', margin: '0 auto 12px' }}>
                    <Icon name="check" size={24} />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{applyDone.msg}</div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <div className="row" style={{ gap: 6 }}>
            {stepIdx > 0 && stepIdx < 4 && step.key !== 'fetch' && (
              <button className="btn" onClick={() => setStepIdx(stepIdx - 1)}>Back</button>
            )}
            {step.key === 'fetch' && job.description && (
              <button className="btn primary" onClick={goAnalyze}>
                Continue <Icon name="arrowRight" size={12} />
              </button>
            )}
            {step.key === 'analyze' && analysis && !loading && (
              <button className="btn primary" onClick={() => setStepIdx(2)}>
                Continue <Icon name="arrowRight" size={12} />
              </button>
            )}
            {step.key === 'qa' && (
              <button className="btn primary" onClick={goTailor}>
                <Icon name="sparkle" size={12} /> Tailor resume
              </button>
            )}
            {step.key === 'generate' && tailored && !loading && (
              <button className="btn primary" onClick={() => setStepIdx(4)}>
                Review <Icon name="arrowRight" size={12} />
              </button>
            )}
            {step.key === 'review' && tailored && (
              <>
                <button className="btn" onClick={saveAndOpen}>
                  <Icon name="edit" size={12} /> Save &amp; open in editor
                </button>
                {job?.url && (
                  <button className="btn primary" onClick={() => setStepIdx(5)}>
                    Apply for me <Icon name="arrowRight" size={12} />
                  </button>
                )}
              </>
            )}
            {step.key === 'apply' && !applyRunning && applyLogs.length === 0 && !applyDone && !applyError && (
              <button className="btn primary" onClick={startApply}>
                <Icon name="sparkle" size={12} /> Start apply agent
              </button>
            )}
            {step.key === 'apply' && applyPreflight && !applyRunning && !applyDone && (
              <button className="btn primary" onClick={confirmApply}>
                Confirm &amp; Submit
              </button>
            )}
            {step.key === 'apply' && applyDone && (
              <button className="btn primary" onClick={onClose}>Done</button>
            )}
            {step.key === 'apply' && applyError && !applyRunning && (
              <button className="btn" onClick={() => { setApplyError(null); setApplyLogs([]); setApplyScreenshot(null); setApplyPreflight(null); }}>
                Try again
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
    </>
  );
}

function TailorReview({ original, tailored, job }: { original: ResumeData; tailored: TailoredResume; job: Job }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18 }}>
      <div className="col" style={{ gap: 14 }}>
        <div className="row" style={{ gap: 8 }}>
          {tailored.ats_score != null && <span className="chip chip-success">ATS match · {tailored.ats_score}</span>}
          {tailored.changes && <span className="chip">{tailored.changes.length} edits</span>}
        </div>

        {tailored.summary && tailored.summary !== original.summary && (
          <div>
            <h4 className="section-title">Summary</h4>
            <DiffLine old={original.summary} now={tailored.summary} />
          </div>
        )}

        {tailored.title && tailored.title !== original.title && (
          <div>
            <h4 className="section-title">Title</h4>
            <DiffLine old={original.title} now={tailored.title} />
          </div>
        )}

        {tailored.skills && (
          <div>
            <h4 className="section-title">Skills</h4>
            <div className="row" style={{ gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
              {original.skills.map(s => (
                <span key={s} className="chip" style={{ opacity: tailored.skills!.includes(s) ? 1 : 0.35, textDecoration: tailored.skills!.includes(s) ? 'none' : 'line-through' }}>{s}</span>
              ))}
            </div>
            <div className="row" style={{ gap: 4, flexWrap: 'wrap' }}>
              {tailored.skills.map(s => (
                <span key={s} className={`chip${original.skills.includes(s) ? '' : ' chip-accent'}`}>{s}</span>
              ))}
            </div>
          </div>
        )}

        {tailored.experience?.[0] && original.experience[0] && (
          <div>
            <h4 className="section-title">Bullets — {tailored.experience[0].company || original.experience[0].company}</h4>
            {tailored.experience[0].bullets.map((b, i) => (
              <DiffLine key={i} old={original.experience[0].bullets[i] ?? '(new)'} now={b} />
            ))}
          </div>
        )}
      </div>

      <aside className="col" style={{ gap: 12 }}>
        {tailored.changes && tailored.changes.length > 0 && (
          <div className="panel" style={{ padding: 14 }}>
            <h4 className="section-title">Changes made</h4>
            <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.75, fontSize: 12 }}>
              {tailored.changes.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </div>
        )}
        <div className="panel" style={{ padding: 14 }}>
          <h4 className="section-title">Will be saved as</h4>
          <div className="row" style={{ gap: 8 }}>
            <Icon name="doc" />
            <div>
              <div style={{ fontWeight: 500, fontSize: 12.5 }}>Tailored — {job.company}</div>
              <div className="muted mono" style={{ fontSize: 11 }}>new resume · editor ready</div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function DiffLine({ old: o, now: n }: { old: string; now: string }) {
  if (!n || o === n) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
      <div className="panel" style={{ padding: 10, background: 'var(--surface-2)', fontSize: 12, color: 'var(--text-3)', textDecoration: 'line-through' }}>{o}</div>
      <div className="panel" style={{ padding: 10, background: 'var(--accent-soft)', borderColor: 'var(--accent-border)', fontSize: 12 }}>{n}</div>
    </div>
  );
}
