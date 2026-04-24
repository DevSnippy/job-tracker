'use client';
import { STATUS_CONFIG } from '@/lib/data';
import type { JobStatus } from '@/lib/types';

export default function StatusChip({ status }: { status: JobStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.saved;
  return (
    <span className={`chip ${cfg.chip} dot`} style={{ color: cfg.color }}>
      {cfg.label}
    </span>
  );
}
