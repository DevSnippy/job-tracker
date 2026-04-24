'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Topbar from '@/components/Topbar';
import Icon from '@/components/ui/Icon';
import { api } from '@/lib/api';
import type { JobAPI } from '@/lib/api';

const UPCOMING = [
  { t: 'Interview · Fiverr',  s: 'Technical · Round 2', when: 'Tomorrow · 10:30', dot: 'var(--warn)' },
  { t: 'Follow-up · Wiz',     s: 'Email recruiter',     when: 'Apr 26 · 09:00', dot: 'var(--accent)' },
  { t: 'Offer deadline',      s: 'Papaya Global',        when: 'Apr 28 · 18:00', dot: 'var(--success)' },
  { t: 'Intro call · Deel',   s: 'Screening',            when: 'May 02 · 15:00', dot: 'var(--info)' },
];

export default function DashboardPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<JobAPI[]>([]);

  useEffect(() => {
    api.jobs.list().then(setJobs).catch(() => {});
  }, []);

  const stats = [
    { label: 'Saved',      value: jobs.filter(j => j.status === 'saved').length,      delta: 'in pipeline' },
    { label: 'Applied',    value: jobs.filter(j => j.status === 'applied').length,     delta: 'applications sent' },
    { label: 'Interviews', value: jobs.filter(j => j.status === 'interview').length,   delta: 'in progress' },
    { label: 'Offers',     value: jobs.filter(j => j.status === 'offer').length,       delta: 'active' },
  ];

  const recentJobs = jobs.slice(0, 5);

  return (
    <AppShell>
      <div className="page">
        <Topbar crumbs={['Workspace', 'Dashboard']} actions={
          <>
            <button className="btn ghost"><Icon name="refresh" /> Sync techmap</button>
            <button className="btn primary" onClick={() => router.push('/jobs')}><Icon name="briefcase" /> Open jobs</button>
          </>
        } />

        <div className="page-body">
          <div className="stat-grid">
            {stats.map(s => (
              <div className="stat" key={s.label}>
                <div className="label">{s.label}</div>
                <div className="value">{s.value}</div>
                <div className="delta">{s.delta}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '0 14px 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="panel">
              <div className="panel-header">
                Upcoming
                <span className="subtitle">interviews · deadlines · follow-ups</span>
              </div>
              <div style={{ padding: '6px 0' }}>
                {UPCOMING.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderTop: i ? '1px solid var(--border)' : undefined }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.dot, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500 }}>{r.t}</div>
                      <div className="muted" style={{ fontSize: 11.5 }}>{r.s}</div>
                    </div>
                    <span className="mono-strong">{r.when}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                Recent activity
                <span className="subtitle">last 7 days</span>
              </div>
              <div style={{ padding: '6px 0' }}>
                {[
                  { t: 'Applied to Wiz',           s: 'Senior Frontend Engineer',   when: '2h ago',  dot: 'var(--accent)' },
                  { t: 'Resume tailored',           s: 'Elementor · General.pdf',    when: '5h ago',  dot: 'var(--success)' },
                  { t: 'Saved Lightricks',          s: 'ML Engineer, GenAI',         when: '1d ago',  dot: 'var(--text-3)' },
                  { t: 'Interview scheduled',       s: 'Fiverr · Technical R2',      when: '2d ago',  dot: 'var(--warn)' },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', borderTop: i ? '1px solid var(--border)' : undefined }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.dot, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 500 }}>{r.t}</div>
                      <div className="muted" style={{ fontSize: 11.5 }}>{r.s}</div>
                    </div>
                    <span className="muted mono" style={{ fontSize: 11 }}>{r.when}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: '0 14px 18px' }}>
            <div className="panel">
              <div className="panel-header">
                Recent jobs
                <span className="subtitle">{recentJobs.length} of {jobs.length}</span>
                <button className="btn sm ghost" style={{ marginLeft: 'auto' }} onClick={() => router.push('/jobs')}>
                  View all <Icon name="external" size={11} />
                </button>
              </div>
              <table className="data">
                <thead>
                  <tr>
                    <th>Company</th><th>Role</th><th>Location</th><th>Status</th><th>Posted</th>
                  </tr>
                </thead>
                <tbody>
                  {recentJobs.map(j => (
                    <tr key={j.id} style={{ cursor: 'pointer' }} onClick={() => router.push(`/jobs/${j.id}`)}>
                      <td className="company-cell">
                        <div style={{ width: 24, height: 24, borderRadius: 5, background: j.color, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{j.logo}</div>
                        <span style={{ fontWeight: 500 }}>{j.company}</span>
                      </td>
                      <td>{j.role}</td>
                      <td className="muted">{j.loc}</td>
                      <td><span className={`chip${j.status === 'offer' ? ' chip-success' : j.status === 'interview' ? ' chip-warn' : ''}`}>{j.status}</span></td>
                      <td className="muted mono">{j.posted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
