'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Icon from './ui/Icon';
import { api } from '@/lib/api';

const NAV = [
  { group: "Workspace", items: [
    { id: "jobs", label: "Jobs", icon: "briefcase", count: 16, href: "/jobs" },
    { id: "tracker", label: "Tracker", icon: "kanban", count: 8, href: "/tracker" },
    { id: "dashboard", label: "Dashboard", icon: "home", href: "/dashboard" },
  ]},
  { group: "Documents", items: [
    { id: "resumes", label: "Resumes", icon: "doc", count: 4, href: "/resumes" },
    { id: "editor", label: "Resume Editor", icon: "edit", href: "/editor" },
  ]},
  { group: "Account", items: [
    { id: "profile", label: "My Profile", icon: "user", href: "/profile" },
    { id: "integrations", label: "Integrations", icon: "plug", count: 3, href: "/integrations" },
    { id: "settings", label: "Settings", icon: "settings", href: "/settings" },
  ]},
];

interface SidebarProps {
  onThemeToggle?: () => void;
  theme?: string;
}

export default function Sidebar({ onThemeToggle, theme }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    api.user.get().then(u => {
      setName(u.name);
      setEmail(u.email);
    }).catch(() => {});
  }, []);

  const initials = name
    ? name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const isActive = (href: string) => {
    if (href === '/jobs') return pathname === '/jobs' || pathname.startsWith('/jobs/');
    return pathname === href;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-mark">jt</div>
        <div className="workspace-switch">
          <div className="ws-name">Job Tracker</div>
          <div className="ws-plan">Personal · Pro</div>
        </div>
        <button className="icon-btn" title="Notifications"><Icon name="bell" /></button>
      </div>

      <div className="sidebar-search">
        <Icon name="search" size={13} />
        <span>Search everything</span>
        <span className="kbd">⌘K</span>
      </div>

      {NAV.map(sec => (
        <div className="nav-section" key={sec.group}>
          <div className="nav-section-label">{sec.group}</div>
          {sec.items.map(it => (
            <button
              key={it.id}
              className={`nav-item${isActive(it.href) ? " active" : ""}`}
              onClick={() => router.push(it.href)}
            >
              <Icon className="nav-icon" name={it.icon} />
              <span>{it.label}</span>
              {it.count != null && <span className="count">{it.count}</span>}
            </button>
          ))}
        </div>
      ))}

      <div className="sidebar-footer">
        <div className="avatar">{initials}</div>
        <div className="user-block">
          <div className="name">{name || '—'}</div>
          <div className="mail">{email || '—'}</div>
        </div>
        {onThemeToggle && (
          <button className="icon-btn" title="Toggle theme" onClick={onThemeToggle}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
          </button>
        )}
      </div>
    </aside>
  );
}
