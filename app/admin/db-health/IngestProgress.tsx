'use client';

import { useEffect, useState } from 'react';

interface IngestStat {
  running: boolean;
  done: boolean;
  current: number;
  total: number;
  pct: number;
  alreadyDone: number;
  inserted: number;
  unchanged: number;
  updated: number;
  skipped: number;
  errors: number;
  fetched: number;
  startedAt: string;
  lastLine: string;
}

interface EmbedStat {
  running: boolean;
  done: boolean;
  current: number;
  total: number;
  pct: number;
  chunks: number;
}

interface StatusPayload {
  cms:      IngestStat | null;
  medicare: IngestStat | null;
  embed:    EmbedStat  | null;
  ts:       number;
}

const NSSA_MED  = '#1C80BC';
const NSSA_DARK = '#13405E';

function Bar({ pct, color = NSSA_MED, thin = false }: { pct: number; color?: string; thin?: boolean }) {
  return (
    <div style={{ height: thin ? 6 : 10, background: '#E5E7EB', borderRadius: 99, overflow: 'hidden', width: '100%' }}>
      <div style={{
        height: '100%',
        width: `${Math.min(Math.max(pct, pct > 0 ? 1 : 0), 100)}%`,
        background: color,
        borderRadius: 99,
        transition: 'width 0.6s ease',
      }} />
    </div>
  );
}

function IngestCard({ label, stat, color }: { label: string; stat: IngestStat | null; color: string }) {
  if (!stat) {
    return (
      <div style={{ padding: '16px 20px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
        <div style={{ fontWeight: 600, color: NSSA_DARK, marginBottom: 4 }}>{label}</div>
        <div style={{ color: '#9CA3AF', fontSize: 13 }}>No log file found — not started</div>
      </div>
    );
  }

  const statusColor = stat.done ? '#059669' : stat.running ? color : '#6B7280';
  const statusLabel = stat.done ? 'Complete' : stat.running ? 'Running' : 'Stopped';

  return (
    <div style={{ padding: '16px 20px', background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontWeight: 600, color: NSSA_DARK }}>{label}</span>
        <span style={{
          fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 99,
          background: stat.done ? '#D1FAE5' : stat.running ? '#DBEAFE' : '#F3F4F6',
          color: statusColor,
        }}>{statusLabel}</span>
      </div>

      <div style={{ marginBottom: 8 }}>
        <Bar pct={stat.pct} color={color} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B7280', marginBottom: 12 }}>
        <span>{stat.current.toLocaleString()} / {stat.total.toLocaleString()} URLs</span>
        <span style={{ fontWeight: 600, color: NSSA_DARK }}>{stat.pct}%</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[
          { label: 'New',       val: stat.inserted,  color: '#059669' },
          { label: 'Unchanged', val: stat.unchanged, color: '#6B7280' },
          { label: 'Updated',   val: stat.updated,   color: '#D97706' },
          { label: 'Errors',    val: stat.errors,    color: stat.errors > 0 ? '#DC2626' : '#6B7280' },
        ].map(({ label: l, val, color: c }) => (
          <div key={l} style={{ textAlign: 'center', padding: '8px 4px', background: '#F9FAFB', borderRadius: 6 }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: c }}>{val.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>

      {stat.alreadyDone > 0 && (
        <div style={{ marginTop: 10, fontSize: 12, color: '#9CA3AF' }}>
          ↩ Resumed — {stat.alreadyDone.toLocaleString()} already in DB at start
        </div>
      )}
    </div>
  );
}

export function IngestProgress() {
  const [data, setData] = useState<StatusPayload | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStatus = () => {
    fetch('/api/admin/ingest-status')
      .then(r => r.json())
      .then((d: StatusPayload) => { setData(d); setLastUpdated(new Date()); })
      .catch(() => {});
  };

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 10_000);
    return () => clearInterval(id);
  }, []);

  const anyRunning = data?.cms?.running || data?.medicare?.running || data?.embed?.running;

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: NSSA_DARK, margin: 0 }}>Ingest Progress</h2>
        <span style={{ fontSize: 12, color: '#9CA3AF' }}>
          {anyRunning ? '🟢 Live · ' : ''}{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading…'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <IngestCard label="CMS.gov"      stat={data?.cms      ?? null} color={NSSA_MED} />
        <IngestCard label="Medicare.gov" stat={data?.medicare ?? null} color="#7C3AED" />
      </div>

      {/* Embedder */}
      {data?.embed && (
        <div style={{ padding: '14px 20px', background: '#fff', borderRadius: 8, border: '1px solid #E5E7EB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 600, color: NSSA_DARK }}>Embedder (chunk_and_embed.ts)</span>
            <span style={{
              fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 99,
              background: data.embed.done ? '#D1FAE5' : '#DBEAFE',
              color: data.embed.done ? '#059669' : NSSA_MED,
            }}>{data.embed.done ? 'Complete' : 'Running'}</span>
          </div>
          <Bar pct={data.embed.pct} color="#F59E0B" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6B7280', marginTop: 8 }}>
            <span>{data.embed.current.toLocaleString()} / {data.embed.total.toLocaleString()} docs</span>
            <span>{data.embed.chunks.toLocaleString()} chunks written</span>
            <span style={{ fontWeight: 600, color: NSSA_DARK }}>{data.embed.pct}%</span>
          </div>
        </div>
      )}
    </section>
  );
}
