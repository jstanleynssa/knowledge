'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

const NSSA = { medium: '#1C80BC', dark: '#13405E' };

interface GenerateProps {
  title: string;
  slug: string;
  category: string;
}

export function GenerateButton({ title, slug, category }: GenerateProps) {
  const router = useRouter();
  const [status, setStatus] = useState<'idle' | 'queued' | 'running' | 'done' | 'error'>('idle');
  const [jobId, setJobId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Elapsed timer while generating
  useEffect(() => {
    if (status === 'queued' || status === 'running') {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [status]);

  // Poll for job completion
  useEffect(() => {
    if (!jobId) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/codex/api/admin/generate-status?job_id=${jobId}`);
        const data = await res.json();
        if (!data.ok) return;
        const job = data.job;
        if (job.status === 'running') { setStatus('running'); return; }
        if (job.status === 'done') {
          if (pollRef.current) clearInterval(pollRef.current);
          setStatus('done');
          setTimeout(() => {
            if (job.page_id) router.push(`/admin/kb-review/${job.page_id}`);
            else router.refresh();
          }, 800);
        }
        if (job.status === 'error') {
          if (pollRef.current) clearInterval(pollRef.current);
          setStatus('error');
          setTimeout(() => setStatus('idle'), 4000);
        }
      } catch { /* non-fatal poll failure — keep trying */ }
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [jobId, router]);

  async function handleGenerate() {
    setStatus('queued');
    try {
      const res = await fetch('/codex/api/admin/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          custom:   true,
          title,
          slug,
          topic:    title,
          category: category === 'IRMAA' ? 'irmaa' : 'social-security',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to queue');
      setJobId(data.jobId);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }

  if (status === 'queued') return (
    <span style={{ fontSize: 12, color: '#0369a1', fontWeight: 600 }}>Queued…</span>
  );
  if (status === 'running') return (
    <span style={{ fontSize: 12, color: '#0369a1', fontWeight: 600 }}>Generating… {elapsed}s</span>
  );
  if (status === 'done') return (
    <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>✓ Done — opening…</span>
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
