// Every recorded request carries a stamp: a hash of the harness code and the
// prompt files, so the scorer can refuse results from another version.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, openSync, closeSync, unlinkSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

export function runStamp() {
  const h = createHash('sha256');
  const files = [
    ...['lib/client.mjs', 'lib/rand.mjs', 'lib/stamp.mjs', '02-run.mjs'].map((f) => join(ROOT, f)),
    ...readdirSync(join(ROOT, 'prompts')).sort().map((f) => join(ROOT, 'prompts', f)),
  ];
  for (const f of files) h.update(f.replace(ROOT, '')).update(readFileSync(f));
  return h.digest('hex').slice(0, 12);
}

// One writer per results file: a second run on the same file refuses to start.
export function lock(file) {
  const lockFile = `${file}.lock`;
  if (existsSync(lockFile)) throw new Error(`${lockFile} exists: another run is writing ${file}`);
  closeSync(openSync(lockFile, 'wx'));
  const release = () => {
    try {
      unlinkSync(lockFile);
    } catch {}
  };
  process.on('exit', release);
  process.on('SIGINT', () => process.exit(130));
  return release;
}
