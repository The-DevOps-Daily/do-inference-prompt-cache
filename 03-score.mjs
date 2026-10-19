// Stage 3: read results/raw/*.jsonl and write results/summary.json, plus a
// readable summary on stdout. Refuses to score files from different harness
// versions (stamps) unless they are listed in STAMPS_OK.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const ROOT = new URL('.', import.meta.url).pathname;
const pricing = JSON.parse(readFileSync(`${ROOT}pricing.json`, 'utf8'));
const rows = [];
for (const f of readdirSync(`${ROOT}results/raw`).filter((f) => f.endsWith('.jsonl')).sort()) {
  for (const line of readFileSync(`${ROOT}results/raw/${f}`, 'utf8').split('\n')) if (line.trim()) rows.push(JSON.parse(line));
}
const stamps = [...new Set(rows.map((r) => r.stamp))];
const allowed = (process.env.STAMPS_OK || '').split(',').filter(Boolean);
if (stamps.length > 1 && !stamps.every((s) => allowed.includes(s))) {
  console.error(`results come from ${stamps.length} harness versions: ${stamps.join(', ')}. Re-run, or set STAMPS_OK.`);
  process.exit(1);
}

const median = (xs) => {
  const s = xs.filter((x) => x != null).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const sum = (xs) => xs.reduce((t, x) => t + (x ?? 0), 0);
// A hit means most of the prompt came from the cache. gpt-oss-120b reports 64
// cached tokens on every request (its chat template), so "cached > 0" is not
// a hit; under 10% of the prompt counts as a miss (64 of an 850-token prompt is 7.5%).
const share = (r) => (r.promptTokens ? (r.cachedTokens ?? 0) / r.promptTokens : 0);
const isHit = (r) => share(r) >= 0.5;
const isMiss = (r) => share(r) < 0.1;
const price = (r) => {
  const p = pricing[r.model];
  const cached = r.cachedTokens ?? 0;
  const uncached = (r.promptTokens ?? 0) - cached;
  return {
    paid: (uncached * p.input + cached * p.cachedInput + (r.completionTokens ?? 0) * p.output) / 1e6,
    withoutCache: ((r.promptTokens ?? 0) * p.input + (r.completionTokens ?? 0) * p.output) / 1e6,
    inputPaid: (uncached * p.input + cached * p.cachedInput) / 1e6,
    inputWithoutCache: ((r.promptTokens ?? 0) * p.input) / 1e6,
  };
};

const summary = { stamps, models: {} };
const by = (pred) => rows.filter(pred);
for (const model of Object.keys(pricing).filter((k) => !k.startsWith('_'))) {
  const m = (summary.models[model] = {});
  const mine = by((r) => r.model === model);
  if (!mine.length) continue;
  const ok = mine.filter((r) => r.ok);
  m.requests = mine.length;
  m.failed = mine.length - ok.length;
  m.refusals = sum(mine.map((r) => r.refused));
  m.refusalStatuses = [...new Set(mine.flatMap((r) => (r.refusals || []).map((x) => x.status)))];
  m.servedModels = [...new Set(ok.map((r) => r.servedModel))];
  m.tokens = { prompt: sum(ok.map((r) => r.promptTokens)), cached: sum(ok.map((r) => r.cachedTokens)), completion: sum(ok.map((r) => r.completionTokens)) };

  for (const exp of ['stable', 'timestamp-first', 'timestamp-last', 'user-in-middle']) {
    const rs = ok.filter((r) => r.experiment === exp).sort((a, b) => a.i - b.i);
    if (!rs.length) continue;
    const later = rs.filter((r) => r.i > 0);
    const costs = rs.map(price);
    m[exp] = {
      n: rs.length,
      firstCached: rs[0].cachedTokens,
      laterHitRate: sum(later.map((r) => r.cachedTokens)) / sum(later.map((r) => r.promptTokens)),
      laterHits: later.filter(isHit).length,
      laterMisses: later.filter(isMiss).length,
      laterN: later.length,
      medianPrompt: median(rs.map((r) => r.promptTokens)),
      ttftMiss: median(rs.filter(isMiss).map((r) => r.ttftMs)),
      ttftHit: median(rs.filter(isHit).map((r) => r.ttftMs)),
      inputCostPaid: sum(costs.map((c) => c.inputPaid)),
      inputCostWithoutCache: sum(costs.map((c) => c.inputWithoutCache)),
      // Input cost per 1,000 requests at the rate measured after the first request.
      inputPerThousandLater: (1000 * sum(later.map((r) => price(r).inputPaid))) / later.length,
      inputPerThousandWithoutCache: (1000 * sum(later.map((r) => price(r).inputWithoutCache))) / later.length,
    };
  }

  const burst = ok.filter((r) => r.experiment === 'burst');
  if (burst.length) {
    m.burst = {};
    for (const wave of ['cold-1', 'cold-2', 'warm-0', 'warm-1']) {
      const rs = burst.filter((r) => r.label === wave);
      m.burst[wave] = { n: rs.length, withHit: rs.filter(isHit).length, medianTtft: median(rs.map((r) => r.ttftMs)) };
    }
  }

  for (const exp of ['idle', 'idle-twice']) {
    const rs = ok.filter((r) => r.experiment === exp);
    if (!rs.length) continue;
    m[exp] = {
      primes: rs.filter((r) => r.label.startsWith('prime')).map((r) => ({ label: r.label, gapMin: r.gapMin, hit: isHit(r) })),
      after: Object.fromEntries(rs.filter((r) => r.label.startsWith('after-')).map((r) => [`${r.gapMin}m`, { hit: isHit(r), cached: r.cachedTokens, prompt: r.promptTokens, ttft: r.ttftMs }])),
    };
  }

  const short = ok.filter((r) => r.experiment === 'idle-short');
  if (short.length) {
    m['idle-short'] = {};
    for (const gap of [5, 15, 30, 45]) {
      const rs = short.filter((r) => r.label === `after-${gap}s`);
      m['idle-short'][`${gap}s`] = { hits: rs.filter(isHit).length, of: rs.length, secondPrimeHits: short.filter((r) => r.label === 'prime-2' && r.gapSec === gap).filter(isHit).length };
    }
  }

  const keyed = ok.filter((r) => r.experiment === 'cache-key');
  if (keyed.length) {
    m['cache-key'] = {};
    for (const step of ['a-1', 'a-2', 'b-1', 'a-3', 'none', 'b-2']) {
      const rs = keyed.filter((r) => r.label === step);
      m['cache-key'][step] = { hits: rs.filter(isHit).length, misses: rs.filter(isMiss).length, of: rs.length };
    }
  }

  const ab = ok.filter((r) => r.experiment === 'key-ab');
  if (ab.length) {
    m['key-ab'] = {};
    for (const arm of ['keyed', 'plain']) {
      const rs = ab.filter((r) => r.label === arm);
      const later = rs.filter((r) => r.i % 10 > 0);
      m['key-ab'][arm] = {
        secondRequestHits: rs.filter((r) => r.i % 10 === 1).filter(isHit).length,
        rounds: rs.filter((r) => r.i % 10 === 0).length,
        laterHits: later.filter(isHit).length,
        laterN: later.length,
        laterHitRate: sum(later.map((r) => r.cachedTokens)) / sum(later.map((r) => r.promptTokens)),
      };
    }
  }

  const sweep = ok.filter((r) => r.experiment === 'sweep');
  if (sweep.length) {
    m.sweep = {};
    for (const size of ['1k', '4k', '16k', '64k']) {
      const rs = sweep.filter((r) => r.size === size).sort((a, b) => a.i - b.i);
      if (!rs.length) continue;
      m.sweep[size] = {
        prompt: rs[0].promptTokens,
        firstCached: rs[0].cachedTokens,
        ttftMiss: rs[0].ttftMs,
        ttftHitMedian: median(rs.slice(1).filter(isHit).map((r) => r.ttftMs)),
        hits: rs.slice(1).filter(isHit).length,
        of: rs.length - 1,
      };
    }
  }
}

for (const [model, m] of Object.entries(summary.models)) {
  const cold = rows.filter((r) => r.model === model && r.ok && r.experiment === 'cold-sizes');
  const sweep = rows.filter((r) => r.model === model && r.ok && r.experiment === 'sweep');
  if (!cold.length) continue;
  m.ttftBySize = {};
  for (const size of ['1k', '4k', '16k', '64k']) {
    const miss = cold.filter((r) => r.size === size && isMiss(r));
    const hit = sweep.filter((r) => r.size === size && isHit(r));
    m.ttftBySize[size] = {
      prompt: median(cold.filter((r) => r.size === size).map((r) => r.promptTokens)),
      missN: miss.length,
      missMedian: median(miss.map((r) => r.ttftMs)),
      missMin: Math.min(...miss.map((r) => r.ttftMs)),
      missMax: Math.max(...miss.map((r) => r.ttftMs)),
      hitN: hit.length,
      hitMedian: median(hit.map((r) => r.ttftMs)),
      unexpectedHitsInCold: cold.filter((r) => r.size === size && !isMiss(r)).length,
    };
  }
}

writeFileSync(`${ROOT}results/summary.json`, JSON.stringify(summary, null, 2) + '\n');
const pct = (x) => (x == null ? '-' : `${(100 * x).toFixed(1)}%`);
for (const [model, m] of Object.entries(summary.models)) {
  if (!m.requests) continue;
  console.log(`\n${model}: ${m.requests} requests, ${m.failed} failed, ${m.refusals} refused (${m.refusalStatuses.join(',') || 'none'})`);
  for (const exp of ['stable', 'timestamp-first', 'timestamp-last', 'user-in-middle']) {
    const e = m[exp];
    if (!e) continue;
    console.log(
      `  ${exp.padEnd(16)} tokens from cache after the first ${pct(e.laterHitRate)} (${e.laterHits}/${e.laterN} hits, ${e.laterMisses} misses), ttft miss ${e.ttftMiss} / hit ${e.ttftHit} ms, input $${e.inputCostPaid.toFixed(4)} vs $${e.inputCostWithoutCache.toFixed(4)}`,
    );
  }
  if (m.burst) console.log(`  burst            ${Object.entries(m.burst).map(([k, v]) => `${k} ${v.withHit}/${v.n}`).join(', ')}`);
  if (m['idle-short']) console.log(`  idle-short       ${Object.entries(m['idle-short']).map(([k, v]) => `${k} ${v.hits}/${v.of}`).join(', ')}`);
  if (m['cache-key']) console.log(`  cache-key        ${Object.entries(m['cache-key']).map(([k, v]) => `${k} ${v.hits}/${v.of}`).join(', ')}`);
  if (m['key-ab']) console.log(`  key-ab           ${Object.entries(m['key-ab']).map(([k, v]) => `${k}: 2nd request ${v.secondRequestHits}/${v.rounds}, later ${v.laterHits}/${v.laterN} (${pct(v.laterHitRate)})`).join('; ')}`);
  for (const exp of ['idle', 'idle-twice']) if (m[exp]) console.log(`  ${exp.padEnd(16)} ${Object.entries(m[exp].after).map(([k, v]) => `${k} ${v.hit ? 'hit' : 'miss'}`).join(', ')}`);
  if (m.ttftBySize) console.log(`  ttft by size     ${Object.entries(m.ttftBySize).map(([k, v]) => `${k}: miss ${v.missMedian} (n=${v.missN}) hit ${v.hitMedian} (n=${v.hitN})`).join(', ')}`);
  if (m.sweep) console.log(`  sweep            ${Object.entries(m.sweep).map(([k, v]) => `${k}: ${v.ttftMiss}->${v.ttftHitMedian} ms`).join(', ')}`);
}
