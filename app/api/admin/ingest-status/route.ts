/**
 * /api/admin/ingest-status
 *
 * Returns live progress of the CMS and Medicare ingest processes by reading
 * the log files. Called by the IngestProgress client component every 10s.
 */

import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

const CMS_LOG     = path.join(process.cwd(), 'tmp', 'cms_ingest.log');
const MEDICARE_LOG = path.join(process.cwd(), 'tmp', 'medicare_ingest.log');
const EMBED_LOG   = path.join(process.cwd(), 'tmp', 'embed_cms.log');

function parseIngestLog(logPath: string, totalUrls: number) {
  if (!fs.existsSync(logPath)) return null;

  const log = fs.readFileSync(logPath, 'utf8');
  const lines = log.trim().split('\n');

  const done = log.includes('ingest complete') || log.includes('Ingestion complete');

  // Find latest progress line: "Progress: X/Y | ..."
  let current = 0;
  let total = totalUrls;
  let inserted = 0, unchanged = 0, updated = 0, skipped = 0, errors = 0;

  // Resuming line: "Resuming: X already ingested, Y remaining"
  const resumeMatch = log.match(/Resuming: (\d+) already ingested, (\d+) remaining/);
  const alreadyDone = resumeMatch ? parseInt(resumeMatch[1]) : 0;

  for (const line of lines) {
    const m = line.match(/Progress: (\d+)\/(\d+) \| new=(\d+) unchanged=(\d+) updated=(\d+) skip=(\d+) err=(\d+)/);
    if (m) {
      current  = parseInt(m[1]);
      total    = parseInt(m[2]);
      inserted = parseInt(m[3]);
      unchanged= parseInt(m[4]);
      updated  = parseInt(m[5]);
      skipped  = parseInt(m[6]);
      errors   = parseInt(m[7]);
    }
  }

  // If done, parse final summary
  if (done) {
    const newM      = log.match(/New:\s+(\d+)/);
    const unchM     = log.match(/Unchanged:\s+(\d+)/);
    const updM      = log.match(/Updated:\s+(\d+)/);
    const skipM     = log.match(/Skipped:\s+(\d+)/);
    const errM      = log.match(/Errors:\s+(\d+)/);
    const totalM    = log.match(/Total:\s+(\d+)/);
    if (newM)   inserted  = parseInt(newM[1]);
    if (unchM)  unchanged = parseInt(unchM[1]);
    if (updM)   updated   = parseInt(updM[1]);
    if (skipM)  skipped   = parseInt(skipM[1]);
    if (errM)   errors    = parseInt(errM[1]);
    if (totalM) total     = parseInt(totalM[1]);
    current = total;
  }

  // Estimate start time from first line timestamp (not available) — use mtime
  const stat = fs.statSync(logPath);
  const startedAt = new Date(stat.birthtime || stat.mtime).toISOString();

  // New URLs fetched this run = current minus skipped (already-done) 
  const fetched = current - skipped;
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return {
    running: !done,
    done,
    current,
    total,
    pct,
    alreadyDone,
    inserted,
    unchanged,
    updated,
    skipped,
    errors,
    fetched,
    startedAt,
    lastLine: lines[lines.length - 1] ?? '',
  };
}

function parseEmbedLog(logPath: string) {
  if (!fs.existsSync(logPath)) return null;
  const log = fs.readFileSync(logPath, 'utf8');
  const done = log.includes('Embedding complete') || log.includes('Done.');

  let current = 0, total = 0, chunks = 0;
  for (const line of log.split('\n')) {
    const m = line.match(/Progress: (\d+)\/(\d+) \| chunks written: (\d+)/);
    if (m) { current = parseInt(m[1]); total = parseInt(m[2]); chunks = parseInt(m[3]); }
  }
  const doneM = log.match(/Embedding complete: (\d+) chunks written/);
  if (doneM) chunks = parseInt(doneM[1]);

  return {
    running: !done,
    done,
    current,
    total,
    pct: total > 0 ? Math.round((current / total) * 100) : 0,
    chunks,
  };
}

export async function GET() {
  return NextResponse.json({
    cms:      parseIngestLog(CMS_LOG, 24490),
    medicare: parseIngestLog(MEDICARE_LOG, 406),
    embed:    parseEmbedLog(EMBED_LOG),
    ts:       Date.now(),
  });
}
