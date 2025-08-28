// Lightweight persistence utilities for PoC snapshot and run log storage
// Safe to import in browser builds: functions no-op when Node.js fs is unavailable

import path from 'node:path';

type RawEventData = {
  sourceId: string;
  rawContent: any;
  extractedAt: Date;
  contentHash: string;
  sourceUrl: string;
};

type RunLog = {
  run_id: string;
  source_id: string;
  started_at: string; // ISO
  finished_at: string; // ISO
  status: 'success' | 'fail' | 'partial' | 'no_new_data' | 'skipped' | 'cache_hit';
  fetched_count: number;
  parsed_count: number;
  upserted_count: number;
  error_summary?: string;
  snapshot_paths?: string[];
};

function isNodeEnv(): boolean {
  // Detect Node.js environment safely
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g: any = globalThis as any;
  return !!(g?.process?.versions?.node);
}

async function getFs(): Promise<typeof import('node:fs/promises') | null> {
  if (!isNodeEnv()) return null;
  try {
    const fs = await import('node:fs/promises');
    return fs;
  } catch {
    return null;
  }
}

async function ensureDir(dirPath: string): Promise<void> {
  const fs = await getFs();
  if (!fs) return; // no-op in non-Node
  await fs.mkdir(dirPath, { recursive: true });
}

export async function saveSnapshot(raw: RawEventData, sourceId: string, ext: 'html' | 'ics' | 'xml' | 'json'): Promise<string | null> {
  const fs = await getFs();
  if (!fs) return null;

  const date = new Date(raw.extractedAt);
  const dateDir = date.toISOString().slice(0, 10); // YYYY-MM-DD
  const baseDir = path.join(process.cwd(), 'var', 'snapshots', sourceId, dateDir);
  await ensureDir(baseDir);

  const fileName = `${raw.contentHash}.${ext}`;
  const filePath = path.join(baseDir, fileName);

  try {
    // Write as UTF-8 text for readability
    const content = typeof raw.rawContent === 'string' ? raw.rawContent : JSON.stringify(raw.rawContent, null, 2);
    await fs.writeFile(filePath, content, 'utf8');
    return filePath;
  } catch {
    return null;
  }
}

export async function writeRunLog(entry: RunLog): Promise<string | null> {
  const fs = await getFs();
  if (!fs) return null;

  const dateDir = entry.started_at.slice(0, 10);
  const baseDir = path.join(process.cwd(), 'var', 'runlogs', dateDir);
  await ensureDir(baseDir);
  const filePath = path.join(baseDir, `${entry.run_id}.json`);
  try {
    await fs.writeFile(filePath, JSON.stringify(entry, null, 2), 'utf8');
    return filePath;
  } catch {
    return null;
  }
}

