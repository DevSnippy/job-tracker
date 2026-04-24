// Shared shell — sidebar, topbar, app context
const { useState, useMemo, useEffect, useRef, useCallback } = React;

const NAV = [
  { group: "Workspace", items: [
    { id: "jobs", label: "Jobs", icon: "briefcase", count: 16 },
    { id: "tracker", label: "Tracker", icon: "kanban", count: 8 },
    { id: "dashboard", label: "Dashboard", icon: "home" },
  ]},
  { group: "Documents", items: [
    { id: "resumes", label: "Resumes", icon: "doc", count: 4 },
    { id: "editor", label: "Resume Editor", icon: "edit" },
  ]},
  { group: "Account", items: [
    { id: "profile", label: "My Profile", icon: "user" },
    { id: "integrations", label: "Integrations", icon: "plug", count: 3 },
    { id: "settings", label: "Settings", icon: "settings" },
  ]},
];

const Sidebar = ({ active, onNavigate }) => {
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
              className={`nav-item${active === it.id ? " active" : ""}`}
              onClick={() => onNavigate(it.id)}
            >
              <Icon className="icon" name={it.icon} />
              <span>{it.label}</span>
              {it.count != null && <span className="count">{it.count}</span>}
            </button>
          ))}
        </div>
      ))}

      <div className="sidebar-footer">
        <div className="avatar">YL</div>
        <div className="user-block">
          <div className="name">Yonatan Levi</div>
          <div className="mail">yonatan@pm.me</div>
        </div>
        <button className="icon-btn" title="Log out"><Icon name="logout" /></button>
      </div>
    </aside>
  );
};

const Topbar = ({ crumbs = [], actions = null }) => (
  <div className="topbar">
    <div className="breadcrumbs">
      {crumbs.map((c, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="sep"><Icon name="chevronRight" size={11} /></span>}
          <span className={`crumb${i === crumbs.length - 1 ? " last" : ""}`}>{c}</span>
        </React.Fragment>
      ))}
    </div>
    <div className="topbar-spacer" />
    <div className="topbar-actions">
      <div className="chip chip-success dot"><span>Backend · connected</span></div>
      <div className="sep" />
      {actions}
    </div>
  </div>
);

const CompanyLogo = ({ company, color }) => (
  <span className="company-logo" style={{ background: color }}>
    {company.trim()[0].toUpperCase()}
  </span>
);

const StatusChip = ({ status }) => {
  const { STATUS_CONFIG } = window.JT_DATA;
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.saved;
  return <span className={`chip ${cfg.chip} dot`} style={{ color: cfg.color }}>{cfg.label}</span>;
};

const StageBar = ({ stage }) => {
  const stages = ["S", "I", "A", "C", "O"];
  return (
    <div className="stage-bar">
      {stages.map((s, i) => (
        <span key={i} className={`st ${i < stage ? "done" : ""}${i === stage ? " current" : ""}`}>{s}</span>
      ))}
    </div>
  );
};

Object.assign(window, { Sidebar, Topbar, CompanyLogo, StatusChip, StageBar });
