'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Topbar from '@/components/Topbar';
import Icon from '@/components/ui/Icon';
import { api } from '@/lib/api';
import type { ResumeAPI } from '@/lib/api';

export default function ResumesPage() {
  const router = useRouter();
  const [dragOver, setDragOver] = useState(false);
  const [items, setItems] = useState<ResumeAPI[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.resumes.list().then(setItems).catch(() => {});
  }, []);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      api.resumes.upload(file)
        .then(r => setItems(prev => [r, ...prev]))
        .catch(() => {});
    });
  };

  return (
    <AppShell>
      <div className="page">
        <Topbar crumbs={['Documents', 'Resumes']} actions={
          <>
            <button className="btn ghost"><Icon name="sparkle" /> Tailor to job</button>
            <button className="btn primary" onClick={() => fileRef.current?.click()}><Icon name="upload" /> Upload resumes</button>
          </>
        } />

        <div className="page-body" style={{ padding: 22 }}>
          <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.txt" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />

          <div
            className={`dropzone${dragOver ? ' active' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            onClick={() => fileRef.current?.click()}
          >
            <Icon name="upload" size={22} />
            <div style={{ fontSize: 14, fontWeight: 500, margin: '8px 0 2px', color: 'var(--text)' }}>Drop resumes here or click to browse</div>
            <div style={{ fontSize: 12 }}>PDF, DOCX, TXT · up to 10 MB each · multi-upload supported</div>
          </div>

          <h4 className="section-title" style={{ marginTop: 24 }}>Your resumes · {items.length}</h4>
          <div className="panel">
            <table className="data">
              <thead>
                <tr>
                  <th>Name</th><th>Template</th><th>Tags</th><th>Pages</th><th>Size</th><th>Updated</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map(r => (
                  <tr key={r.id}>
                    <td className="company-cell">
                      <Icon name="doc" />
                      <span style={{ fontWeight: 500 }}>{r.name}</span>
                      {r.default && <span className="chip chip-accent">default</span>}
                    </td>
                    <td className="muted">{r.template}</td>
                    <td><span className="row" style={{ gap: 4 }}>{r.tags.map(t => <span key={t} className="chip">{t}</span>)}</span></td>
                    <td className="mono-strong">{r.pages}</td>
                    <td className="mono-strong">{r.size}</td>
                    <td className="muted">{r.updated}</td>
                    <td>
                      <div className="row" style={{ gap: 2, justifyContent: 'flex-end' }}>
                        <button className="icon-btn" title="Edit" onClick={() => router.push('/editor')}><Icon name="edit" /></button>
                        <button className="icon-btn" title="Download"><Icon name="download" /></button>
                        <button className="icon-btn" title="More"><Icon name="dotsV" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
