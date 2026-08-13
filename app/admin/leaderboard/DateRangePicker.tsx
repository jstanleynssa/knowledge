'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const NAVY = '#064c7c';

export default function DateRangePicker({ from, to }: { from?: string; to?: string }) {
  const router = useRouter();
  const [fromVal, setFromVal] = useState(from ?? '');
  const [toVal,   setToVal  ] = useState(to   ?? '');

  const isActive = !!(from || to);

  function apply() {
    if (!fromVal && !toVal) return;
    const params = new URLSearchParams();
    if (fromVal) params.set('from', fromVal);
    if (toVal)   params.set('to',   toVal);
    router.push(`/admin/leaderboard?${params.toString()}`);
  }

  function clear() {
    setFromVal('');
    setToVal('');
    router.push('/admin/leaderboard');
  }

  const inputStyle: React.CSSProperties = {
    background:  'rgba(255,255,255,.12)',
    border:      '1px solid rgba(255,255,255,.25)',
    borderRadius: 4,
    color:       '#fff',
    fontSize:    12,
    padding:     '3px 7px',
    outline:     'none',
    colorScheme: 'dark',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {/* divider */}
      <span style={{ color: 'rgba(255,255,255,.3)', fontSize: 16, padding: '0 2px' }}>|</span>

      <input
        type="date"
        value={fromVal}
        onChange={e => setFromVal(e.target.value)}
        max={toVal || undefined}
        style={inputStyle}
        aria-label="From date"
      />
      <span style={{ color: 'rgba(255,255,255,.5)', fontSize: 12 }}>–</span>
      <input
        type="date"
        value={toVal}
        onChange={e => setToVal(e.target.value)}
        min={fromVal || undefined}
        style={inputStyle}
        aria-label="To date"
      />

      <button
        onClick={apply}
        style={{
          background:   isActive ? '#fff' : 'rgba(255,255,255,.15)',
          color:        isActive ? NAVY   : '#fff',
          border:       'none',
          borderRadius: 4,
          fontSize:     12,
          fontWeight:   600,
          padding:      '4px 10px',
          cursor:       'pointer',
          transition:   'background .15s',
        }}
      >
        Apply
      </button>

      {isActive && (
        <button
          onClick={clear}
          style={{
            background:   'transparent',
            color:        '#f87171',
            border:       '1px solid rgba(248,113,113,.4)',
            borderRadius: 4,
            fontSize:     11,
            padding:      '3px 8px',
            cursor:       'pointer',
          }}
          aria-label="Clear custom date range"
        >
          ✕ Clear
        </button>
      )}
    </div>
  );
}
