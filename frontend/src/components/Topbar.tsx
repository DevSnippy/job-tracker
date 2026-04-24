'use client';
import React from 'react';
import Icon from './ui/Icon';

interface TopbarProps {
  crumbs: string[];
  actions?: React.ReactNode;
}

export default function Topbar({ crumbs, actions }: TopbarProps) {
  return (
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
        <div className="vsep" />
        {actions}
      </div>
    </div>
  );
}
