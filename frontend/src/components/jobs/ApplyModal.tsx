'use client';
import React, { useState, useEffect } from 'react';
import Icon from '../ui/Icon';
import StatusChip from '../ui/StatusChip';
import { api } from '@/lib/api';
import type { ResumeAPI } from '@/lib/api';
import type { Job } from '@/lib/types';

interface ApplyModalProps {
  job: Job | null;
  onClose: () => void;
}

export default function ApplyModal({ job, onClose }: ApplyModalProps) {
  const [step, setStep] = useState(0);
  const [resumes, setResumes] = useState<ResumeAPI[]>([]);
  const [resume, setResume] = useState('');

  useEffect(() => {
    api.resumes.list().then(data => {
      setResumes(data);
      if (data.length > 0) setResume(data.find(r => r.default)?.id || data[0].id);
    }).catch(() => {});
  }, []);
  const [coverLetter, setCoverLetter] = useState('AI-draft');
  const [fireWebhook, setFireWebhook] = useState(true);
  const steps = ['Resume', 'Cover letter', 'Review', 'Fired'];

  return (
    <div className="modal-overlay" style={{ background: 'rgba(10,12,18,.45)' }} onClick={onClose}>
      <div className="panel" style={{ width: 620, maxHeight: '86vh', overflow: 'auto', boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
        <div className="panel-header">
          <Icon name="zap" /> Apply — {job?.company || 'Wiz'} · {job?.role || 'Senior Frontend Engineer'}
          <span style={{ flex: 1 }} />
          <button className="icon-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
          <div className="row" style={{ gap: 6 }}>
            {steps.map((s, i) => (
              <React.Fragment key={i}>
                <div className="row" style={{ gap: 6, color: i <= step ? 'var(--text)' : 'var(--text-3)' }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: i < step ? 'var(--accent)' : i === step ? 'var(--accent-soft)' : 'var(--surface-2)', color: i < step ? '#fff' : 'var(--text-2)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 600 }}>
                    {i < step ? '✓' : i + 1}
                  </span>
                  <span style={{ fontSize: 12.5, fontWeight: i === step ? 500 : 400 }}>{s}</span>
                </div>
                {i < steps.length - 1 && <span style={{ flex: 1, height: 1, background: i < step ? 'var(--accent)' : 'var(--border)' }} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{ padding: 18 }}>
          {step === 0 && (
            <div>
              <h4 className="section-title">Pick a resume</h4>
              <div className="stack-sm">
                {resumes.map(r => (
                  <label key={r.id} className="panel" style={{ padding: 10, display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer', borderColor: resume === r.id ? 'var(--accent)' : 'var(--border)', boxShadow: resume === r.id ? '0 0 0 2px var(--accent-soft)' : 'none' }}>
                    <input type="radio" checked={resume === r.id} onChange={() => setResume(r.id)} />
                    <Icon name="doc" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500 }}>{r.name}</div>
                      <div className="muted" style={{ fontSize: 11.5 }}>Template: {r.template} · {r.pages} pages · updated {r.updated}</div>
                    </div>
                    {r.default && <span className="chip chip-accent">default</span>}
                  </label>
                ))}
              </div>
              <button className="btn ghost sm" style={{ marginTop: 10 }}><Icon name="plus" size={12} /> Upload another</button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h4 className="section-title">Cover letter</h4>
              <div className="row" style={{ gap: 6, marginBottom: 10 }}>
                {['AI-draft','Template','None'].map(c => (
                  <button key={c} className={`btn sm${coverLetter === c ? '' : ' ghost'}`} onClick={() => setCoverLetter(c)}>{c}</button>
                ))}
                {coverLetter === 'AI-draft' && <span className="chip chip-accent"><Icon name="sparkle" size={10} /> Draft with Claude</span>}
              </div>
              <textarea className="input" rows={10} defaultValue={`Hi Wiz team,\n\nI'm writing about the Senior Frontend Engineer role. Over the last seven years I've shipped data-dense B2B consoles — most recently at a Series C observability startup where I led the move to a tokenized design system and rebuilt our tables layer for large datasets.\n\nYour focus on craft and the depth of your product surface maps closely to what I'm looking for next. I've attached a tailored resume.\n\n— Yonatan`} />
            </div>
          )}

          {step === 2 && (
            <div>
              <h4 className="section-title">Review</h4>
              <dl style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '10px 14px', margin: 0 }}>
                <dt className="muted">Role</dt><dd>{job?.role || 'Senior Frontend Engineer'} @ {job?.company || 'Wiz'}</dd>
                <dt className="muted">Resume</dt><dd>{resumes.find(r => r.id === resume)?.name}</dd>
                <dt className="muted">Cover letter</dt><dd>{coverLetter}</dd>
                <dt className="muted">Fire webhooks</dt>
                <dd>
                  <label className="row" style={{ gap: 6 }}>
                    <span className={`switch${fireWebhook ? ' on' : ''}`} onClick={() => setFireWebhook(!fireWebhook)} />
                    POST to 3 active webhooks
                  </label>
                </dd>
                <dt className="muted">Status after</dt><dd><StatusChip status="applied" /></dd>
              </dl>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--success-soft)', color: 'var(--success)', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
                <Icon name="check" size={24} stroke={2.25} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>Application fired</div>
              <div className="muted">Status updated · 3 webhooks POSTed successfully</div>
              <div className="panel mono-strong" style={{ textAlign: 'left', marginTop: 14, padding: 12, fontSize: 11.5 }}>
                {`POST https://n8n.example.com/webhook/a2f9e1\n→ 200 OK · 214ms\nPOST https://n8n.example.com/webhook/b71d03\n→ 200 OK · 187ms\nPOST https://n8n.example.com/webhook/d913ab\n→ 200 OK · 341ms`.split('\n').map((l, i) => <div key={i}>{l}</div>)}
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <div className="row" style={{ gap: 6 }}>
            {step > 0 && step < 3 && <button className="btn" onClick={() => setStep(step - 1)}>Back</button>}
            {step < 2 && <button className="btn primary" onClick={() => setStep(step + 1)}>Continue <Icon name="arrowRight" size={12} /></button>}
            {step === 2 && <button className="btn primary" onClick={() => setStep(3)}><Icon name="zap" size={12} /> Fire application</button>}
            {step === 3 && <button className="btn primary" onClick={onClose}>Done</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
