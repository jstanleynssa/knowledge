'use client';

import { useState } from 'react';

const NSSA_DARK = '#13405E';
const G = { text: '#6b7280', border: '#e5e7eb' };

export function GenerateButton({ remaining }: { remaining: number }) {
  const [category, setCategory] = useState<'all' | 'social-security' | 'irmaa'>('all');
  const [requested, setRequested] = useState(false);

  if (remaining === 0) return null;

  const label = category === 'irmaa' ? 'IRMAA' : category === 'social-security' ? 'Social Security' : '';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <select
        value={category}
        onChange={e => { setCategory(e.target.value as any); setRequested(false); }}
        style={{
          fontSize: 12, padding: '5px 8px', borderRadius: 6,
          border: `1px solid ${G.border}`, background: '#fff',
          color: '#374151', cursor: 'pointer',
        }}
      >
        <option value="all">All topics</option>
        <option value="social-security">Social Security</option>
        <option value="irmaa">IRMAA</option>
      </select>
      {!requested ? (
        <button
          onClick={() => setRequested(true)}
          style={{
            fontSize: 13, fontWeight: 700, padding: '6px 14px', borderRadius: 6,
            border: 'none', background: NSSA_DARK,
            color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          + Give me more
        </button>
      ) : (
        <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>
          ✓ Ask Tank to generate 5{label ? ` ${label}` : ''} pages
        </span>
      )}
    </div>
  );
}
