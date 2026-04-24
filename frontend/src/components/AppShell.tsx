'use client';
import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const saved = localStorage.getItem('jt-theme') ?? 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('jt-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <div className="app">
      <Sidebar onThemeToggle={toggleTheme} theme={theme} />
      <div className="main">{children}</div>
    </div>
  );
}
