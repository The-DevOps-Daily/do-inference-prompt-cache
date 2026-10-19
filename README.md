# do-inference-prompt-cache

Measure DigitalOcean Serverless Inference's automatic prompt caching on real requests: how much of a long, repeated system prompt is served from the cache, what it does to time to first token and to the input bill, how long a cached prefix lasts, and which prompt layouts turn it off without an error.

Write-up: [Prompt Caching on DigitalOcean Inference, Measured](https://devops-daily.com/posts/digitalocean-inference-prompt-caching-measured)

```bash
cp .env.example .env            # add DO_INFERENCE_KEY (and DO_BILLING_TOKEN for the bill check)
node 00-build-prompts.mjs       # writes prompts/ (seeded, always the same files)
node 01-billing-snapshot.mjs before
node 02-run.mjs llama-4-maverick stable
node 02-run.mjs llama-4-maverick timestamp-first
# ... any model, any experiment (see below)
node 03-score.mjs               # results/summary.json and a readable summary
node 01-billing-snapshot.mjs after   # once the invoice preview has caught up (see below)
node 04-bill-check.mjs before after
```

Node.js 22 or later. No dependencies.

## The scripts

| Script | What it does |
| --- | --- |
| `00-build-prompts.mjs` | Builds an on-call runbook for a made-up platform at 1k, 4k, 8k, 16k and 64k tokens, and 40 on-call questions about it. |
| `01-billing-snapshot.mjs` | Saves the invoice preview's token lines (input, cache read input and output) for the models in `pricing.json`. |
| `02-run.mjs <model> <experiment>` | Runs one experiment and appends every request to `results/raw/<model>__<experiment>.jsonl`, with time to first token, total time and the usage block. 429 and 5xx answers are retried, counted and kept apart from the timings. |
| `03-score.mjs` | Hit rates, time to first token on a miss and on a hit, and the input cost with and without the cache, at list prices from `pricing.json`. |
| `04-bill-check.mjs` | Compares the token counts the API reported with the change in the invoice between two snapshots. |

A request is a **hit** when at least half of its prompt tokens came from the cache, and a **miss** when under 10% did. `gpt-oss-120b` reports 64 cached tokens on many requests that share nothing (its chat template), so "cached > 0" does not mean a hit.

## The experiments

Every experiment starts from a prefix the cache has never seen: a random revision id on the first line of the system prompt, the same for every request of that experiment. Requests are streamed, `temperature` 0, `max_tokens` 48. The size is 8k tokens unless the table says otherwise.

| Experiment | What it sends |
| --- | --- |
| `stable` | 20 requests: the same runbook, a different question each time. |
| `timestamp-first` | The current time on the first line of the system prompt, then the runbook. |
| `timestamp-last` | The same timestamp, after the runbook. |
| `user-in-middle` | The on-call engineer's name inserted a quarter of the way into the runbook. |
| `burst` | 10 requests at once on a cold prefix, then 10 more; then 1 request alone and 10 at once. |
| `idle` | 5 prefixes sent once each, then asked again after 1, 5, 15, 30 or 60 minutes (counted from the start of priming). |
| `idle-twice` | 4 prefixes sent twice each, then asked again after 1, 5, 15 or 30 minutes (counted from the start of priming). |
| `idle-short` | 8 prefixes sent twice each, then asked again after 5, 15, 30 or 45 seconds (two per gap). |
| `cache-key` | 4 prefixes: `prompt_cache_key` A twice, then key B, key A, no key, key B again. |
| `key-ab` | 4 rounds of two new prefixes, one with a `prompt_cache_key` and one without, 8 requests each, taking turns. |
| `sweep` | Runbooks of 1k, 4k, 16k and 64k tokens, 6 requests each on one prefix per size. |
| `cold-sizes` | The same sizes, 5 requests each, every request on a new prefix (all misses). |

## Results (19 October 2026)

867 recorded requests, 289 per model, plus one discarded first run (20 requests, kept in `results/discarded/` because its retries were not recorded). Llama 4 Maverick answered `529 Platform overloaded` 55 times; every one was retried and none is in the timings. At list prices the recorded requests cost about $1.06, the discarded run included.

"Tokens from cache" is cached tokens as a share of prompt tokens over requests 2 to 20 (the scorer's `laterHitRate`). Time to first token is the first streamed chunk, reasoning or answer: for DeepSeek V4.1 Flash and `gpt-oss-120b` it is usually a reasoning token.

| | Llama 4 Maverick | DeepSeek V4.1 Flash | gpt-oss-120b |
| --- | --- | --- | --- |
| Tokens from cache, stable 8k prompt, after the first request | 99.7% | 94.0% | 67.9% (35.4% to 67.9% across runs) |
| Input cost per 1,000 requests, with / without the cache | $0.39 / $1.92 | $0.19 / $2.40 | $0.35 / $0.78 |
| Timestamp on the first line | 0.0% | 0.0% | 0.8% |
| Timestamp after the runbook | 99.5% | 93.7% | 63.2% |
| Name a quarter of the way in | 27.4% | 26.5% | 19.5% |
| Time to first token at 64k tokens, miss / hit (median of 5) | 5,015 / 1,444 ms | 3,068 / 911 ms | 4,770 ms / no hit in 5 |
| Asked again after 5 to 45 seconds | 8 of 8 hit | 8 of 8 hit | 4 of 8 hit |
| Sent once, asked again after 1, 5, 15, 30, 60 min (nominal) | hit, hit, miss, miss, miss | all miss | all miss |
| Sent twice, asked again after 1, 5, 15, 30 min (nominal) | hit, hit, miss, miss | all hit | all miss |
| Second request on a new prefix, hits | 30 of 30 | 6 of 30 | 11 of 30 |

`prompt_cache_key` kept caches apart: a second key on the same prefix missed 12 of 12 times across the three models, and the same prefix with no key missed 12 of 12. It did not change hit rates (`key-ab`).

The minute gaps are nominal: they are counted from the start of priming, so the real idle time was up to 35 seconds shorter. Each record's `startedAt` and `totalMs` give the exact gap. The full numbers are in `results/summary.json`; every request is in `results/raw/`.

## Harness versions

Each recorded request carries a stamp: a hash of `lib/client.mjs`, `lib/rand.mjs`, `lib/stamp.mjs`, `02-run.mjs` and the prompts. `03-score.mjs` refuses to mix stamps unless you list them. The stamps changed only because experiments were added to `02-run.mjs` (and `prompt_cache_key` support to `lib/client.mjs` for the last two); the request code the earlier experiments use did not change.

| Stamp | Experiments |
| --- | --- |
| `dc0f0f363a39` | stable, timestamp-first, timestamp-last, user-in-middle, burst, idle, sweep |
| `87b41f078134` | cold-sizes |
| `508492e94842` | idle-twice |
| `d55d9d457f2b` | idle-short |
| `23e1a2f92b4a` | cache-key |
| `dd8b65c3f04b` | key-ab |

```bash
STAMPS_OK=dc0f0f363a39,87b41f078134,508492e94842,d55d9d457f2b,23e1a2f92b4a,dd8b65c3f04b node 03-score.mjs
```

## The bill check

`01-billing-snapshot.mjs` reads `GET /v2/customers/my/invoices/preview` and keeps the input, cache read input and output token lines for the tested models. `results/billing-before.json` was taken at 12:47 UTC, before the first request, and `results/billing-same-day.json` at 13:54 UTC, right after the last one; the two are identical, so the preview had not caught up yet. Take an `after` snapshot once the preview has moved, then run `node 04-bill-check.mjs before after`. It counts only requests sent between the two snapshots, but the invoice lines are monthly totals per model, so other use of the same models in that window shows up too.

The cached rate for `gpt-oss-120b` ($0.02 per million) comes from the invoice preview's `Cache Read Input` line; the other rates are from the [pricing page](https://docs.digitalocean.com/products/inference/details/pricing/) (last verified 15 October 2026).

## Limits

- One account, one afternoon (12:47 to 13:55 UTC), three models. Cache behavior depends on load, and the docs say entries are evicted sooner under heavy load.
- Small samples for the timing and idle results: 5 requests per size, 1 or 2 per gap.
- The prompts are synthetic. They are long and repetitive in the way real runbooks and system prompts are, but they are not your prompts.
- Answers are capped at 48 tokens and not graded; this repo measures input caching, not answer quality.

## License

MIT
