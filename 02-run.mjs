// Stage 2: run one experiment on one model and append every request to
// results/raw/<model>__<experiment>.jsonl.
//
//   node 02-run.mjs <model> <experiment> [size]
//
// Experiments (size defaults to 8k):
//   stable           20 requests, same runbook, a new question each time
//   timestamp-first  20 requests, the current time on the first line of the system prompt
//   timestamp-last   20 requests, the current time after the runbook
//   user-in-middle   20 requests, the on-call engineer's name a quarter of the way in
//   burst            10 at once cold, then 10 at once again; then 1 alone and 10 at once
//   idle             prime 5 prefixes, ask again after 1, 5, 15, 30 and 60 minutes
//   idle-twice       the same, but each prefix sent twice first; gaps 1, 5, 15 and 30 minutes
//   idle-short       8 prefixes, each sent twice, then again after 5, 15, 30 or 45 seconds
//   sweep            sizes 1k, 4k, 16k and 64k: 6 requests each
//   cold-sizes       the same sizes, 5 requests each, every one on a new prefix (all misses)
//   cache-key        4 prefixes: key A twice, then key B, key A, no key and key B again
//   key-ab           4 rounds of two new prefixes, one sent with a prompt_cache_key and
//                    one without, 8 requests each, taking turns
//
// Each experiment starts from a prefix the cache has never seen: a random
// revision id on the first line, the same for every request of that experiment.
import { appendFileSync, readFileSync, mkdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { chat } from './lib/client.mjs';
import { runStamp, lock } from './lib/stamp.mjs';

const [model, experiment, sizeArg] = process.argv.slice(2);
if (!model || !experiment) {
  console.error('usage: node 02-run.mjs <model> <experiment> [size]');
  process.exit(2);
}
const ROOT = new URL('.', import.meta.url).pathname;
const runbook = (size) => readFileSync(`${ROOT}prompts/runbook-${size}.md`, 'utf8');
const questions = JSON.parse(readFileSync(`${ROOT}prompts/questions.json`, 'utf8'));
const size = sizeArg || '8k';
const stamp = runStamp();
mkdirSync(`${ROOT}results/raw`, { recursive: true });
const outFile = `${ROOT}results/raw/${model}__${experiment}.jsonl`;
lock(outFile);

const revision = () => `Runbook revision r-${randomBytes(6).toString('hex')}\n\n`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const engineers = ['Ana', 'Bilal', 'Chen', 'Dara', 'Emeka', 'Fatima', 'Goran', 'Hana', 'Ivan', 'Jun', 'Kofi', 'Lena', 'Mateo', 'Nia', 'Omar', 'Petra', 'Quinn', 'Rui', 'Sven', 'Tara'];

// Retries 429 and 5xx up to 3 times. Only the attempt that succeeded is timed;
// refused attempts are counted apart, so a backoff never shows up as latency.
async function ask(meta, system, user, cacheKey) {
  const refusals = [];
  for (let attempt = 0; attempt < 4; attempt++) {
    const startedAt = new Date().toISOString();
    const r = await chat({ model, system, user, cacheKey });
    if (r.ok || (r.status !== 429 && r.status < 500 && r.status !== 0)) {
      const rec = { stamp, model, experiment, size: meta.size ?? size, startedAt, refused: refusals.length, refusals, ...meta, ...r };
      appendFileSync(outFile, JSON.stringify(rec) + '\n');
      return rec;
    }
    refusals.push({ status: r.status, error: r.error, ms: r.totalMs });
    await sleep(2000 * 2 ** attempt);
  }
  const rec = { stamp, model, experiment, size: meta.size ?? size, startedAt: new Date().toISOString(), refused: refusals.length, refusals, ...meta, ok: false, error: 'gave up after 4 attempts' };
  appendFileSync(outFile, JSON.stringify(rec) + '\n');
  return rec;
}

const show = (r) =>
  console.log(
    `${(r.label ?? '').padEnd(10)} #${String(r.i).padStart(2)} ${r.ok ? 'ok ' : 'ERR'} prompt ${r.promptTokens} cached ${r.cachedTokens} ttft ${r.ttftMs} ms total ${r.totalMs} ms${r.refused ? ` refused ${r.refused}` : ''}${r.ok ? '' : ` ${r.error}`}`,
  );

async function sequential(label, build, n = 20) {
  const rev = revision();
  for (let i = 0; i < n; i++) show(await ask({ label, i }, build(rev, i), questions[i % questions.length]));
}

const rb = runbook(size);
const quarter = rb.indexOf('\n## ', Math.floor(rb.length / 4));

if (experiment === 'stable') {
  await sequential('stable', (rev) => rev + rb);
} else if (experiment === 'timestamp-first') {
  await sequential('ts-first', (rev) => `Current time: ${new Date().toISOString()}\n\n` + rev + rb);
} else if (experiment === 'timestamp-last') {
  await sequential('ts-last', (rev) => rev + rb + `\nCurrent time: ${new Date().toISOString()}\n`);
} else if (experiment === 'user-in-middle') {
  await sequential('user-mid', (rev, i) => rev + rb.slice(0, quarter) + `\n\nOn-call engineer: ${engineers[i % engineers.length]}\n` + rb.slice(quarter));
} else if (experiment === 'burst') {
  // Cold burst: 10 at once on a prefix nobody has sent, then 10 at once again.
  const cold = revision() + rb;
  for (const wave of ['cold-1', 'cold-2']) {
    const rs = await Promise.all(Array.from({ length: 10 }, (_, i) => ask({ label: wave, i }, cold, questions[i])));
    rs.forEach(show);
  }
  // Warm first: one request alone, then 10 at once.
  const warm = revision() + rb;
  show(await ask({ label: 'warm-0', i: 0 }, warm, questions[0]));
  const rs = await Promise.all(Array.from({ length: 10 }, (_, i) => ask({ label: 'warm-1', i }, warm, questions[i + 1])));
  rs.forEach(show);
} else if (experiment === 'idle') {
  const gaps = [1, 5, 15, 30, 60];
  const prefixes = gaps.map(() => revision() + rb);
  const t0 = Date.now();
  for (let g = 0; g < gaps.length; g++) show(await ask({ label: 'prime', i: g, gapMin: gaps[g] }, prefixes[g], questions[0]));
  for (let g = 0; g < gaps.length; g++) {
    const due = t0 + gaps[g] * 60_000;
    if (Date.now() < due) await sleep(due - Date.now());
    show(await ask({ label: `after-${gaps[g]}m`, i: g, gapMin: gaps[g] }, prefixes[g], questions[1]));
  }
} else if (experiment === 'idle-twice') {
  // Same as idle, but each prefix is sent twice before the wait.
  const gaps = [1, 5, 15, 30];
  const prefixes = gaps.map(() => revision() + rb);
  const t0 = Date.now();
  for (let g = 0; g < gaps.length; g++) {
    show(await ask({ label: 'prime', i: g, gapMin: gaps[g] }, prefixes[g], questions[0]));
    show(await ask({ label: 'prime-2', i: g, gapMin: gaps[g] }, prefixes[g], questions[2]));
  }
  for (let g = 0; g < gaps.length; g++) {
    const due = t0 + gaps[g] * 60_000;
    if (Date.now() < due) await sleep(due - Date.now());
    show(await ask({ label: `after-${gaps[g]}m`, i: g, gapMin: gaps[g] }, prefixes[g], questions[1]));
  }
} else if (experiment === 'idle-short') {
  // Seconds, not minutes: two prefixes per gap, each sent twice, then once more after the gap.
  for (const gapSec of [5, 15, 30, 45, 5, 15, 30, 45]) {
    const prefix = revision() + rb;
    show(await ask({ label: 'prime', i: gapSec, gapSec }, prefix, questions[0]));
    show(await ask({ label: 'prime-2', i: gapSec, gapSec }, prefix, questions[2]));
    await sleep(gapSec * 1000);
    show(await ask({ label: `after-${gapSec}s`, i: gapSec, gapSec }, prefix, questions[1]));
  }
} else if (experiment === 'cache-key') {
  // prompt_cache_key: does a second key start from an empty cache for the same prefix?
  const steps = [['a-1', 'tenant-a'], ['a-2', 'tenant-a'], ['b-1', 'tenant-b'], ['a-3', 'tenant-a'], ['none', undefined], ['b-2', 'tenant-b']];
  for (let round = 0; round < 4; round++) {
    const prefix = revision() + rb;
    for (const [i, [label, key]] of steps.entries()) show(await ask({ label, i: round * 10 + i, round, cacheKey: key ?? null }, prefix, questions[round * 6 + i], key));
  }
} else if (experiment === 'key-ab') {
  for (let round = 0; round < 4; round++) {
    const keyed = revision() + rb;
    const plain = revision() + rb;
    const key = `round-${round}`;
    for (let i = 0; i < 8; i++) {
      show(await ask({ label: 'keyed', i: round * 10 + i, round, cacheKey: key }, keyed, questions[i], key));
      show(await ask({ label: 'plain', i: round * 10 + i, round, cacheKey: null }, plain, questions[i]));
    }
  }
} else if (experiment === 'cold-sizes') {
  // Misses only: every request gets a new revision id, 5 per size.
  for (const s of ['1k', '4k', '16k', '64k']) {
    for (let i = 0; i < 5; i++) show(await ask({ label: `cold-${s}`, i, size: s }, revision() + runbook(s), questions[i]));
  }
} else if (experiment === 'sweep') {
  for (const s of ['1k', '4k', '16k', '64k']) {
    const prefix = revision() + runbook(s);
    for (let i = 0; i < 6; i++) show(await ask({ label: `size-${s}`, i, size: s }, prefix, questions[i]));
  }
} else {
  console.error(`unknown experiment ${experiment}`);
  process.exit(2);
}
