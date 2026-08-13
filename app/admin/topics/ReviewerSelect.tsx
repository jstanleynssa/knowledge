'use client';

import { useTransition } from 'react';
import { updateReviewer } from './actions';

const G = { text: '#6b7280', border: '#e5e7eb' };

const REVIEWERS = [
  { value: 'C', label: 'Cindi' },
  { value: 'T', label: 'Todd' },
  { value: 'J', label: 'Jim' },
];

export function ReviewerSelect({ id, current }: { id: number; current: string }) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const reviewer = e.target.value;
    startTransition(async () => {
      await updateReviewer(id, reviewer);
    });
  }

  return (
    <select
      defaultValue={current}
      onChange={handleChange}
      disabled={isPending}
      style={{
        fontSize: 12,
        color: isPending ? G.text : '#111',
        border: `1px solid ${G.border}`,
        borderRadius: 6,
        padding: '3px 6px',
        background: '#fff',
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      {REVIEWERS.map(r => (
        <option key={r.value} value={r.value}>{r.label}</option>
      ))}
    </select>
  );
}
