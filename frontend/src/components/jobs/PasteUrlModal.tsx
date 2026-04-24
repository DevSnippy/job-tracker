'use client';
import { useState } from 'react';
import Icon from '../ui/Icon';
import { api } from '@/lib/api';

interface PasteUrlModalProps {
  onClose: () => void;
  onTailor: (jobId: string) => void;
}

export default function PasteUrlModal({ onClose, onTailor }: PasteUrlModalProps) {
  const [url, setUrl] = useState('');
  const [stage, setStage] = useState<'idle' | 'fetching' | 'done' | 'error'>('idle');
  const [jobId, setJobId] = useState<string | null>(null);
  const [parsed, setParsed] = useState<null | { company: string; role: string; loc: string; remote: string; stack: string[]; source: string }>(null);

  const run = async () => {
    if (!url) return;
    setStage('fetching');
    try {
      const data = await api.jobs.fetchUrl(url);
      const words = data.text.toLowerCase();
      const company = data.title.split(/[-|·]/)[1]?.trim() || data.title.split(/[-|·]/)[0]?.trim() || 'Unknown';
      const role = data.title.split(/[-|·]/)[0]?.trim() || 'Software Engineer';
      const job = await api.jobs.create({ company, role, url, description: data.text.slice(0, 4000), source: 'url' });
      setParsed({ company: job.company, role: job.role, loc: job.loc || 'Remote', remote: job.remote || 'Hybrid', stack: job.stack || [], source: url });
      setJobId(job.id);
      setStage('done');
    } catch {
      setStage('error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="panel" style={{ width: 560, boxShadow: 'var(--shadow-lg)' }} onClick={e => e.stopPropagation()}>
        <div className="panel-header">
          <Icon name="link" /> Add job from URL
          <span style={{ flex: 1 }} />
          <button className="icon-btn" onClick={onClose}><Icon name="close" /></button>
        </div>
        <div style={{ padding: 16 }}>
          <label className="field-label">Paste any job posting URL</label>
          <div className="row" style={{ gap: 6 }}>
            <input className="input mono" placeholder="https://elementor.com/careers/position/full-stack-developer" value={url} onChange={e => setUrl(e.target.value)} />
            <button className="btn primary" onClick={run} disabled={stage === 'fetching'}>
              {stage === 'fetching' ? <><Icon name="refresh" size={12} /> Fetching…</> : 'Fetch'}
            </button>
          </div>
          <div className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>Backend tunnels to the page, extracts structured fields, and optionally tailors your resume.</div>

          {stage === 'error' && (
            <div className="panel" style={{ marginTop: 14, padding: 12, borderColor: 'var(--danger)' }}>
              <span className="chip chip-danger">Failed to fetch URL</span>
              <span className="muted" style={{ marginLeft: 8, fontSize: 12 }}>Check the URL is accessible and try again.</span>
            </div>
          )}

          {stage === 'fetching' && (
            <div className="panel mono" style={{ marginTop: 14, padding: 12, fontSize: 11, background: 'var(--surface-2)' }}>
              <div>→ GET {url || '…'}</div>
              <div>→ parsing HTML / JSON-LD</div>
              <div>→ extracting: company, role, location, stack</div>
              <div className="muted">… 1.2s</div>
            </div>
          )}

          {stage === 'done' && parsed && (
            <div className="panel" style={{ marginTop: 14, padding: 14 }}>
              <div className="row" style={{ gap: 10, marginBottom: 10 }}>
                <span className="chip chip-success dot">Parsed</span>
                <span className="muted mono-strong">{parsed.source}</span>
              </div>
              <dl style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '6px 12px', margin: 0 }}>
                <dt className="muted">Company</dt><dd style={{ fontWeight: 500 }}>{parsed.company}</dd>
                <dt className="muted">Role</dt><dd style={{ fontWeight: 500 }}>{parsed.role}</dd>
                <dt className="muted">Location</dt><dd>{parsed.loc} · {parsed.remote}</dd>
                <dt className="muted">Stack</dt>
                <dd><span className="row" style={{ gap: 4, flexWrap: 'wrap' }}>{parsed.stack.map(s => <span key={s} className="chip chip-accent">{s}</span>)}</span></dd>
              </dl>
              <div className="row" style={{ gap: 6, marginTop: 14, justifyContent: 'flex-end' }}>
                <button className="btn" onClick={onClose}>Save only</button>
                <button className="btn primary" onClick={() => jobId && onTailor(jobId)}><Icon name="sparkle" size={12} /> Tailor resume now</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
