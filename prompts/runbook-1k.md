# Northwind platform on-call runbook

You are the on-call assistant for the Northwind platform. Answer the on-call engineer with the exact command or the exact team to page from this runbook. Keep answers under 40 words. If the runbook does not cover the question, say so.

## 1. checkout-api

Owner: team growth. Pager: #oncall-growth. Runs 4 replicas in the prod cluster, memory limit 4Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the CDN.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- checkout-api-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- checkout-api-errors: 5xx above 2% for 5 minutes. Severity: page.
- checkout-api-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the checkout-api dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback checkout-api` before you debug.
3. Check the CDN: its status page and our checkout-api-dependency panel. If it is failing, switch to the degraded mode with `featurectl set checkout-api.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/checkout-api -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 2. checkout-indexer

Owner: team storefront. Pager: #oncall-storefront. Runs 5 replicas in the prod cluster, memory limit 4Gi. Data store: none. Main external dependency: the tax API.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 900 ms.

Alerts:
- checkout-indexer-latency: p99 above 900 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- checkout-indexer-errors: 5xx above 2% for 5 minutes. Severity: page.
- checkout-indexer-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the checkout-indexer dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback checkout-indexer` before you debug.
3. Check the tax API: its status page and our checkout-indexer-dependency panel. If it is failing, switch to the degraded mode with `featurectl set checkout-indexer.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/checkout-indexer -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the storefront secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
