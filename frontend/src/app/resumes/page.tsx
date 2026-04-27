'use client';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/AppShell';
import Topbar from '@/components/Topbar';
import Icon from '@/components/ui/Icon';
import { api } from '@/lib/api';
import type { ResumeAPI } from '@/lib/api';

function ConfirmModal({ title, message, onConfirm, onCancel }: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onConfirm, onCancel]);

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,.4)',
        display: 'grid', placeItems: 'center',
      }}
      onMouseDown={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: 24, width: 360,
        boxShadow: '0 20px 60px rgba(0,0,0,.2)',
      }}>
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20, lineHeight: 1.5 }}>{message}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn ghost" onClick={onCancel}>Cancel</button>
          <button
            className="btn"
            style={{ background: 'var(--danger)', color: '#fff', borderColor: 'transparent' }}
            onClick={onConfirm}
            autoFocus
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ResumeMenu({ resume, onRename, onDelete, onSetDefault }: {
  resume: ResumeAPI;
  onRename: () => void;
  onDelete: () => void;
  onSetDefault: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideBtn = btnRef.current?.contains(target);
      const insideMenu = menuRef.current?.contains(target);
      if (!insideBtn && !insideMenu) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }
    setOpen(o => !o);
  };

  const items = [
    { label: 'Rename', icon: 'edit' as const, action: onRename },
    ...(!resume.default ? [{ label: 'Set as default', icon: 'check' as const, action: onSetDefault }] : []),
    { label: 'Delete', icon: 'trash' as const, action: onDelete, danger: true },
  ];

  return (
    <>
      <button ref={btnRef} className="icon-btn" title="More" onClick={toggle}>
        <Icon name="dotsV" />
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed', top: pos.top, right: pos.right, zIndex: 9999,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,.12)',
            minWidth: 160, padding: '4px 0',
          }}
        >
          {items.map(item => (
            <button
              key={item.label}
              onClick={() => { setOpen(false); item.action(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', padding: '7px 12px', background: 'none', border: 'none',
                cursor: 'pointer', fontSize: 13, textAlign: 'left',
                color: (item as { danger?: boolean }).danger ? 'var(--danger)' : 'var(--text)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <Icon name={item.icon} size={13} />
              {item.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}

export default function ResumesPage() {
  const router = useRouter();
  const [dragOver, setDragOver] = useState(false);
  const [items, setItems] = useState<ResumeAPI[]>([]);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ResumeAPI | null>(null);
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

  const startRename = (r: ResumeAPI) => {
    setRenamingId(r.id);
    setRenameVal(r.name);
  };

  const commitRename = (id: string) => {
    const name = renameVal.trim();
    if (!name) { setRenamingId(null); return; }
    api.resumes.update(id, { name })
      .then(updated => setItems(prev => prev.map(r => r.id === id ? { ...r, name: updated.name } : r)))
      .catch(() => {});
    setRenamingId(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    api.resumes.delete(id)
      .then(() => setItems(prev => prev.filter(r => r.id !== id)))
      .catch(() => {});
  };

  const handleSetDefault = (id: string) => {
    api.resumes.update(id, { default: true })
      .then(() => setItems(prev => prev.map(r => ({ ...r, default: r.id === id }))))
      .catch(() => {});
  };

  return (
    <AppShell>
      <div className="page">
        <Topbar crumbs={['Documents', 'Resumes']} actions={
          <>
            <button className="btn ghost"><Icon name="sparkle" /> Tailor to job</button>
            <button className="btn" onClick={() => fileRef.current?.click()}><Icon name="upload" /> Upload</button>
            <button className="btn primary" onClick={() => {
              api.resumes.create({ name: 'New Resume' })
                .then(r => router.push(`/editor?id=${r.id}`))
                .catch(() => {});
            }}><Icon name="plus" size={12} /> New resume</button>
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
                  <th style={{ width: 96 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map(r => (
                  <tr key={r.id}>
                    <td className="company-cell">
                      <Icon name="doc" />
                      {renamingId === r.id ? (
                        <input
                          className="input"
                          style={{ padding: '2px 6px', height: 26, fontSize: 13 }}
                          value={renameVal}
                          autoFocus
                          onChange={e => setRenameVal(e.target.value)}
                          onBlur={() => commitRename(r.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitRename(r.id);
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                        />
                      ) : (
                        <span style={{ fontWeight: 500 }}>{r.name}</span>
                      )}
                      {r.default && <span className="chip chip-accent">default</span>}
                    </td>
                    <td className="muted">{r.template}</td>
                    <td><span className="row" style={{ gap: 4 }}>{(r.tags ?? []).map(t => <span key={t} className="chip">{t}</span>)}</span></td>
                    <td className="mono-strong">{r.pages}</td>
                    <td className="mono-strong">{r.size}</td>
                    <td className="muted">{r.updated}</td>
                    <td>
                      <div className="row" style={{ gap: 2, justifyContent: 'flex-end' }}>
                        <button className="icon-btn" title="Edit" onClick={() => router.push(`/editor?id=${r.id}`)}><Icon name="edit" /></button>
                        <button className="icon-btn" title="Download"><Icon name="download" /></button>
                        <ResumeMenu
                          resume={r}
                          onRename={() => startRename(r)}
                          onDelete={() => setDeleteTarget(r)}
                          onSetDefault={() => handleSetDefault(r.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {deleteTarget && (
        <ConfirmModal
          title="Delete resume"
          message={`"${deleteTarget.name}" will be permanently deleted and cannot be recovered.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </AppShell>
  );
}
