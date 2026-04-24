'use client';

export default function CompanyLogo({ company, color, size = 20 }: { company: string; color: string; size?: number }) {
  return (
    <span
      className="company-logo"
      style={{ background: color, width: size, height: size, fontSize: size * 0.5, flexShrink: 0 }}
    >
      {company.trim()[0].toUpperCase()}
    </span>
  );
}
