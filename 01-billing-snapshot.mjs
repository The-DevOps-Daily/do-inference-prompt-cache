// Stage 1 (run before and after the experiments): save the Serverless
// Inference token lines from this month's invoice preview, so the token counts
// the API reported can be checked against what DigitalOcean bills.
//
//   DO_BILLING_TOKEN=... node 01-billing-snapshot.mjs before
//
// The token needs billing read access. It is optional: without it the
// experiments still run, but the bill check in stage 4 is skipped.
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';

const label = process.argv[2] || 'snapshot';
let token = process.env.DO_BILLING_TOKEN;
if (!token && process.env.ENV_FILE && existsSync(process.env.ENV_FILE)) {
  const m = /^\s*(?:export\s+)?DO_BILLING_TOKEN\s*=\s*"?([^"\n]+)"?/m.exec(readFileSync(process.env.ENV_FILE, 'utf8'));
  token = m?.[1];
}
if (!token) {
  console.error('DO_BILLING_TOKEN is not set; skipping the billing snapshot.');
  process.exit(0);
}

// Only the models this repo tests; the rest of the account's usage stays out of results/.
const pricing = JSON.parse(readFileSync(new URL('./pricing.json', import.meta.url), 'utf8'));
const tested = new Set(Object.values(pricing).map((p) => p.name).filter(Boolean));

const res = await fetch('https://api.digitalocean.com/v2/customers/my/invoices/preview?per_page=200', {
  headers: { Authorization: `Bearer ${token}` },
});
if (!res.ok) throw new Error(`invoice preview: HTTP ${res.status}`);
const data = await res.json();
const lines = [];
for (const item of data.invoice_items ?? []) {
  if (item.product !== 'GenAI Serverless Inference') continue;
  // "DeepSeek V4 Flash 0731 Cache Read Input tokens (764662 @ $0.000028/thousand)"
  const m = /^(.*?) (Cache Read Input|Input|Output) tokens \((\d+) @ \$([\d.]+)\/thousand\)/.exec(item.description);
  if (m && tested.has(m[1])) lines.push({ model: m[1], kind: m[2], tokens: Number(m[3]), perThousand: Number(m[4]), amount: Number(item.amount) });
}
mkdirSync(new URL('./results/', import.meta.url).pathname, { recursive: true });
const out = new URL(`./results/billing-${label}.json`, import.meta.url).pathname;
writeFileSync(out, JSON.stringify({ takenAt: new Date().toISOString(), lines }, null, 2) + '\n');
console.log(`${lines.length} inference lines saved to results/billing-${label}.json`);
