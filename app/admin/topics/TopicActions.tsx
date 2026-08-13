'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const NSSA = { medium: '#1C80BC', dark: '#13405E' };

interface GenerateProps {
  title: string;
  category: string;
}

export function GenerateButton({ title, category }: GenerateProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function handleGenerate() {
    setStatus('loading');
    try {
      const res = await fetch('/codex/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custom:   true,
          title:    title,
          topic:    title,
          category: category === 'IRMAA' ? 'irmaa' : 'social-security',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');
      setStatus('done');
      if (data.pageId) {
        router.push(`/admin/kb-review/${data.pageId}`);
      } else {
        router.refresh();
      }
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }

  if (status === 'loading') return (
    <span style={{ fontSize: 12, color: '#0369a1', fontWeight: 600 }}>Generating…</span>
  );
  if (status === 'error') return (
    <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>Failed — retry</span>
  );

  return (
    <button
      onClick={handleGenerate}
      style={{
        fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 6,
        border: `1px solid ${NSSA.medium}`, background: 'transparent',
        color: NSSA.medium, cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >
      Generate
    </button>
  );
}
