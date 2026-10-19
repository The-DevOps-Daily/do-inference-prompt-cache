// Stage 4: compare the token counts the API reported (results/raw) with the
// change in this month's invoice preview between two snapshots.
//
//   node 04-bill-check.mjs before after
//
// The invoice lines are monthly totals per model, so any other use of the
// same models between the two snapshots shows up here too. Runs moved to
// results/discarded/ were still billed, so they count here.
import { readFileSync, readdirSync } from 'node:fs';

const [a = 'before', b = 'after'] = process.argv.slice(2);
const ROOT = new URL('.', import.meta.url).pathname;
const pricing = JSON.parse(readFileSync(`${ROOT}pricing.json`, 'utf8'));
const load = (label) => JSON.parse(readFileSync(`${ROOT}results/billing-${label}.json`, 'utf8'));
const before = load(a);
const after = load(b);
const total = (snap, name, kind) => snap.lines.filter((l) => l.model === name && l.kind === kind).reduce((t, l) => t + l.tokens, 0);

const rows = [];
for (const dir of ['raw', 'discarded']) {
  for (const f of readdirSync(`${ROOT}results/${dir}`).filter((f) => f.endsWith('.jsonl'))) {
    for (const line of readFileSync(`${ROOT}results/${dir}/${f}`, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      const r = JSON.parse(line);
      // Only requests sent between the two snapshots.
      if (r.startedAt >= before.takenAt && r.startedAt <= after.takenAt) rows.push(r);
    }
  }
}
console.log(`invoice snapshots: ${before.takenAt} -> ${after.takenAt}`);
for (const [model, p] of Object.entries(pricing)) {
  if (model.startsWith('_')) continue;
  const ok = rows.filter((r) => r.model === model && r.ok);
  if (!ok.length) continue;
  const api = {
    Input: ok.reduce((t, r) => t + (r.promptTokens - (r.cachedTokens ?? 0)), 0),
    'Cache Read Input': ok.reduce((t, r) => t + (r.cachedTokens ?? 0), 0),
    Output: ok.reduce((t, r) => t + (r.completionTokens ?? 0), 0),
  };
  console.log(`\n${p.name}`);
  for (const kind of Object.keys(api)) {
    const billed = total(after, p.name, kind) - total(before, p.name, kind);
    const diff = billed - api[kind];
    console.log(`  ${kind.padEnd(17)} api ${String(api[kind]).padStart(9)}  invoice change ${String(billed).padStart(9)}  difference ${diff >= 0 ? '+' : ''}${diff} (${api[kind] ? ((100 * diff) / api[kind]).toFixed(2) : '-'}%)`);
  }
}
