// Stage 0: build the prompts. A synthetic but realistic on-call runbook for a
// made-up platform, cut to several sizes, and on-call questions about it.
// Seeded, so every run of this script writes the same files.
import { writeFileSync, mkdirSync } from 'node:fs';
import { mulberry32, pick } from './lib/rand.mjs';

const rnd = mulberry32(20261019);
const OUT = new URL('./prompts/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const prefixes = ['checkout', 'payments', 'search', 'catalog', 'auth', 'inventory', 'shipping', 'notify', 'pricing',
  'ledger', 'media', 'reviews', 'gateway', 'session', 'billing', 'export', 'webhooks', 'scheduler', 'audit', 'reports'];
const kinds = ['api', 'worker', 'indexer', 'cron', 'consumer', 'proxy'];
const teams = ['storefront', 'payments-core', 'platform', 'data', 'identity', 'fulfilment', 'growth'];
const stores = ['Postgres (managed, 3 nodes)', 'Redis (cache only)', 'Kafka topic', 'S3-compatible Spaces bucket', 'OpenSearch cluster', 'none'];
const deps = ['the payments provider', 'the email provider', 'the tax API', 'the CDN', 'the fraud-scoring model', 'the internal auth service'];

const services = [];
for (const p of prefixes) {
  for (const k of kinds) {
    if (rnd() < 0.5) continue;
    services.push({
      name: `${p}-${k}`,
      team: pick(rnd, teams),
      store: pick(rnd, stores),
      dep: pick(rnd, deps),
      p99: 200 + Math.floor(rnd() * 12) * 100,
      errorBudget: pick(rnd, ['99.9%', '99.5%', '99.95%']),
      replicas: 2 + Math.floor(rnd() * 10),
      memLimit: pick(rnd, ['512Mi', '1Gi', '2Gi', '4Gi']),
    });
  }
}

function section(s, i) {
  return `## ${i + 1}. ${s.name}

Owner: team ${s.team}. Pager: #oncall-${s.team}. Runs ${s.replicas} replicas in the prod cluster, memory limit ${s.memLimit}. Data store: ${s.store}. Main external dependency: ${s.dep}.

SLO: ${s.errorBudget} of requests succeed over 28 days, p99 latency under ${s.p99} ms.

Alerts:
- ${s.name}-latency: p99 above ${s.p99} ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- ${s.name}-errors: 5xx above 2% for 5 minutes. Severity: page.
- ${s.name}-saturation: CPU above 85% or memory above 90% of ${s.memLimit} for 15 minutes. Severity: ticket.

First steps:
1. Open the ${s.name} dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with \`deployctl rollback ${s.name}\` before you debug.
3. Check ${s.dep}: its status page and our ${s.name}-dependency panel. If it is failing, switch to the degraded mode with \`featurectl set ${s.name}.degraded true\`.
4. If memory is above 90%, restart one replica at a time with \`kubectl rollout restart deploy/${s.name} -n prod\` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the ${s.team} secondary and open an incident channel.

Known issues: ${pick(rnd, [
    'connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions',
    'cold caches after a deploy make p99 spike for about 5 minutes; do not page for it',
    'a slow consumer on the shared Kafka topic delays this service; check consumer lag first',
    'TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx',
    'the health check hits the database, so a database failover marks every replica unhealthy at once',
  ])}.
`;
}

const header = `# Northwind platform on-call runbook

You are the on-call assistant for the Northwind platform. Answer the on-call engineer with the exact command or the exact team to page from this runbook. Keep answers under 40 words. If the runbook does not cover the question, say so.

`;

let body = header;
const all = [];
let i = 0;
// Cycle through the services until the runbook is long enough for the biggest size.
while (body.length < 64_000 * 4) {
  const s = services[i % services.length];
  const text = section(i < services.length ? s : { ...s, name: `${s.name}-${Math.floor(i / services.length) + 1}` }, i);
  body += text;
  all.push(i < services.length ? s.name : `${s.name}-${Math.floor(i / services.length) + 1}`);
  i++;
}

// Cut at section boundaries, close to the target size in characters (about 4 per token).
const sizes = { '1k': 1_000, '4k': 4_000, '8k': 8_000, '16k': 16_000, '64k': 64_000 };
for (const [label, tokens] of Object.entries(sizes)) {
  const limit = tokens * 4;
  let cut = body.lastIndexOf('\n## ', limit);
  if (cut < header.length) cut = Math.min(limit, body.length);
  writeFileSync(`${OUT}runbook-${label}.md`, body.slice(0, cut).trimEnd() + '\n');
}

// Questions only about services in the first sections, so every size can answer them.
const firstServices = services.slice(0, 3);
const templates = [
  (s) => `${s.name} p99 has been ${s.p99 + 400} ms for 12 minutes. Who do I page?`,
  (s) => `${s.name} is returning 5xx after a deploy 10 minutes ago. What is the first command to run?`,
  (s) => `Memory on ${s.name} is at 95%. What should I do?`,
  (s) => `Which data store does ${s.name} use?`,
  (s) => `How do I put ${s.name} into degraded mode?`,
  (s) => `What is the known issue for ${s.name}?`,
  (s) => `How many replicas does ${s.name} run?`,
  (s) => `What is the latency SLO for ${s.name}?`,
];
const questions = [];
for (let q = 0; q < 40; q++) questions.push(templates[q % templates.length](firstServices[q % firstServices.length]));
writeFileSync(`${OUT}questions.json`, JSON.stringify(questions, null, 2) + '\n');

console.log(`services ${services.length}, sections written ${all.length}`);
for (const label of Object.keys(sizes)) console.log(`runbook-${label}.md written`);
console.log(`questions.json: ${questions.length} questions`);
