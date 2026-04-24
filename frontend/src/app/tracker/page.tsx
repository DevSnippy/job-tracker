'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Topbar from '@/components/Topbar';
import Icon from '@/components/ui/Icon';
import { STAGES } from '@/lib/data';
import { api } from '@/lib/api';
import type { Job } from '@/lib/types';

function KanbanCard({ job, onClick }: { job: Job; onClick: () => void }) {
  return (
    <div
      className="panel"
      style={{ padding: 10, cursor: 'pointer', background: 'var(--surface)' }}
      onClick={onClick}
    >
      <div className="row" style={{ gap: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: 5, background: job.color, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{job.logo}</div>
        <div style={{ fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{job.company}</div>
      </div>
      <div style={{ fontSize: 12, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-2)' }}>{job.role}</div>
      <div className="row" style={{ marginTop: 8, justifyContent: 'space-between' }}>
        <span className="muted mono" style={{ fontSize: 11 }}>{job.loc}</span>
        <span className="muted mono" style={{ fontSize: 11 }}>{job.posted}</span>
      </div>
      {job.stack && job.stack.length > 0 && (
        <div className="row" style={{ gap: 3, marginTop: 6, flexWrap: 'wrap' }}>
          {job.stack.slice(0, 3).map(t => <span key={t} className="chip mono" style={{ fontSize: 9.5 }}>{t}</span>)}
        </div>
      )}
    </div>
  );
}

export default function TrackerPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    api.jobs.list().then(data => setJobs(data as Job[])).catch(() => {});
  }, []);

  const byStage = STAGES.map((_, i) => jobs.filter(j => j.stage === i));

  return (
    <AppShell>
      <div className="page">
        <Topbar crumbs={['Workspace', 'Tracker']} actions={
          <>
            <button className="btn ghost"><Icon name="filter" size={12} /> Filters</button>
            <button className="btn primary"><Icon name="plus" /> Add</button>
          </>
        } />

        <div style={{ flex: 1, overflow: 'auto', padding: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STAGES.length}, minmax(240px, 1fr))`, gap: 10, minWidth: 0 }}>
            {STAGES.map((st, i) => (
              <div
                key={st}
                className="panel"
                style={{ background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 120px)' }}
              >
                <div className="panel-header" style={{ borderBottom: 0, paddingBottom: 4 }}>
                  <span>{st}</span>
                  <span className="mono-strong muted">{byStage[i].length}</span>
                  <button className="icon-btn" style={{ marginLeft: 'auto' }}><Icon name="plus" size={12} /></button>
                </div>
                <div style={{ padding: '0 8px 8px', display: 'flex', flexDirection: 'column', gap: 6, overflow: 'auto' }}>
                  {byStage[i].map(j => (
                    <KanbanCard
                      key={j.id}
                      job={j}
                      onClick={() => router.push(`/jobs/${j.id}`)}
                    />
                  ))}
                  {byStage[i].length === 0 && (
                    <div style={{ padding: '20px 8px', textAlign: 'center', color: 'var(--text-3)', fontSize: 12 }}>
                      No jobs in {st.toLowerCase()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
