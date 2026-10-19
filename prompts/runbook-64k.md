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
## 3. checkout-cron

Owner: team payments-core. Pager: #oncall-payments-core. Runs 2 replicas in the prod cluster, memory limit 512Mi. Data store: Redis (cache only). Main external dependency: the fraud-scoring model.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 1200 ms.

Alerts:
- checkout-cron-latency: p99 above 1200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- checkout-cron-errors: 5xx above 2% for 5 minutes. Severity: page.
- checkout-cron-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the checkout-cron dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback checkout-cron` before you debug.
3. Check the fraud-scoring model: its status page and our checkout-cron-dependency panel. If it is failing, switch to the degraded mode with `featurectl set checkout-cron.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/checkout-cron -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the payments-core secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 4. payments-worker

Owner: team fulfilment. Pager: #oncall-fulfilment. Runs 4 replicas in the prod cluster, memory limit 2Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the CDN.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 1200 ms.

Alerts:
- payments-worker-latency: p99 above 1200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- payments-worker-errors: 5xx above 2% for 5 minutes. Severity: page.
- payments-worker-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the payments-worker dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback payments-worker` before you debug.
3. Check the CDN: its status page and our payments-worker-dependency panel. If it is failing, switch to the degraded mode with `featurectl set payments-worker.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/payments-worker -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the fulfilment secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 5. payments-cron

Owner: team data. Pager: #oncall-data. Runs 6 replicas in the prod cluster, memory limit 2Gi. Data store: Kafka topic. Main external dependency: the fraud-scoring model.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 800 ms.

Alerts:
- payments-cron-latency: p99 above 800 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- payments-cron-errors: 5xx above 2% for 5 minutes. Severity: page.
- payments-cron-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the payments-cron dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback payments-cron` before you debug.
3. Check the fraud-scoring model: its status page and our payments-cron-dependency panel. If it is failing, switch to the degraded mode with `featurectl set payments-cron.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/payments-cron -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 6. payments-proxy

Owner: team storefront. Pager: #oncall-storefront. Runs 10 replicas in the prod cluster, memory limit 512Mi. Data store: S3-compatible Spaces bucket. Main external dependency: the internal auth service.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 400 ms.

Alerts:
- payments-proxy-latency: p99 above 400 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- payments-proxy-errors: 5xx above 2% for 5 minutes. Severity: page.
- payments-proxy-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the payments-proxy dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback payments-proxy` before you debug.
3. Check the internal auth service: its status page and our payments-proxy-dependency panel. If it is failing, switch to the degraded mode with `featurectl set payments-proxy.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/payments-proxy -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the storefront secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 7. search-api

Owner: team payments-core. Pager: #oncall-payments-core. Runs 11 replicas in the prod cluster, memory limit 512Mi. Data store: Kafka topic. Main external dependency: the payments provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 500 ms.

Alerts:
- search-api-latency: p99 above 500 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- search-api-errors: 5xx above 2% for 5 minutes. Severity: page.
- search-api-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the search-api dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback search-api` before you debug.
3. Check the payments provider: its status page and our search-api-dependency panel. If it is failing, switch to the degraded mode with `featurectl set search-api.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/search-api -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the payments-core secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 8. search-worker

Owner: team growth. Pager: #oncall-growth. Runs 11 replicas in the prod cluster, memory limit 4Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the internal auth service.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 600 ms.

Alerts:
- search-worker-latency: p99 above 600 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- search-worker-errors: 5xx above 2% for 5 minutes. Severity: page.
- search-worker-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the search-worker dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback search-worker` before you debug.
3. Check the internal auth service: its status page and our search-worker-dependency panel. If it is failing, switch to the degraded mode with `featurectl set search-worker.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/search-worker -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 9. search-indexer

Owner: team storefront. Pager: #oncall-storefront. Runs 2 replicas in the prod cluster, memory limit 512Mi. Data store: S3-compatible Spaces bucket. Main external dependency: the email provider.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 900 ms.

Alerts:
- search-indexer-latency: p99 above 900 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- search-indexer-errors: 5xx above 2% for 5 minutes. Severity: page.
- search-indexer-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the search-indexer dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback search-indexer` before you debug.
3. Check the email provider: its status page and our search-indexer-dependency panel. If it is failing, switch to the degraded mode with `featurectl set search-indexer.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/search-indexer -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the storefront secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 10. search-consumer

Owner: team storefront. Pager: #oncall-storefront. Runs 10 replicas in the prod cluster, memory limit 1Gi. Data store: Redis (cache only). Main external dependency: the tax API.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 800 ms.

Alerts:
- search-consumer-latency: p99 above 800 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- search-consumer-errors: 5xx above 2% for 5 minutes. Severity: page.
- search-consumer-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the search-consumer dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback search-consumer` before you debug.
3. Check the tax API: its status page and our search-consumer-dependency panel. If it is failing, switch to the degraded mode with `featurectl set search-consumer.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/search-consumer -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the storefront secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 11. search-proxy

Owner: team identity. Pager: #oncall-identity. Runs 4 replicas in the prod cluster, memory limit 2Gi. Data store: Kafka topic. Main external dependency: the email provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 200 ms.

Alerts:
- search-proxy-latency: p99 above 200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- search-proxy-errors: 5xx above 2% for 5 minutes. Severity: page.
- search-proxy-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the search-proxy dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback search-proxy` before you debug.
3. Check the email provider: its status page and our search-proxy-dependency panel. If it is failing, switch to the degraded mode with `featurectl set search-proxy.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/search-proxy -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 12. catalog-api

Owner: team fulfilment. Pager: #oncall-fulfilment. Runs 8 replicas in the prod cluster, memory limit 2Gi. Data store: Postgres (managed, 3 nodes). Main external dependency: the payments provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 600 ms.

Alerts:
- catalog-api-latency: p99 above 600 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- catalog-api-errors: 5xx above 2% for 5 minutes. Severity: page.
- catalog-api-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the catalog-api dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback catalog-api` before you debug.
3. Check the payments provider: its status page and our catalog-api-dependency panel. If it is failing, switch to the degraded mode with `featurectl set catalog-api.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/catalog-api -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the fulfilment secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 13. catalog-worker

Owner: team payments-core. Pager: #oncall-payments-core. Runs 8 replicas in the prod cluster, memory limit 512Mi. Data store: Kafka topic. Main external dependency: the payments provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 900 ms.

Alerts:
- catalog-worker-latency: p99 above 900 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- catalog-worker-errors: 5xx above 2% for 5 minutes. Severity: page.
- catalog-worker-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the catalog-worker dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback catalog-worker` before you debug.
3. Check the payments provider: its status page and our catalog-worker-dependency panel. If it is failing, switch to the degraded mode with `featurectl set catalog-worker.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/catalog-worker -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the payments-core secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 14. catalog-cron

Owner: team identity. Pager: #oncall-identity. Runs 7 replicas in the prod cluster, memory limit 1Gi. Data store: OpenSearch cluster. Main external dependency: the fraud-scoring model.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 1200 ms.

Alerts:
- catalog-cron-latency: p99 above 1200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- catalog-cron-errors: 5xx above 2% for 5 minutes. Severity: page.
- catalog-cron-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the catalog-cron dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback catalog-cron` before you debug.
3. Check the fraud-scoring model: its status page and our catalog-cron-dependency panel. If it is failing, switch to the degraded mode with `featurectl set catalog-cron.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/catalog-cron -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 15. auth-api

Owner: team data. Pager: #oncall-data. Runs 11 replicas in the prod cluster, memory limit 512Mi. Data store: none. Main external dependency: the tax API.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 800 ms.

Alerts:
- auth-api-latency: p99 above 800 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- auth-api-errors: 5xx above 2% for 5 minutes. Severity: page.
- auth-api-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the auth-api dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback auth-api` before you debug.
3. Check the tax API: its status page and our auth-api-dependency panel. If it is failing, switch to the degraded mode with `featurectl set auth-api.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/auth-api -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 16. auth-worker

Owner: team payments-core. Pager: #oncall-payments-core. Runs 6 replicas in the prod cluster, memory limit 4Gi. Data store: none. Main external dependency: the tax API.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 200 ms.

Alerts:
- auth-worker-latency: p99 above 200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- auth-worker-errors: 5xx above 2% for 5 minutes. Severity: page.
- auth-worker-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the auth-worker dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback auth-worker` before you debug.
3. Check the tax API: its status page and our auth-worker-dependency panel. If it is failing, switch to the degraded mode with `featurectl set auth-worker.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/auth-worker -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the payments-core secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 17. auth-indexer

Owner: team growth. Pager: #oncall-growth. Runs 8 replicas in the prod cluster, memory limit 2Gi. Data store: OpenSearch cluster. Main external dependency: the fraud-scoring model.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- auth-indexer-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- auth-indexer-errors: 5xx above 2% for 5 minutes. Severity: page.
- auth-indexer-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the auth-indexer dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback auth-indexer` before you debug.
3. Check the fraud-scoring model: its status page and our auth-indexer-dependency panel. If it is failing, switch to the degraded mode with `featurectl set auth-indexer.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/auth-indexer -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 18. auth-consumer

Owner: team identity. Pager: #oncall-identity. Runs 11 replicas in the prod cluster, memory limit 1Gi. Data store: Kafka topic. Main external dependency: the payments provider.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 700 ms.

Alerts:
- auth-consumer-latency: p99 above 700 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- auth-consumer-errors: 5xx above 2% for 5 minutes. Severity: page.
- auth-consumer-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the auth-consumer dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback auth-consumer` before you debug.
3. Check the payments provider: its status page and our auth-consumer-dependency panel. If it is failing, switch to the degraded mode with `featurectl set auth-consumer.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/auth-consumer -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 19. auth-proxy

Owner: team platform. Pager: #oncall-platform. Runs 6 replicas in the prod cluster, memory limit 1Gi. Data store: Kafka topic. Main external dependency: the CDN.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- auth-proxy-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- auth-proxy-errors: 5xx above 2% for 5 minutes. Severity: page.
- auth-proxy-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the auth-proxy dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback auth-proxy` before you debug.
3. Check the CDN: its status page and our auth-proxy-dependency panel. If it is failing, switch to the degraded mode with `featurectl set auth-proxy.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/auth-proxy -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the platform secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 20. inventory-worker

Owner: team growth. Pager: #oncall-growth. Runs 4 replicas in the prod cluster, memory limit 512Mi. Data store: OpenSearch cluster. Main external dependency: the email provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 900 ms.

Alerts:
- inventory-worker-latency: p99 above 900 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- inventory-worker-errors: 5xx above 2% for 5 minutes. Severity: page.
- inventory-worker-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the inventory-worker dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback inventory-worker` before you debug.
3. Check the email provider: its status page and our inventory-worker-dependency panel. If it is failing, switch to the degraded mode with `featurectl set inventory-worker.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/inventory-worker -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 21. inventory-cron

Owner: team platform. Pager: #oncall-platform. Runs 10 replicas in the prod cluster, memory limit 512Mi. Data store: Kafka topic. Main external dependency: the payments provider.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 500 ms.

Alerts:
- inventory-cron-latency: p99 above 500 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- inventory-cron-errors: 5xx above 2% for 5 minutes. Severity: page.
- inventory-cron-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the inventory-cron dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback inventory-cron` before you debug.
3. Check the payments provider: its status page and our inventory-cron-dependency panel. If it is failing, switch to the degraded mode with `featurectl set inventory-cron.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/inventory-cron -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the platform secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 22. inventory-consumer

Owner: team fulfilment. Pager: #oncall-fulfilment. Runs 5 replicas in the prod cluster, memory limit 512Mi. Data store: S3-compatible Spaces bucket. Main external dependency: the email provider.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 900 ms.

Alerts:
- inventory-consumer-latency: p99 above 900 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- inventory-consumer-errors: 5xx above 2% for 5 minutes. Severity: page.
- inventory-consumer-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the inventory-consumer dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback inventory-consumer` before you debug.
3. Check the email provider: its status page and our inventory-consumer-dependency panel. If it is failing, switch to the degraded mode with `featurectl set inventory-consumer.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/inventory-consumer -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the fulfilment secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 23. inventory-proxy

Owner: team identity. Pager: #oncall-identity. Runs 8 replicas in the prod cluster, memory limit 4Gi. Data store: none. Main external dependency: the email provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 800 ms.

Alerts:
- inventory-proxy-latency: p99 above 800 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- inventory-proxy-errors: 5xx above 2% for 5 minutes. Severity: page.
- inventory-proxy-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the inventory-proxy dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback inventory-proxy` before you debug.
3. Check the email provider: its status page and our inventory-proxy-dependency panel. If it is failing, switch to the degraded mode with `featurectl set inventory-proxy.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/inventory-proxy -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 24. notify-cron

Owner: team storefront. Pager: #oncall-storefront. Runs 4 replicas in the prod cluster, memory limit 512Mi. Data store: none. Main external dependency: the payments provider.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1100 ms.

Alerts:
- notify-cron-latency: p99 above 1100 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- notify-cron-errors: 5xx above 2% for 5 minutes. Severity: page.
- notify-cron-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the notify-cron dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback notify-cron` before you debug.
3. Check the payments provider: its status page and our notify-cron-dependency panel. If it is failing, switch to the degraded mode with `featurectl set notify-cron.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/notify-cron -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the storefront secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 25. pricing-api

Owner: team payments-core. Pager: #oncall-payments-core. Runs 6 replicas in the prod cluster, memory limit 4Gi. Data store: Kafka topic. Main external dependency: the email provider.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- pricing-api-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- pricing-api-errors: 5xx above 2% for 5 minutes. Severity: page.
- pricing-api-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the pricing-api dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback pricing-api` before you debug.
3. Check the email provider: its status page and our pricing-api-dependency panel. If it is failing, switch to the degraded mode with `featurectl set pricing-api.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/pricing-api -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the payments-core secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 26. pricing-worker

Owner: team identity. Pager: #oncall-identity. Runs 11 replicas in the prod cluster, memory limit 512Mi. Data store: Postgres (managed, 3 nodes). Main external dependency: the email provider.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 200 ms.

Alerts:
- pricing-worker-latency: p99 above 200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- pricing-worker-errors: 5xx above 2% for 5 minutes. Severity: page.
- pricing-worker-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the pricing-worker dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback pricing-worker` before you debug.
3. Check the email provider: its status page and our pricing-worker-dependency panel. If it is failing, switch to the degraded mode with `featurectl set pricing-worker.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/pricing-worker -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 27. pricing-indexer

Owner: team data. Pager: #oncall-data. Runs 7 replicas in the prod cluster, memory limit 512Mi. Data store: S3-compatible Spaces bucket. Main external dependency: the email provider.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 400 ms.

Alerts:
- pricing-indexer-latency: p99 above 400 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- pricing-indexer-errors: 5xx above 2% for 5 minutes. Severity: page.
- pricing-indexer-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the pricing-indexer dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback pricing-indexer` before you debug.
3. Check the email provider: its status page and our pricing-indexer-dependency panel. If it is failing, switch to the degraded mode with `featurectl set pricing-indexer.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/pricing-indexer -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 28. pricing-cron

Owner: team growth. Pager: #oncall-growth. Runs 7 replicas in the prod cluster, memory limit 2Gi. Data store: OpenSearch cluster. Main external dependency: the CDN.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 800 ms.

Alerts:
- pricing-cron-latency: p99 above 800 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- pricing-cron-errors: 5xx above 2% for 5 minutes. Severity: page.
- pricing-cron-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the pricing-cron dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback pricing-cron` before you debug.
3. Check the CDN: its status page and our pricing-cron-dependency panel. If it is failing, switch to the degraded mode with `featurectl set pricing-cron.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/pricing-cron -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 29. pricing-consumer

Owner: team data. Pager: #oncall-data. Runs 9 replicas in the prod cluster, memory limit 4Gi. Data store: none. Main external dependency: the payments provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 400 ms.

Alerts:
- pricing-consumer-latency: p99 above 400 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- pricing-consumer-errors: 5xx above 2% for 5 minutes. Severity: page.
- pricing-consumer-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the pricing-consumer dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback pricing-consumer` before you debug.
3. Check the payments provider: its status page and our pricing-consumer-dependency panel. If it is failing, switch to the degraded mode with `featurectl set pricing-consumer.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/pricing-consumer -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 30. ledger-worker

Owner: team platform. Pager: #oncall-platform. Runs 11 replicas in the prod cluster, memory limit 512Mi. Data store: OpenSearch cluster. Main external dependency: the tax API.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- ledger-worker-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- ledger-worker-errors: 5xx above 2% for 5 minutes. Severity: page.
- ledger-worker-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the ledger-worker dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback ledger-worker` before you debug.
3. Check the tax API: its status page and our ledger-worker-dependency panel. If it is failing, switch to the degraded mode with `featurectl set ledger-worker.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/ledger-worker -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the platform secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 31. ledger-indexer

Owner: team platform. Pager: #oncall-platform. Runs 3 replicas in the prod cluster, memory limit 2Gi. Data store: Kafka topic. Main external dependency: the internal auth service.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 700 ms.

Alerts:
- ledger-indexer-latency: p99 above 700 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- ledger-indexer-errors: 5xx above 2% for 5 minutes. Severity: page.
- ledger-indexer-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the ledger-indexer dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback ledger-indexer` before you debug.
3. Check the internal auth service: its status page and our ledger-indexer-dependency panel. If it is failing, switch to the degraded mode with `featurectl set ledger-indexer.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/ledger-indexer -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the platform secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 32. ledger-proxy

Owner: team growth. Pager: #oncall-growth. Runs 5 replicas in the prod cluster, memory limit 2Gi. Data store: Kafka topic. Main external dependency: the internal auth service.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 500 ms.

Alerts:
- ledger-proxy-latency: p99 above 500 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- ledger-proxy-errors: 5xx above 2% for 5 minutes. Severity: page.
- ledger-proxy-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the ledger-proxy dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback ledger-proxy` before you debug.
3. Check the internal auth service: its status page and our ledger-proxy-dependency panel. If it is failing, switch to the degraded mode with `featurectl set ledger-proxy.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/ledger-proxy -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 33. media-api

Owner: team fulfilment. Pager: #oncall-fulfilment. Runs 2 replicas in the prod cluster, memory limit 512Mi. Data store: Postgres (managed, 3 nodes). Main external dependency: the CDN.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- media-api-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- media-api-errors: 5xx above 2% for 5 minutes. Severity: page.
- media-api-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the media-api dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback media-api` before you debug.
3. Check the CDN: its status page and our media-api-dependency panel. If it is failing, switch to the degraded mode with `featurectl set media-api.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/media-api -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the fulfilment secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 34. media-worker

Owner: team platform. Pager: #oncall-platform. Runs 3 replicas in the prod cluster, memory limit 4Gi. Data store: OpenSearch cluster. Main external dependency: the tax API.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- media-worker-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- media-worker-errors: 5xx above 2% for 5 minutes. Severity: page.
- media-worker-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the media-worker dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback media-worker` before you debug.
3. Check the tax API: its status page and our media-worker-dependency panel. If it is failing, switch to the degraded mode with `featurectl set media-worker.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/media-worker -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the platform secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 35. media-indexer

Owner: team data. Pager: #oncall-data. Runs 8 replicas in the prod cluster, memory limit 512Mi. Data store: Redis (cache only). Main external dependency: the CDN.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 300 ms.

Alerts:
- media-indexer-latency: p99 above 300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- media-indexer-errors: 5xx above 2% for 5 minutes. Severity: page.
- media-indexer-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the media-indexer dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback media-indexer` before you debug.
3. Check the CDN: its status page and our media-indexer-dependency panel. If it is failing, switch to the degraded mode with `featurectl set media-indexer.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/media-indexer -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 36. media-cron

Owner: team growth. Pager: #oncall-growth. Runs 11 replicas in the prod cluster, memory limit 512Mi. Data store: Postgres (managed, 3 nodes). Main external dependency: the fraud-scoring model.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 500 ms.

Alerts:
- media-cron-latency: p99 above 500 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- media-cron-errors: 5xx above 2% for 5 minutes. Severity: page.
- media-cron-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the media-cron dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback media-cron` before you debug.
3. Check the fraud-scoring model: its status page and our media-cron-dependency panel. If it is failing, switch to the degraded mode with `featurectl set media-cron.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/media-cron -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 37. media-proxy

Owner: team payments-core. Pager: #oncall-payments-core. Runs 2 replicas in the prod cluster, memory limit 512Mi. Data store: Redis (cache only). Main external dependency: the payments provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 400 ms.

Alerts:
- media-proxy-latency: p99 above 400 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- media-proxy-errors: 5xx above 2% for 5 minutes. Severity: page.
- media-proxy-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the media-proxy dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback media-proxy` before you debug.
3. Check the payments provider: its status page and our media-proxy-dependency panel. If it is failing, switch to the degraded mode with `featurectl set media-proxy.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/media-proxy -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the payments-core secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 38. reviews-api

Owner: team platform. Pager: #oncall-platform. Runs 7 replicas in the prod cluster, memory limit 1Gi. Data store: Postgres (managed, 3 nodes). Main external dependency: the payments provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 300 ms.

Alerts:
- reviews-api-latency: p99 above 300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- reviews-api-errors: 5xx above 2% for 5 minutes. Severity: page.
- reviews-api-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the reviews-api dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback reviews-api` before you debug.
3. Check the payments provider: its status page and our reviews-api-dependency panel. If it is failing, switch to the degraded mode with `featurectl set reviews-api.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/reviews-api -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the platform secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 39. reviews-worker

Owner: team fulfilment. Pager: #oncall-fulfilment. Runs 11 replicas in the prod cluster, memory limit 4Gi. Data store: none. Main external dependency: the CDN.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 700 ms.

Alerts:
- reviews-worker-latency: p99 above 700 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- reviews-worker-errors: 5xx above 2% for 5 minutes. Severity: page.
- reviews-worker-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the reviews-worker dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback reviews-worker` before you debug.
3. Check the CDN: its status page and our reviews-worker-dependency panel. If it is failing, switch to the degraded mode with `featurectl set reviews-worker.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/reviews-worker -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the fulfilment secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 40. reviews-indexer

Owner: team growth. Pager: #oncall-growth. Runs 10 replicas in the prod cluster, memory limit 4Gi. Data store: Kafka topic. Main external dependency: the email provider.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1000 ms.

Alerts:
- reviews-indexer-latency: p99 above 1000 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- reviews-indexer-errors: 5xx above 2% for 5 minutes. Severity: page.
- reviews-indexer-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the reviews-indexer dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback reviews-indexer` before you debug.
3. Check the email provider: its status page and our reviews-indexer-dependency panel. If it is failing, switch to the degraded mode with `featurectl set reviews-indexer.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/reviews-indexer -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 41. reviews-cron

Owner: team data. Pager: #oncall-data. Runs 8 replicas in the prod cluster, memory limit 1Gi. Data store: OpenSearch cluster. Main external dependency: the email provider.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 900 ms.

Alerts:
- reviews-cron-latency: p99 above 900 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- reviews-cron-errors: 5xx above 2% for 5 minutes. Severity: page.
- reviews-cron-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the reviews-cron dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback reviews-cron` before you debug.
3. Check the email provider: its status page and our reviews-cron-dependency panel. If it is failing, switch to the degraded mode with `featurectl set reviews-cron.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/reviews-cron -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 42. reviews-proxy

Owner: team identity. Pager: #oncall-identity. Runs 2 replicas in the prod cluster, memory limit 1Gi. Data store: OpenSearch cluster. Main external dependency: the fraud-scoring model.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 800 ms.

Alerts:
- reviews-proxy-latency: p99 above 800 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- reviews-proxy-errors: 5xx above 2% for 5 minutes. Severity: page.
- reviews-proxy-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the reviews-proxy dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback reviews-proxy` before you debug.
3. Check the fraud-scoring model: its status page and our reviews-proxy-dependency panel. If it is failing, switch to the degraded mode with `featurectl set reviews-proxy.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/reviews-proxy -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 43. gateway-worker

Owner: team platform. Pager: #oncall-platform. Runs 2 replicas in the prod cluster, memory limit 2Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the email provider.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- gateway-worker-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- gateway-worker-errors: 5xx above 2% for 5 minutes. Severity: page.
- gateway-worker-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the gateway-worker dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback gateway-worker` before you debug.
3. Check the email provider: its status page and our gateway-worker-dependency panel. If it is failing, switch to the degraded mode with `featurectl set gateway-worker.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/gateway-worker -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the platform secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 44. gateway-indexer

Owner: team storefront. Pager: #oncall-storefront. Runs 9 replicas in the prod cluster, memory limit 1Gi. Data store: Kafka topic. Main external dependency: the internal auth service.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 700 ms.

Alerts:
- gateway-indexer-latency: p99 above 700 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- gateway-indexer-errors: 5xx above 2% for 5 minutes. Severity: page.
- gateway-indexer-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the gateway-indexer dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback gateway-indexer` before you debug.
3. Check the internal auth service: its status page and our gateway-indexer-dependency panel. If it is failing, switch to the degraded mode with `featurectl set gateway-indexer.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/gateway-indexer -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the storefront secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 45. session-worker

Owner: team identity. Pager: #oncall-identity. Runs 6 replicas in the prod cluster, memory limit 512Mi. Data store: S3-compatible Spaces bucket. Main external dependency: the tax API.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- session-worker-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- session-worker-errors: 5xx above 2% for 5 minutes. Severity: page.
- session-worker-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the session-worker dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback session-worker` before you debug.
3. Check the tax API: its status page and our session-worker-dependency panel. If it is failing, switch to the degraded mode with `featurectl set session-worker.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/session-worker -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 46. session-proxy

Owner: team data. Pager: #oncall-data. Runs 6 replicas in the prod cluster, memory limit 2Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the email provider.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- session-proxy-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- session-proxy-errors: 5xx above 2% for 5 minutes. Severity: page.
- session-proxy-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the session-proxy dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback session-proxy` before you debug.
3. Check the email provider: its status page and our session-proxy-dependency panel. If it is failing, switch to the degraded mode with `featurectl set session-proxy.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/session-proxy -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 47. billing-worker

Owner: team identity. Pager: #oncall-identity. Runs 4 replicas in the prod cluster, memory limit 512Mi. Data store: Kafka topic. Main external dependency: the payments provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 600 ms.

Alerts:
- billing-worker-latency: p99 above 600 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- billing-worker-errors: 5xx above 2% for 5 minutes. Severity: page.
- billing-worker-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the billing-worker dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback billing-worker` before you debug.
3. Check the payments provider: its status page and our billing-worker-dependency panel. If it is failing, switch to the degraded mode with `featurectl set billing-worker.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/billing-worker -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 48. billing-consumer

Owner: team storefront. Pager: #oncall-storefront. Runs 8 replicas in the prod cluster, memory limit 1Gi. Data store: OpenSearch cluster. Main external dependency: the payments provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 1200 ms.

Alerts:
- billing-consumer-latency: p99 above 1200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- billing-consumer-errors: 5xx above 2% for 5 minutes. Severity: page.
- billing-consumer-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the billing-consumer dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback billing-consumer` before you debug.
3. Check the payments provider: its status page and our billing-consumer-dependency panel. If it is failing, switch to the degraded mode with `featurectl set billing-consumer.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/billing-consumer -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the storefront secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 49. export-api

Owner: team storefront. Pager: #oncall-storefront. Runs 5 replicas in the prod cluster, memory limit 4Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the fraud-scoring model.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 500 ms.

Alerts:
- export-api-latency: p99 above 500 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- export-api-errors: 5xx above 2% for 5 minutes. Severity: page.
- export-api-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the export-api dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback export-api` before you debug.
3. Check the fraud-scoring model: its status page and our export-api-dependency panel. If it is failing, switch to the degraded mode with `featurectl set export-api.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/export-api -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the storefront secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 50. export-proxy

Owner: team data. Pager: #oncall-data. Runs 5 replicas in the prod cluster, memory limit 1Gi. Data store: none. Main external dependency: the internal auth service.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 200 ms.

Alerts:
- export-proxy-latency: p99 above 200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- export-proxy-errors: 5xx above 2% for 5 minutes. Severity: page.
- export-proxy-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the export-proxy dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback export-proxy` before you debug.
3. Check the internal auth service: its status page and our export-proxy-dependency panel. If it is failing, switch to the degraded mode with `featurectl set export-proxy.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/export-proxy -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 51. webhooks-api

Owner: team platform. Pager: #oncall-platform. Runs 5 replicas in the prod cluster, memory limit 2Gi. Data store: Postgres (managed, 3 nodes). Main external dependency: the fraud-scoring model.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 200 ms.

Alerts:
- webhooks-api-latency: p99 above 200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- webhooks-api-errors: 5xx above 2% for 5 minutes. Severity: page.
- webhooks-api-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the webhooks-api dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback webhooks-api` before you debug.
3. Check the fraud-scoring model: its status page and our webhooks-api-dependency panel. If it is failing, switch to the degraded mode with `featurectl set webhooks-api.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/webhooks-api -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the platform secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 52. webhooks-worker

Owner: team payments-core. Pager: #oncall-payments-core. Runs 5 replicas in the prod cluster, memory limit 4Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the payments provider.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- webhooks-worker-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- webhooks-worker-errors: 5xx above 2% for 5 minutes. Severity: page.
- webhooks-worker-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the webhooks-worker dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback webhooks-worker` before you debug.
3. Check the payments provider: its status page and our webhooks-worker-dependency panel. If it is failing, switch to the degraded mode with `featurectl set webhooks-worker.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/webhooks-worker -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the payments-core secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 53. webhooks-cron

Owner: team fulfilment. Pager: #oncall-fulfilment. Runs 4 replicas in the prod cluster, memory limit 4Gi. Data store: OpenSearch cluster. Main external dependency: the email provider.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 900 ms.

Alerts:
- webhooks-cron-latency: p99 above 900 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- webhooks-cron-errors: 5xx above 2% for 5 minutes. Severity: page.
- webhooks-cron-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the webhooks-cron dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback webhooks-cron` before you debug.
3. Check the email provider: its status page and our webhooks-cron-dependency panel. If it is failing, switch to the degraded mode with `featurectl set webhooks-cron.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/webhooks-cron -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the fulfilment secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 54. webhooks-consumer

Owner: team data. Pager: #oncall-data. Runs 5 replicas in the prod cluster, memory limit 1Gi. Data store: Kafka topic. Main external dependency: the internal auth service.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 700 ms.

Alerts:
- webhooks-consumer-latency: p99 above 700 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- webhooks-consumer-errors: 5xx above 2% for 5 minutes. Severity: page.
- webhooks-consumer-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the webhooks-consumer dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback webhooks-consumer` before you debug.
3. Check the internal auth service: its status page and our webhooks-consumer-dependency panel. If it is failing, switch to the degraded mode with `featurectl set webhooks-consumer.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/webhooks-consumer -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 55. scheduler-worker

Owner: team data. Pager: #oncall-data. Runs 4 replicas in the prod cluster, memory limit 1Gi. Data store: Kafka topic. Main external dependency: the internal auth service.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 800 ms.

Alerts:
- scheduler-worker-latency: p99 above 800 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- scheduler-worker-errors: 5xx above 2% for 5 minutes. Severity: page.
- scheduler-worker-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the scheduler-worker dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback scheduler-worker` before you debug.
3. Check the internal auth service: its status page and our scheduler-worker-dependency panel. If it is failing, switch to the degraded mode with `featurectl set scheduler-worker.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/scheduler-worker -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 56. scheduler-indexer

Owner: team identity. Pager: #oncall-identity. Runs 5 replicas in the prod cluster, memory limit 2Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the tax API.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 500 ms.

Alerts:
- scheduler-indexer-latency: p99 above 500 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- scheduler-indexer-errors: 5xx above 2% for 5 minutes. Severity: page.
- scheduler-indexer-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the scheduler-indexer dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback scheduler-indexer` before you debug.
3. Check the tax API: its status page and our scheduler-indexer-dependency panel. If it is failing, switch to the degraded mode with `featurectl set scheduler-indexer.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/scheduler-indexer -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 57. scheduler-proxy

Owner: team platform. Pager: #oncall-platform. Runs 4 replicas in the prod cluster, memory limit 512Mi. Data store: Postgres (managed, 3 nodes). Main external dependency: the internal auth service.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 1100 ms.

Alerts:
- scheduler-proxy-latency: p99 above 1100 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- scheduler-proxy-errors: 5xx above 2% for 5 minutes. Severity: page.
- scheduler-proxy-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the scheduler-proxy dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback scheduler-proxy` before you debug.
3. Check the internal auth service: its status page and our scheduler-proxy-dependency panel. If it is failing, switch to the degraded mode with `featurectl set scheduler-proxy.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/scheduler-proxy -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the platform secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 58. audit-api

Owner: team growth. Pager: #oncall-growth. Runs 4 replicas in the prod cluster, memory limit 4Gi. Data store: Postgres (managed, 3 nodes). Main external dependency: the internal auth service.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1100 ms.

Alerts:
- audit-api-latency: p99 above 1100 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- audit-api-errors: 5xx above 2% for 5 minutes. Severity: page.
- audit-api-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the audit-api dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback audit-api` before you debug.
3. Check the internal auth service: its status page and our audit-api-dependency panel. If it is failing, switch to the degraded mode with `featurectl set audit-api.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/audit-api -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 59. audit-indexer

Owner: team fulfilment. Pager: #oncall-fulfilment. Runs 7 replicas in the prod cluster, memory limit 2Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the fraud-scoring model.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 900 ms.

Alerts:
- audit-indexer-latency: p99 above 900 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- audit-indexer-errors: 5xx above 2% for 5 minutes. Severity: page.
- audit-indexer-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the audit-indexer dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback audit-indexer` before you debug.
3. Check the fraud-scoring model: its status page and our audit-indexer-dependency panel. If it is failing, switch to the degraded mode with `featurectl set audit-indexer.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/audit-indexer -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the fulfilment secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 60. audit-cron

Owner: team identity. Pager: #oncall-identity. Runs 10 replicas in the prod cluster, memory limit 2Gi. Data store: Postgres (managed, 3 nodes). Main external dependency: the payments provider.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 400 ms.

Alerts:
- audit-cron-latency: p99 above 400 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- audit-cron-errors: 5xx above 2% for 5 minutes. Severity: page.
- audit-cron-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the audit-cron dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback audit-cron` before you debug.
3. Check the payments provider: its status page and our audit-cron-dependency panel. If it is failing, switch to the degraded mode with `featurectl set audit-cron.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/audit-cron -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 61. audit-consumer

Owner: team fulfilment. Pager: #oncall-fulfilment. Runs 3 replicas in the prod cluster, memory limit 4Gi. Data store: OpenSearch cluster. Main external dependency: the tax API.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- audit-consumer-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- audit-consumer-errors: 5xx above 2% for 5 minutes. Severity: page.
- audit-consumer-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the audit-consumer dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback audit-consumer` before you debug.
3. Check the tax API: its status page and our audit-consumer-dependency panel. If it is failing, switch to the degraded mode with `featurectl set audit-consumer.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/audit-consumer -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the fulfilment secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 62. reports-api

Owner: team growth. Pager: #oncall-growth. Runs 5 replicas in the prod cluster, memory limit 4Gi. Data store: Postgres (managed, 3 nodes). Main external dependency: the payments provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 400 ms.

Alerts:
- reports-api-latency: p99 above 400 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- reports-api-errors: 5xx above 2% for 5 minutes. Severity: page.
- reports-api-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the reports-api dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback reports-api` before you debug.
3. Check the payments provider: its status page and our reports-api-dependency panel. If it is failing, switch to the degraded mode with `featurectl set reports-api.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/reports-api -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 63. reports-indexer

Owner: team payments-core. Pager: #oncall-payments-core. Runs 5 replicas in the prod cluster, memory limit 1Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the CDN.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- reports-indexer-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- reports-indexer-errors: 5xx above 2% for 5 minutes. Severity: page.
- reports-indexer-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the reports-indexer dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback reports-indexer` before you debug.
3. Check the CDN: its status page and our reports-indexer-dependency panel. If it is failing, switch to the degraded mode with `featurectl set reports-indexer.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/reports-indexer -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the payments-core secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 64. reports-consumer

Owner: team data. Pager: #oncall-data. Runs 6 replicas in the prod cluster, memory limit 512Mi. Data store: Redis (cache only). Main external dependency: the internal auth service.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 200 ms.

Alerts:
- reports-consumer-latency: p99 above 200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- reports-consumer-errors: 5xx above 2% for 5 minutes. Severity: page.
- reports-consumer-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the reports-consumer dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback reports-consumer` before you debug.
3. Check the internal auth service: its status page and our reports-consumer-dependency panel. If it is failing, switch to the degraded mode with `featurectl set reports-consumer.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/reports-consumer -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 65. checkout-api-2

Owner: team growth. Pager: #oncall-growth. Runs 4 replicas in the prod cluster, memory limit 4Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the CDN.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- checkout-api-2-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- checkout-api-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- checkout-api-2-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the checkout-api-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback checkout-api-2` before you debug.
3. Check the CDN: its status page and our checkout-api-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set checkout-api-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/checkout-api-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 66. checkout-indexer-2

Owner: team storefront. Pager: #oncall-storefront. Runs 5 replicas in the prod cluster, memory limit 4Gi. Data store: none. Main external dependency: the tax API.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 900 ms.

Alerts:
- checkout-indexer-2-latency: p99 above 900 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- checkout-indexer-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- checkout-indexer-2-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the checkout-indexer-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback checkout-indexer-2` before you debug.
3. Check the tax API: its status page and our checkout-indexer-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set checkout-indexer-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/checkout-indexer-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the storefront secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 67. checkout-cron-2

Owner: team payments-core. Pager: #oncall-payments-core. Runs 2 replicas in the prod cluster, memory limit 512Mi. Data store: Redis (cache only). Main external dependency: the fraud-scoring model.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 1200 ms.

Alerts:
- checkout-cron-2-latency: p99 above 1200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- checkout-cron-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- checkout-cron-2-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the checkout-cron-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback checkout-cron-2` before you debug.
3. Check the fraud-scoring model: its status page and our checkout-cron-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set checkout-cron-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/checkout-cron-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the payments-core secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 68. payments-worker-2

Owner: team fulfilment. Pager: #oncall-fulfilment. Runs 4 replicas in the prod cluster, memory limit 2Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the CDN.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 1200 ms.

Alerts:
- payments-worker-2-latency: p99 above 1200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- payments-worker-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- payments-worker-2-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the payments-worker-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback payments-worker-2` before you debug.
3. Check the CDN: its status page and our payments-worker-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set payments-worker-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/payments-worker-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the fulfilment secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 69. payments-cron-2

Owner: team data. Pager: #oncall-data. Runs 6 replicas in the prod cluster, memory limit 2Gi. Data store: Kafka topic. Main external dependency: the fraud-scoring model.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 800 ms.

Alerts:
- payments-cron-2-latency: p99 above 800 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- payments-cron-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- payments-cron-2-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the payments-cron-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback payments-cron-2` before you debug.
3. Check the fraud-scoring model: its status page and our payments-cron-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set payments-cron-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/payments-cron-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 70. payments-proxy-2

Owner: team storefront. Pager: #oncall-storefront. Runs 10 replicas in the prod cluster, memory limit 512Mi. Data store: S3-compatible Spaces bucket. Main external dependency: the internal auth service.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 400 ms.

Alerts:
- payments-proxy-2-latency: p99 above 400 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- payments-proxy-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- payments-proxy-2-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the payments-proxy-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback payments-proxy-2` before you debug.
3. Check the internal auth service: its status page and our payments-proxy-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set payments-proxy-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/payments-proxy-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the storefront secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 71. search-api-2

Owner: team payments-core. Pager: #oncall-payments-core. Runs 11 replicas in the prod cluster, memory limit 512Mi. Data store: Kafka topic. Main external dependency: the payments provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 500 ms.

Alerts:
- search-api-2-latency: p99 above 500 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- search-api-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- search-api-2-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the search-api-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback search-api-2` before you debug.
3. Check the payments provider: its status page and our search-api-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set search-api-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/search-api-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the payments-core secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 72. search-worker-2

Owner: team growth. Pager: #oncall-growth. Runs 11 replicas in the prod cluster, memory limit 4Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the internal auth service.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 600 ms.

Alerts:
- search-worker-2-latency: p99 above 600 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- search-worker-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- search-worker-2-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the search-worker-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback search-worker-2` before you debug.
3. Check the internal auth service: its status page and our search-worker-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set search-worker-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/search-worker-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 73. search-indexer-2

Owner: team storefront. Pager: #oncall-storefront. Runs 2 replicas in the prod cluster, memory limit 512Mi. Data store: S3-compatible Spaces bucket. Main external dependency: the email provider.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 900 ms.

Alerts:
- search-indexer-2-latency: p99 above 900 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- search-indexer-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- search-indexer-2-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the search-indexer-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback search-indexer-2` before you debug.
3. Check the email provider: its status page and our search-indexer-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set search-indexer-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/search-indexer-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the storefront secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 74. search-consumer-2

Owner: team storefront. Pager: #oncall-storefront. Runs 10 replicas in the prod cluster, memory limit 1Gi. Data store: Redis (cache only). Main external dependency: the tax API.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 800 ms.

Alerts:
- search-consumer-2-latency: p99 above 800 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- search-consumer-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- search-consumer-2-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the search-consumer-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback search-consumer-2` before you debug.
3. Check the tax API: its status page and our search-consumer-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set search-consumer-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/search-consumer-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the storefront secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 75. search-proxy-2

Owner: team identity. Pager: #oncall-identity. Runs 4 replicas in the prod cluster, memory limit 2Gi. Data store: Kafka topic. Main external dependency: the email provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 200 ms.

Alerts:
- search-proxy-2-latency: p99 above 200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- search-proxy-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- search-proxy-2-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the search-proxy-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback search-proxy-2` before you debug.
3. Check the email provider: its status page and our search-proxy-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set search-proxy-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/search-proxy-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 76. catalog-api-2

Owner: team fulfilment. Pager: #oncall-fulfilment. Runs 8 replicas in the prod cluster, memory limit 2Gi. Data store: Postgres (managed, 3 nodes). Main external dependency: the payments provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 600 ms.

Alerts:
- catalog-api-2-latency: p99 above 600 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- catalog-api-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- catalog-api-2-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the catalog-api-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback catalog-api-2` before you debug.
3. Check the payments provider: its status page and our catalog-api-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set catalog-api-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/catalog-api-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the fulfilment secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 77. catalog-worker-2

Owner: team payments-core. Pager: #oncall-payments-core. Runs 8 replicas in the prod cluster, memory limit 512Mi. Data store: Kafka topic. Main external dependency: the payments provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 900 ms.

Alerts:
- catalog-worker-2-latency: p99 above 900 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- catalog-worker-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- catalog-worker-2-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the catalog-worker-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback catalog-worker-2` before you debug.
3. Check the payments provider: its status page and our catalog-worker-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set catalog-worker-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/catalog-worker-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the payments-core secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 78. catalog-cron-2

Owner: team identity. Pager: #oncall-identity. Runs 7 replicas in the prod cluster, memory limit 1Gi. Data store: OpenSearch cluster. Main external dependency: the fraud-scoring model.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 1200 ms.

Alerts:
- catalog-cron-2-latency: p99 above 1200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- catalog-cron-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- catalog-cron-2-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the catalog-cron-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback catalog-cron-2` before you debug.
3. Check the fraud-scoring model: its status page and our catalog-cron-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set catalog-cron-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/catalog-cron-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 79. auth-api-2

Owner: team data. Pager: #oncall-data. Runs 11 replicas in the prod cluster, memory limit 512Mi. Data store: none. Main external dependency: the tax API.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 800 ms.

Alerts:
- auth-api-2-latency: p99 above 800 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- auth-api-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- auth-api-2-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the auth-api-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback auth-api-2` before you debug.
3. Check the tax API: its status page and our auth-api-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set auth-api-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/auth-api-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 80. auth-worker-2

Owner: team payments-core. Pager: #oncall-payments-core. Runs 6 replicas in the prod cluster, memory limit 4Gi. Data store: none. Main external dependency: the tax API.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 200 ms.

Alerts:
- auth-worker-2-latency: p99 above 200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- auth-worker-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- auth-worker-2-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the auth-worker-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback auth-worker-2` before you debug.
3. Check the tax API: its status page and our auth-worker-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set auth-worker-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/auth-worker-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the payments-core secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 81. auth-indexer-2

Owner: team growth. Pager: #oncall-growth. Runs 8 replicas in the prod cluster, memory limit 2Gi. Data store: OpenSearch cluster. Main external dependency: the fraud-scoring model.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- auth-indexer-2-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- auth-indexer-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- auth-indexer-2-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the auth-indexer-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback auth-indexer-2` before you debug.
3. Check the fraud-scoring model: its status page and our auth-indexer-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set auth-indexer-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/auth-indexer-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 82. auth-consumer-2

Owner: team identity. Pager: #oncall-identity. Runs 11 replicas in the prod cluster, memory limit 1Gi. Data store: Kafka topic. Main external dependency: the payments provider.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 700 ms.

Alerts:
- auth-consumer-2-latency: p99 above 700 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- auth-consumer-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- auth-consumer-2-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the auth-consumer-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback auth-consumer-2` before you debug.
3. Check the payments provider: its status page and our auth-consumer-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set auth-consumer-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/auth-consumer-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 83. auth-proxy-2

Owner: team platform. Pager: #oncall-platform. Runs 6 replicas in the prod cluster, memory limit 1Gi. Data store: Kafka topic. Main external dependency: the CDN.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- auth-proxy-2-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- auth-proxy-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- auth-proxy-2-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the auth-proxy-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback auth-proxy-2` before you debug.
3. Check the CDN: its status page and our auth-proxy-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set auth-proxy-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/auth-proxy-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the platform secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 84. inventory-worker-2

Owner: team growth. Pager: #oncall-growth. Runs 4 replicas in the prod cluster, memory limit 512Mi. Data store: OpenSearch cluster. Main external dependency: the email provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 900 ms.

Alerts:
- inventory-worker-2-latency: p99 above 900 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- inventory-worker-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- inventory-worker-2-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the inventory-worker-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback inventory-worker-2` before you debug.
3. Check the email provider: its status page and our inventory-worker-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set inventory-worker-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/inventory-worker-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 85. inventory-cron-2

Owner: team platform. Pager: #oncall-platform. Runs 10 replicas in the prod cluster, memory limit 512Mi. Data store: Kafka topic. Main external dependency: the payments provider.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 500 ms.

Alerts:
- inventory-cron-2-latency: p99 above 500 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- inventory-cron-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- inventory-cron-2-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the inventory-cron-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback inventory-cron-2` before you debug.
3. Check the payments provider: its status page and our inventory-cron-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set inventory-cron-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/inventory-cron-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the platform secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 86. inventory-consumer-2

Owner: team fulfilment. Pager: #oncall-fulfilment. Runs 5 replicas in the prod cluster, memory limit 512Mi. Data store: S3-compatible Spaces bucket. Main external dependency: the email provider.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 900 ms.

Alerts:
- inventory-consumer-2-latency: p99 above 900 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- inventory-consumer-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- inventory-consumer-2-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the inventory-consumer-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback inventory-consumer-2` before you debug.
3. Check the email provider: its status page and our inventory-consumer-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set inventory-consumer-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/inventory-consumer-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the fulfilment secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 87. inventory-proxy-2

Owner: team identity. Pager: #oncall-identity. Runs 8 replicas in the prod cluster, memory limit 4Gi. Data store: none. Main external dependency: the email provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 800 ms.

Alerts:
- inventory-proxy-2-latency: p99 above 800 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- inventory-proxy-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- inventory-proxy-2-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the inventory-proxy-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback inventory-proxy-2` before you debug.
3. Check the email provider: its status page and our inventory-proxy-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set inventory-proxy-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/inventory-proxy-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 88. notify-cron-2

Owner: team storefront. Pager: #oncall-storefront. Runs 4 replicas in the prod cluster, memory limit 512Mi. Data store: none. Main external dependency: the payments provider.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1100 ms.

Alerts:
- notify-cron-2-latency: p99 above 1100 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- notify-cron-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- notify-cron-2-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the notify-cron-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback notify-cron-2` before you debug.
3. Check the payments provider: its status page and our notify-cron-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set notify-cron-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/notify-cron-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the storefront secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 89. pricing-api-2

Owner: team payments-core. Pager: #oncall-payments-core. Runs 6 replicas in the prod cluster, memory limit 4Gi. Data store: Kafka topic. Main external dependency: the email provider.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- pricing-api-2-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- pricing-api-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- pricing-api-2-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the pricing-api-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback pricing-api-2` before you debug.
3. Check the email provider: its status page and our pricing-api-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set pricing-api-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/pricing-api-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the payments-core secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 90. pricing-worker-2

Owner: team identity. Pager: #oncall-identity. Runs 11 replicas in the prod cluster, memory limit 512Mi. Data store: Postgres (managed, 3 nodes). Main external dependency: the email provider.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 200 ms.

Alerts:
- pricing-worker-2-latency: p99 above 200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- pricing-worker-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- pricing-worker-2-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the pricing-worker-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback pricing-worker-2` before you debug.
3. Check the email provider: its status page and our pricing-worker-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set pricing-worker-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/pricing-worker-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 91. pricing-indexer-2

Owner: team data. Pager: #oncall-data. Runs 7 replicas in the prod cluster, memory limit 512Mi. Data store: S3-compatible Spaces bucket. Main external dependency: the email provider.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 400 ms.

Alerts:
- pricing-indexer-2-latency: p99 above 400 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- pricing-indexer-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- pricing-indexer-2-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the pricing-indexer-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback pricing-indexer-2` before you debug.
3. Check the email provider: its status page and our pricing-indexer-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set pricing-indexer-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/pricing-indexer-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 92. pricing-cron-2

Owner: team growth. Pager: #oncall-growth. Runs 7 replicas in the prod cluster, memory limit 2Gi. Data store: OpenSearch cluster. Main external dependency: the CDN.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 800 ms.

Alerts:
- pricing-cron-2-latency: p99 above 800 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- pricing-cron-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- pricing-cron-2-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the pricing-cron-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback pricing-cron-2` before you debug.
3. Check the CDN: its status page and our pricing-cron-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set pricing-cron-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/pricing-cron-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 93. pricing-consumer-2

Owner: team data. Pager: #oncall-data. Runs 9 replicas in the prod cluster, memory limit 4Gi. Data store: none. Main external dependency: the payments provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 400 ms.

Alerts:
- pricing-consumer-2-latency: p99 above 400 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- pricing-consumer-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- pricing-consumer-2-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the pricing-consumer-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback pricing-consumer-2` before you debug.
3. Check the payments provider: its status page and our pricing-consumer-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set pricing-consumer-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/pricing-consumer-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 94. ledger-worker-2

Owner: team platform. Pager: #oncall-platform. Runs 11 replicas in the prod cluster, memory limit 512Mi. Data store: OpenSearch cluster. Main external dependency: the tax API.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- ledger-worker-2-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- ledger-worker-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- ledger-worker-2-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the ledger-worker-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback ledger-worker-2` before you debug.
3. Check the tax API: its status page and our ledger-worker-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set ledger-worker-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/ledger-worker-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the platform secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 95. ledger-indexer-2

Owner: team platform. Pager: #oncall-platform. Runs 3 replicas in the prod cluster, memory limit 2Gi. Data store: Kafka topic. Main external dependency: the internal auth service.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 700 ms.

Alerts:
- ledger-indexer-2-latency: p99 above 700 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- ledger-indexer-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- ledger-indexer-2-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the ledger-indexer-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback ledger-indexer-2` before you debug.
3. Check the internal auth service: its status page and our ledger-indexer-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set ledger-indexer-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/ledger-indexer-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the platform secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 96. ledger-proxy-2

Owner: team growth. Pager: #oncall-growth. Runs 5 replicas in the prod cluster, memory limit 2Gi. Data store: Kafka topic. Main external dependency: the internal auth service.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 500 ms.

Alerts:
- ledger-proxy-2-latency: p99 above 500 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- ledger-proxy-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- ledger-proxy-2-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the ledger-proxy-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback ledger-proxy-2` before you debug.
3. Check the internal auth service: its status page and our ledger-proxy-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set ledger-proxy-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/ledger-proxy-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 97. media-api-2

Owner: team fulfilment. Pager: #oncall-fulfilment. Runs 2 replicas in the prod cluster, memory limit 512Mi. Data store: Postgres (managed, 3 nodes). Main external dependency: the CDN.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- media-api-2-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- media-api-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- media-api-2-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the media-api-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback media-api-2` before you debug.
3. Check the CDN: its status page and our media-api-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set media-api-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/media-api-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the fulfilment secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 98. media-worker-2

Owner: team platform. Pager: #oncall-platform. Runs 3 replicas in the prod cluster, memory limit 4Gi. Data store: OpenSearch cluster. Main external dependency: the tax API.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- media-worker-2-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- media-worker-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- media-worker-2-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the media-worker-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback media-worker-2` before you debug.
3. Check the tax API: its status page and our media-worker-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set media-worker-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/media-worker-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the platform secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 99. media-indexer-2

Owner: team data. Pager: #oncall-data. Runs 8 replicas in the prod cluster, memory limit 512Mi. Data store: Redis (cache only). Main external dependency: the CDN.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 300 ms.

Alerts:
- media-indexer-2-latency: p99 above 300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- media-indexer-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- media-indexer-2-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the media-indexer-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback media-indexer-2` before you debug.
3. Check the CDN: its status page and our media-indexer-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set media-indexer-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/media-indexer-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 100. media-cron-2

Owner: team growth. Pager: #oncall-growth. Runs 11 replicas in the prod cluster, memory limit 512Mi. Data store: Postgres (managed, 3 nodes). Main external dependency: the fraud-scoring model.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 500 ms.

Alerts:
- media-cron-2-latency: p99 above 500 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- media-cron-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- media-cron-2-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the media-cron-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback media-cron-2` before you debug.
3. Check the fraud-scoring model: its status page and our media-cron-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set media-cron-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/media-cron-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 101. media-proxy-2

Owner: team payments-core. Pager: #oncall-payments-core. Runs 2 replicas in the prod cluster, memory limit 512Mi. Data store: Redis (cache only). Main external dependency: the payments provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 400 ms.

Alerts:
- media-proxy-2-latency: p99 above 400 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- media-proxy-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- media-proxy-2-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the media-proxy-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback media-proxy-2` before you debug.
3. Check the payments provider: its status page and our media-proxy-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set media-proxy-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/media-proxy-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the payments-core secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 102. reviews-api-2

Owner: team platform. Pager: #oncall-platform. Runs 7 replicas in the prod cluster, memory limit 1Gi. Data store: Postgres (managed, 3 nodes). Main external dependency: the payments provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 300 ms.

Alerts:
- reviews-api-2-latency: p99 above 300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- reviews-api-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- reviews-api-2-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the reviews-api-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback reviews-api-2` before you debug.
3. Check the payments provider: its status page and our reviews-api-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set reviews-api-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/reviews-api-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the platform secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 103. reviews-worker-2

Owner: team fulfilment. Pager: #oncall-fulfilment. Runs 11 replicas in the prod cluster, memory limit 4Gi. Data store: none. Main external dependency: the CDN.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 700 ms.

Alerts:
- reviews-worker-2-latency: p99 above 700 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- reviews-worker-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- reviews-worker-2-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the reviews-worker-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback reviews-worker-2` before you debug.
3. Check the CDN: its status page and our reviews-worker-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set reviews-worker-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/reviews-worker-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the fulfilment secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 104. reviews-indexer-2

Owner: team growth. Pager: #oncall-growth. Runs 10 replicas in the prod cluster, memory limit 4Gi. Data store: Kafka topic. Main external dependency: the email provider.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1000 ms.

Alerts:
- reviews-indexer-2-latency: p99 above 1000 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- reviews-indexer-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- reviews-indexer-2-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the reviews-indexer-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback reviews-indexer-2` before you debug.
3. Check the email provider: its status page and our reviews-indexer-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set reviews-indexer-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/reviews-indexer-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 105. reviews-cron-2

Owner: team data. Pager: #oncall-data. Runs 8 replicas in the prod cluster, memory limit 1Gi. Data store: OpenSearch cluster. Main external dependency: the email provider.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 900 ms.

Alerts:
- reviews-cron-2-latency: p99 above 900 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- reviews-cron-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- reviews-cron-2-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the reviews-cron-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback reviews-cron-2` before you debug.
3. Check the email provider: its status page and our reviews-cron-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set reviews-cron-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/reviews-cron-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 106. reviews-proxy-2

Owner: team identity. Pager: #oncall-identity. Runs 2 replicas in the prod cluster, memory limit 1Gi. Data store: OpenSearch cluster. Main external dependency: the fraud-scoring model.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 800 ms.

Alerts:
- reviews-proxy-2-latency: p99 above 800 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- reviews-proxy-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- reviews-proxy-2-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the reviews-proxy-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback reviews-proxy-2` before you debug.
3. Check the fraud-scoring model: its status page and our reviews-proxy-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set reviews-proxy-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/reviews-proxy-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 107. gateway-worker-2

Owner: team platform. Pager: #oncall-platform. Runs 2 replicas in the prod cluster, memory limit 2Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the email provider.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- gateway-worker-2-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- gateway-worker-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- gateway-worker-2-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the gateway-worker-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback gateway-worker-2` before you debug.
3. Check the email provider: its status page and our gateway-worker-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set gateway-worker-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/gateway-worker-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the platform secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 108. gateway-indexer-2

Owner: team storefront. Pager: #oncall-storefront. Runs 9 replicas in the prod cluster, memory limit 1Gi. Data store: Kafka topic. Main external dependency: the internal auth service.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 700 ms.

Alerts:
- gateway-indexer-2-latency: p99 above 700 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- gateway-indexer-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- gateway-indexer-2-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the gateway-indexer-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback gateway-indexer-2` before you debug.
3. Check the internal auth service: its status page and our gateway-indexer-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set gateway-indexer-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/gateway-indexer-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the storefront secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 109. session-worker-2

Owner: team identity. Pager: #oncall-identity. Runs 6 replicas in the prod cluster, memory limit 512Mi. Data store: S3-compatible Spaces bucket. Main external dependency: the tax API.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- session-worker-2-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- session-worker-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- session-worker-2-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the session-worker-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback session-worker-2` before you debug.
3. Check the tax API: its status page and our session-worker-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set session-worker-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/session-worker-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 110. session-proxy-2

Owner: team data. Pager: #oncall-data. Runs 6 replicas in the prod cluster, memory limit 2Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the email provider.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- session-proxy-2-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- session-proxy-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- session-proxy-2-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the session-proxy-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback session-proxy-2` before you debug.
3. Check the email provider: its status page and our session-proxy-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set session-proxy-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/session-proxy-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 111. billing-worker-2

Owner: team identity. Pager: #oncall-identity. Runs 4 replicas in the prod cluster, memory limit 512Mi. Data store: Kafka topic. Main external dependency: the payments provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 600 ms.

Alerts:
- billing-worker-2-latency: p99 above 600 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- billing-worker-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- billing-worker-2-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the billing-worker-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback billing-worker-2` before you debug.
3. Check the payments provider: its status page and our billing-worker-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set billing-worker-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/billing-worker-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 112. billing-consumer-2

Owner: team storefront. Pager: #oncall-storefront. Runs 8 replicas in the prod cluster, memory limit 1Gi. Data store: OpenSearch cluster. Main external dependency: the payments provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 1200 ms.

Alerts:
- billing-consumer-2-latency: p99 above 1200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- billing-consumer-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- billing-consumer-2-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the billing-consumer-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback billing-consumer-2` before you debug.
3. Check the payments provider: its status page and our billing-consumer-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set billing-consumer-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/billing-consumer-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the storefront secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 113. export-api-2

Owner: team storefront. Pager: #oncall-storefront. Runs 5 replicas in the prod cluster, memory limit 4Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the fraud-scoring model.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 500 ms.

Alerts:
- export-api-2-latency: p99 above 500 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- export-api-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- export-api-2-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the export-api-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback export-api-2` before you debug.
3. Check the fraud-scoring model: its status page and our export-api-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set export-api-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/export-api-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the storefront secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 114. export-proxy-2

Owner: team data. Pager: #oncall-data. Runs 5 replicas in the prod cluster, memory limit 1Gi. Data store: none. Main external dependency: the internal auth service.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 200 ms.

Alerts:
- export-proxy-2-latency: p99 above 200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- export-proxy-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- export-proxy-2-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the export-proxy-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback export-proxy-2` before you debug.
3. Check the internal auth service: its status page and our export-proxy-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set export-proxy-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/export-proxy-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 115. webhooks-api-2

Owner: team platform. Pager: #oncall-platform. Runs 5 replicas in the prod cluster, memory limit 2Gi. Data store: Postgres (managed, 3 nodes). Main external dependency: the fraud-scoring model.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 200 ms.

Alerts:
- webhooks-api-2-latency: p99 above 200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- webhooks-api-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- webhooks-api-2-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the webhooks-api-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback webhooks-api-2` before you debug.
3. Check the fraud-scoring model: its status page and our webhooks-api-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set webhooks-api-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/webhooks-api-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the platform secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 116. webhooks-worker-2

Owner: team payments-core. Pager: #oncall-payments-core. Runs 5 replicas in the prod cluster, memory limit 4Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the payments provider.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- webhooks-worker-2-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- webhooks-worker-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- webhooks-worker-2-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the webhooks-worker-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback webhooks-worker-2` before you debug.
3. Check the payments provider: its status page and our webhooks-worker-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set webhooks-worker-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/webhooks-worker-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the payments-core secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 117. webhooks-cron-2

Owner: team fulfilment. Pager: #oncall-fulfilment. Runs 4 replicas in the prod cluster, memory limit 4Gi. Data store: OpenSearch cluster. Main external dependency: the email provider.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 900 ms.

Alerts:
- webhooks-cron-2-latency: p99 above 900 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- webhooks-cron-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- webhooks-cron-2-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the webhooks-cron-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback webhooks-cron-2` before you debug.
3. Check the email provider: its status page and our webhooks-cron-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set webhooks-cron-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/webhooks-cron-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the fulfilment secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 118. webhooks-consumer-2

Owner: team data. Pager: #oncall-data. Runs 5 replicas in the prod cluster, memory limit 1Gi. Data store: Kafka topic. Main external dependency: the internal auth service.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 700 ms.

Alerts:
- webhooks-consumer-2-latency: p99 above 700 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- webhooks-consumer-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- webhooks-consumer-2-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the webhooks-consumer-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback webhooks-consumer-2` before you debug.
3. Check the internal auth service: its status page and our webhooks-consumer-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set webhooks-consumer-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/webhooks-consumer-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 119. scheduler-worker-2

Owner: team data. Pager: #oncall-data. Runs 4 replicas in the prod cluster, memory limit 1Gi. Data store: Kafka topic. Main external dependency: the internal auth service.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 800 ms.

Alerts:
- scheduler-worker-2-latency: p99 above 800 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- scheduler-worker-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- scheduler-worker-2-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the scheduler-worker-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback scheduler-worker-2` before you debug.
3. Check the internal auth service: its status page and our scheduler-worker-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set scheduler-worker-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/scheduler-worker-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 120. scheduler-indexer-2

Owner: team identity. Pager: #oncall-identity. Runs 5 replicas in the prod cluster, memory limit 2Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the tax API.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 500 ms.

Alerts:
- scheduler-indexer-2-latency: p99 above 500 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- scheduler-indexer-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- scheduler-indexer-2-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the scheduler-indexer-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback scheduler-indexer-2` before you debug.
3. Check the tax API: its status page and our scheduler-indexer-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set scheduler-indexer-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/scheduler-indexer-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 121. scheduler-proxy-2

Owner: team platform. Pager: #oncall-platform. Runs 4 replicas in the prod cluster, memory limit 512Mi. Data store: Postgres (managed, 3 nodes). Main external dependency: the internal auth service.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 1100 ms.

Alerts:
- scheduler-proxy-2-latency: p99 above 1100 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- scheduler-proxy-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- scheduler-proxy-2-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the scheduler-proxy-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback scheduler-proxy-2` before you debug.
3. Check the internal auth service: its status page and our scheduler-proxy-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set scheduler-proxy-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/scheduler-proxy-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the platform secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 122. audit-api-2

Owner: team growth. Pager: #oncall-growth. Runs 4 replicas in the prod cluster, memory limit 4Gi. Data store: Postgres (managed, 3 nodes). Main external dependency: the internal auth service.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1100 ms.

Alerts:
- audit-api-2-latency: p99 above 1100 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- audit-api-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- audit-api-2-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the audit-api-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback audit-api-2` before you debug.
3. Check the internal auth service: its status page and our audit-api-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set audit-api-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/audit-api-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 123. audit-indexer-2

Owner: team fulfilment. Pager: #oncall-fulfilment. Runs 7 replicas in the prod cluster, memory limit 2Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the fraud-scoring model.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 900 ms.

Alerts:
- audit-indexer-2-latency: p99 above 900 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- audit-indexer-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- audit-indexer-2-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the audit-indexer-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback audit-indexer-2` before you debug.
3. Check the fraud-scoring model: its status page and our audit-indexer-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set audit-indexer-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/audit-indexer-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the fulfilment secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 124. audit-cron-2

Owner: team identity. Pager: #oncall-identity. Runs 10 replicas in the prod cluster, memory limit 2Gi. Data store: Postgres (managed, 3 nodes). Main external dependency: the payments provider.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 400 ms.

Alerts:
- audit-cron-2-latency: p99 above 400 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- audit-cron-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- audit-cron-2-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the audit-cron-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback audit-cron-2` before you debug.
3. Check the payments provider: its status page and our audit-cron-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set audit-cron-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/audit-cron-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 125. audit-consumer-2

Owner: team fulfilment. Pager: #oncall-fulfilment. Runs 3 replicas in the prod cluster, memory limit 4Gi. Data store: OpenSearch cluster. Main external dependency: the tax API.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- audit-consumer-2-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- audit-consumer-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- audit-consumer-2-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the audit-consumer-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback audit-consumer-2` before you debug.
3. Check the tax API: its status page and our audit-consumer-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set audit-consumer-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/audit-consumer-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the fulfilment secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 126. reports-api-2

Owner: team growth. Pager: #oncall-growth. Runs 5 replicas in the prod cluster, memory limit 4Gi. Data store: Postgres (managed, 3 nodes). Main external dependency: the payments provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 400 ms.

Alerts:
- reports-api-2-latency: p99 above 400 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- reports-api-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- reports-api-2-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the reports-api-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback reports-api-2` before you debug.
3. Check the payments provider: its status page and our reports-api-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set reports-api-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/reports-api-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 127. reports-indexer-2

Owner: team payments-core. Pager: #oncall-payments-core. Runs 5 replicas in the prod cluster, memory limit 1Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the CDN.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- reports-indexer-2-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- reports-indexer-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- reports-indexer-2-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the reports-indexer-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback reports-indexer-2` before you debug.
3. Check the CDN: its status page and our reports-indexer-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set reports-indexer-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/reports-indexer-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the payments-core secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 128. reports-consumer-2

Owner: team data. Pager: #oncall-data. Runs 6 replicas in the prod cluster, memory limit 512Mi. Data store: Redis (cache only). Main external dependency: the internal auth service.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 200 ms.

Alerts:
- reports-consumer-2-latency: p99 above 200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- reports-consumer-2-errors: 5xx above 2% for 5 minutes. Severity: page.
- reports-consumer-2-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the reports-consumer-2 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback reports-consumer-2` before you debug.
3. Check the internal auth service: its status page and our reports-consumer-2-dependency panel. If it is failing, switch to the degraded mode with `featurectl set reports-consumer-2.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/reports-consumer-2 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 129. checkout-api-3

Owner: team growth. Pager: #oncall-growth. Runs 4 replicas in the prod cluster, memory limit 4Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the CDN.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- checkout-api-3-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- checkout-api-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- checkout-api-3-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the checkout-api-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback checkout-api-3` before you debug.
3. Check the CDN: its status page and our checkout-api-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set checkout-api-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/checkout-api-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 130. checkout-indexer-3

Owner: team storefront. Pager: #oncall-storefront. Runs 5 replicas in the prod cluster, memory limit 4Gi. Data store: none. Main external dependency: the tax API.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 900 ms.

Alerts:
- checkout-indexer-3-latency: p99 above 900 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- checkout-indexer-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- checkout-indexer-3-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the checkout-indexer-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback checkout-indexer-3` before you debug.
3. Check the tax API: its status page and our checkout-indexer-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set checkout-indexer-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/checkout-indexer-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the storefront secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 131. checkout-cron-3

Owner: team payments-core. Pager: #oncall-payments-core. Runs 2 replicas in the prod cluster, memory limit 512Mi. Data store: Redis (cache only). Main external dependency: the fraud-scoring model.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 1200 ms.

Alerts:
- checkout-cron-3-latency: p99 above 1200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- checkout-cron-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- checkout-cron-3-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the checkout-cron-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback checkout-cron-3` before you debug.
3. Check the fraud-scoring model: its status page and our checkout-cron-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set checkout-cron-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/checkout-cron-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the payments-core secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 132. payments-worker-3

Owner: team fulfilment. Pager: #oncall-fulfilment. Runs 4 replicas in the prod cluster, memory limit 2Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the CDN.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 1200 ms.

Alerts:
- payments-worker-3-latency: p99 above 1200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- payments-worker-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- payments-worker-3-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the payments-worker-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback payments-worker-3` before you debug.
3. Check the CDN: its status page and our payments-worker-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set payments-worker-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/payments-worker-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the fulfilment secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 133. payments-cron-3

Owner: team data. Pager: #oncall-data. Runs 6 replicas in the prod cluster, memory limit 2Gi. Data store: Kafka topic. Main external dependency: the fraud-scoring model.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 800 ms.

Alerts:
- payments-cron-3-latency: p99 above 800 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- payments-cron-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- payments-cron-3-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the payments-cron-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback payments-cron-3` before you debug.
3. Check the fraud-scoring model: its status page and our payments-cron-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set payments-cron-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/payments-cron-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 134. payments-proxy-3

Owner: team storefront. Pager: #oncall-storefront. Runs 10 replicas in the prod cluster, memory limit 512Mi. Data store: S3-compatible Spaces bucket. Main external dependency: the internal auth service.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 400 ms.

Alerts:
- payments-proxy-3-latency: p99 above 400 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- payments-proxy-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- payments-proxy-3-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the payments-proxy-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback payments-proxy-3` before you debug.
3. Check the internal auth service: its status page and our payments-proxy-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set payments-proxy-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/payments-proxy-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the storefront secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 135. search-api-3

Owner: team payments-core. Pager: #oncall-payments-core. Runs 11 replicas in the prod cluster, memory limit 512Mi. Data store: Kafka topic. Main external dependency: the payments provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 500 ms.

Alerts:
- search-api-3-latency: p99 above 500 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- search-api-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- search-api-3-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the search-api-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback search-api-3` before you debug.
3. Check the payments provider: its status page and our search-api-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set search-api-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/search-api-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the payments-core secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 136. search-worker-3

Owner: team growth. Pager: #oncall-growth. Runs 11 replicas in the prod cluster, memory limit 4Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the internal auth service.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 600 ms.

Alerts:
- search-worker-3-latency: p99 above 600 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- search-worker-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- search-worker-3-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the search-worker-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback search-worker-3` before you debug.
3. Check the internal auth service: its status page and our search-worker-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set search-worker-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/search-worker-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 137. search-indexer-3

Owner: team storefront. Pager: #oncall-storefront. Runs 2 replicas in the prod cluster, memory limit 512Mi. Data store: S3-compatible Spaces bucket. Main external dependency: the email provider.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 900 ms.

Alerts:
- search-indexer-3-latency: p99 above 900 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- search-indexer-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- search-indexer-3-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the search-indexer-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback search-indexer-3` before you debug.
3. Check the email provider: its status page and our search-indexer-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set search-indexer-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/search-indexer-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the storefront secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 138. search-consumer-3

Owner: team storefront. Pager: #oncall-storefront. Runs 10 replicas in the prod cluster, memory limit 1Gi. Data store: Redis (cache only). Main external dependency: the tax API.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 800 ms.

Alerts:
- search-consumer-3-latency: p99 above 800 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- search-consumer-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- search-consumer-3-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the search-consumer-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback search-consumer-3` before you debug.
3. Check the tax API: its status page and our search-consumer-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set search-consumer-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/search-consumer-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the storefront secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 139. search-proxy-3

Owner: team identity. Pager: #oncall-identity. Runs 4 replicas in the prod cluster, memory limit 2Gi. Data store: Kafka topic. Main external dependency: the email provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 200 ms.

Alerts:
- search-proxy-3-latency: p99 above 200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- search-proxy-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- search-proxy-3-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the search-proxy-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback search-proxy-3` before you debug.
3. Check the email provider: its status page and our search-proxy-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set search-proxy-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/search-proxy-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 140. catalog-api-3

Owner: team fulfilment. Pager: #oncall-fulfilment. Runs 8 replicas in the prod cluster, memory limit 2Gi. Data store: Postgres (managed, 3 nodes). Main external dependency: the payments provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 600 ms.

Alerts:
- catalog-api-3-latency: p99 above 600 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- catalog-api-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- catalog-api-3-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the catalog-api-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback catalog-api-3` before you debug.
3. Check the payments provider: its status page and our catalog-api-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set catalog-api-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/catalog-api-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the fulfilment secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 141. catalog-worker-3

Owner: team payments-core. Pager: #oncall-payments-core. Runs 8 replicas in the prod cluster, memory limit 512Mi. Data store: Kafka topic. Main external dependency: the payments provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 900 ms.

Alerts:
- catalog-worker-3-latency: p99 above 900 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- catalog-worker-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- catalog-worker-3-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the catalog-worker-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback catalog-worker-3` before you debug.
3. Check the payments provider: its status page and our catalog-worker-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set catalog-worker-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/catalog-worker-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the payments-core secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 142. catalog-cron-3

Owner: team identity. Pager: #oncall-identity. Runs 7 replicas in the prod cluster, memory limit 1Gi. Data store: OpenSearch cluster. Main external dependency: the fraud-scoring model.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 1200 ms.

Alerts:
- catalog-cron-3-latency: p99 above 1200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- catalog-cron-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- catalog-cron-3-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the catalog-cron-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback catalog-cron-3` before you debug.
3. Check the fraud-scoring model: its status page and our catalog-cron-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set catalog-cron-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/catalog-cron-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 143. auth-api-3

Owner: team data. Pager: #oncall-data. Runs 11 replicas in the prod cluster, memory limit 512Mi. Data store: none. Main external dependency: the tax API.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 800 ms.

Alerts:
- auth-api-3-latency: p99 above 800 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- auth-api-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- auth-api-3-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the auth-api-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback auth-api-3` before you debug.
3. Check the tax API: its status page and our auth-api-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set auth-api-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/auth-api-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 144. auth-worker-3

Owner: team payments-core. Pager: #oncall-payments-core. Runs 6 replicas in the prod cluster, memory limit 4Gi. Data store: none. Main external dependency: the tax API.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 200 ms.

Alerts:
- auth-worker-3-latency: p99 above 200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- auth-worker-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- auth-worker-3-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the auth-worker-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback auth-worker-3` before you debug.
3. Check the tax API: its status page and our auth-worker-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set auth-worker-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/auth-worker-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the payments-core secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 145. auth-indexer-3

Owner: team growth. Pager: #oncall-growth. Runs 8 replicas in the prod cluster, memory limit 2Gi. Data store: OpenSearch cluster. Main external dependency: the fraud-scoring model.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- auth-indexer-3-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- auth-indexer-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- auth-indexer-3-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the auth-indexer-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback auth-indexer-3` before you debug.
3. Check the fraud-scoring model: its status page and our auth-indexer-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set auth-indexer-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/auth-indexer-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 146. auth-consumer-3

Owner: team identity. Pager: #oncall-identity. Runs 11 replicas in the prod cluster, memory limit 1Gi. Data store: Kafka topic. Main external dependency: the payments provider.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 700 ms.

Alerts:
- auth-consumer-3-latency: p99 above 700 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- auth-consumer-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- auth-consumer-3-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the auth-consumer-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback auth-consumer-3` before you debug.
3. Check the payments provider: its status page and our auth-consumer-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set auth-consumer-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/auth-consumer-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 147. auth-proxy-3

Owner: team platform. Pager: #oncall-platform. Runs 6 replicas in the prod cluster, memory limit 1Gi. Data store: Kafka topic. Main external dependency: the CDN.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- auth-proxy-3-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- auth-proxy-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- auth-proxy-3-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the auth-proxy-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback auth-proxy-3` before you debug.
3. Check the CDN: its status page and our auth-proxy-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set auth-proxy-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/auth-proxy-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the platform secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 148. inventory-worker-3

Owner: team growth. Pager: #oncall-growth. Runs 4 replicas in the prod cluster, memory limit 512Mi. Data store: OpenSearch cluster. Main external dependency: the email provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 900 ms.

Alerts:
- inventory-worker-3-latency: p99 above 900 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- inventory-worker-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- inventory-worker-3-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the inventory-worker-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback inventory-worker-3` before you debug.
3. Check the email provider: its status page and our inventory-worker-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set inventory-worker-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/inventory-worker-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 149. inventory-cron-3

Owner: team platform. Pager: #oncall-platform. Runs 10 replicas in the prod cluster, memory limit 512Mi. Data store: Kafka topic. Main external dependency: the payments provider.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 500 ms.

Alerts:
- inventory-cron-3-latency: p99 above 500 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- inventory-cron-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- inventory-cron-3-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the inventory-cron-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback inventory-cron-3` before you debug.
3. Check the payments provider: its status page and our inventory-cron-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set inventory-cron-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/inventory-cron-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the platform secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 150. inventory-consumer-3

Owner: team fulfilment. Pager: #oncall-fulfilment. Runs 5 replicas in the prod cluster, memory limit 512Mi. Data store: S3-compatible Spaces bucket. Main external dependency: the email provider.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 900 ms.

Alerts:
- inventory-consumer-3-latency: p99 above 900 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- inventory-consumer-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- inventory-consumer-3-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the inventory-consumer-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback inventory-consumer-3` before you debug.
3. Check the email provider: its status page and our inventory-consumer-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set inventory-consumer-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/inventory-consumer-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the fulfilment secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 151. inventory-proxy-3

Owner: team identity. Pager: #oncall-identity. Runs 8 replicas in the prod cluster, memory limit 4Gi. Data store: none. Main external dependency: the email provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 800 ms.

Alerts:
- inventory-proxy-3-latency: p99 above 800 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- inventory-proxy-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- inventory-proxy-3-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the inventory-proxy-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback inventory-proxy-3` before you debug.
3. Check the email provider: its status page and our inventory-proxy-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set inventory-proxy-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/inventory-proxy-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 152. notify-cron-3

Owner: team storefront. Pager: #oncall-storefront. Runs 4 replicas in the prod cluster, memory limit 512Mi. Data store: none. Main external dependency: the payments provider.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1100 ms.

Alerts:
- notify-cron-3-latency: p99 above 1100 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- notify-cron-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- notify-cron-3-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the notify-cron-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback notify-cron-3` before you debug.
3. Check the payments provider: its status page and our notify-cron-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set notify-cron-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/notify-cron-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the storefront secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 153. pricing-api-3

Owner: team payments-core. Pager: #oncall-payments-core. Runs 6 replicas in the prod cluster, memory limit 4Gi. Data store: Kafka topic. Main external dependency: the email provider.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- pricing-api-3-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- pricing-api-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- pricing-api-3-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the pricing-api-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback pricing-api-3` before you debug.
3. Check the email provider: its status page and our pricing-api-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set pricing-api-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/pricing-api-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the payments-core secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 154. pricing-worker-3

Owner: team identity. Pager: #oncall-identity. Runs 11 replicas in the prod cluster, memory limit 512Mi. Data store: Postgres (managed, 3 nodes). Main external dependency: the email provider.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 200 ms.

Alerts:
- pricing-worker-3-latency: p99 above 200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- pricing-worker-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- pricing-worker-3-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the pricing-worker-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback pricing-worker-3` before you debug.
3. Check the email provider: its status page and our pricing-worker-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set pricing-worker-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/pricing-worker-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 155. pricing-indexer-3

Owner: team data. Pager: #oncall-data. Runs 7 replicas in the prod cluster, memory limit 512Mi. Data store: S3-compatible Spaces bucket. Main external dependency: the email provider.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 400 ms.

Alerts:
- pricing-indexer-3-latency: p99 above 400 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- pricing-indexer-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- pricing-indexer-3-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the pricing-indexer-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback pricing-indexer-3` before you debug.
3. Check the email provider: its status page and our pricing-indexer-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set pricing-indexer-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/pricing-indexer-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 156. pricing-cron-3

Owner: team growth. Pager: #oncall-growth. Runs 7 replicas in the prod cluster, memory limit 2Gi. Data store: OpenSearch cluster. Main external dependency: the CDN.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 800 ms.

Alerts:
- pricing-cron-3-latency: p99 above 800 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- pricing-cron-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- pricing-cron-3-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the pricing-cron-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback pricing-cron-3` before you debug.
3. Check the CDN: its status page and our pricing-cron-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set pricing-cron-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/pricing-cron-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 157. pricing-consumer-3

Owner: team data. Pager: #oncall-data. Runs 9 replicas in the prod cluster, memory limit 4Gi. Data store: none. Main external dependency: the payments provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 400 ms.

Alerts:
- pricing-consumer-3-latency: p99 above 400 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- pricing-consumer-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- pricing-consumer-3-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the pricing-consumer-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback pricing-consumer-3` before you debug.
3. Check the payments provider: its status page and our pricing-consumer-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set pricing-consumer-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/pricing-consumer-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 158. ledger-worker-3

Owner: team platform. Pager: #oncall-platform. Runs 11 replicas in the prod cluster, memory limit 512Mi. Data store: OpenSearch cluster. Main external dependency: the tax API.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- ledger-worker-3-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- ledger-worker-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- ledger-worker-3-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the ledger-worker-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback ledger-worker-3` before you debug.
3. Check the tax API: its status page and our ledger-worker-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set ledger-worker-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/ledger-worker-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the platform secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 159. ledger-indexer-3

Owner: team platform. Pager: #oncall-platform. Runs 3 replicas in the prod cluster, memory limit 2Gi. Data store: Kafka topic. Main external dependency: the internal auth service.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 700 ms.

Alerts:
- ledger-indexer-3-latency: p99 above 700 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- ledger-indexer-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- ledger-indexer-3-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the ledger-indexer-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback ledger-indexer-3` before you debug.
3. Check the internal auth service: its status page and our ledger-indexer-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set ledger-indexer-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/ledger-indexer-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the platform secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 160. ledger-proxy-3

Owner: team growth. Pager: #oncall-growth. Runs 5 replicas in the prod cluster, memory limit 2Gi. Data store: Kafka topic. Main external dependency: the internal auth service.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 500 ms.

Alerts:
- ledger-proxy-3-latency: p99 above 500 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- ledger-proxy-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- ledger-proxy-3-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the ledger-proxy-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback ledger-proxy-3` before you debug.
3. Check the internal auth service: its status page and our ledger-proxy-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set ledger-proxy-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/ledger-proxy-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 161. media-api-3

Owner: team fulfilment. Pager: #oncall-fulfilment. Runs 2 replicas in the prod cluster, memory limit 512Mi. Data store: Postgres (managed, 3 nodes). Main external dependency: the CDN.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- media-api-3-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- media-api-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- media-api-3-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the media-api-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback media-api-3` before you debug.
3. Check the CDN: its status page and our media-api-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set media-api-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/media-api-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the fulfilment secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 162. media-worker-3

Owner: team platform. Pager: #oncall-platform. Runs 3 replicas in the prod cluster, memory limit 4Gi. Data store: OpenSearch cluster. Main external dependency: the tax API.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- media-worker-3-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- media-worker-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- media-worker-3-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the media-worker-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback media-worker-3` before you debug.
3. Check the tax API: its status page and our media-worker-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set media-worker-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/media-worker-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the platform secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 163. media-indexer-3

Owner: team data. Pager: #oncall-data. Runs 8 replicas in the prod cluster, memory limit 512Mi. Data store: Redis (cache only). Main external dependency: the CDN.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 300 ms.

Alerts:
- media-indexer-3-latency: p99 above 300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- media-indexer-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- media-indexer-3-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the media-indexer-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback media-indexer-3` before you debug.
3. Check the CDN: its status page and our media-indexer-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set media-indexer-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/media-indexer-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 164. media-cron-3

Owner: team growth. Pager: #oncall-growth. Runs 11 replicas in the prod cluster, memory limit 512Mi. Data store: Postgres (managed, 3 nodes). Main external dependency: the fraud-scoring model.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 500 ms.

Alerts:
- media-cron-3-latency: p99 above 500 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- media-cron-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- media-cron-3-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the media-cron-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback media-cron-3` before you debug.
3. Check the fraud-scoring model: its status page and our media-cron-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set media-cron-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/media-cron-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 165. media-proxy-3

Owner: team payments-core. Pager: #oncall-payments-core. Runs 2 replicas in the prod cluster, memory limit 512Mi. Data store: Redis (cache only). Main external dependency: the payments provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 400 ms.

Alerts:
- media-proxy-3-latency: p99 above 400 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- media-proxy-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- media-proxy-3-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the media-proxy-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback media-proxy-3` before you debug.
3. Check the payments provider: its status page and our media-proxy-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set media-proxy-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/media-proxy-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the payments-core secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 166. reviews-api-3

Owner: team platform. Pager: #oncall-platform. Runs 7 replicas in the prod cluster, memory limit 1Gi. Data store: Postgres (managed, 3 nodes). Main external dependency: the payments provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 300 ms.

Alerts:
- reviews-api-3-latency: p99 above 300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- reviews-api-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- reviews-api-3-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the reviews-api-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback reviews-api-3` before you debug.
3. Check the payments provider: its status page and our reviews-api-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set reviews-api-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/reviews-api-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the platform secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 167. reviews-worker-3

Owner: team fulfilment. Pager: #oncall-fulfilment. Runs 11 replicas in the prod cluster, memory limit 4Gi. Data store: none. Main external dependency: the CDN.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 700 ms.

Alerts:
- reviews-worker-3-latency: p99 above 700 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- reviews-worker-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- reviews-worker-3-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the reviews-worker-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback reviews-worker-3` before you debug.
3. Check the CDN: its status page and our reviews-worker-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set reviews-worker-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/reviews-worker-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the fulfilment secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 168. reviews-indexer-3

Owner: team growth. Pager: #oncall-growth. Runs 10 replicas in the prod cluster, memory limit 4Gi. Data store: Kafka topic. Main external dependency: the email provider.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1000 ms.

Alerts:
- reviews-indexer-3-latency: p99 above 1000 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- reviews-indexer-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- reviews-indexer-3-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the reviews-indexer-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback reviews-indexer-3` before you debug.
3. Check the email provider: its status page and our reviews-indexer-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set reviews-indexer-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/reviews-indexer-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the growth secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 169. reviews-cron-3

Owner: team data. Pager: #oncall-data. Runs 8 replicas in the prod cluster, memory limit 1Gi. Data store: OpenSearch cluster. Main external dependency: the email provider.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 900 ms.

Alerts:
- reviews-cron-3-latency: p99 above 900 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- reviews-cron-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- reviews-cron-3-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the reviews-cron-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback reviews-cron-3` before you debug.
3. Check the email provider: its status page and our reviews-cron-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set reviews-cron-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/reviews-cron-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 170. reviews-proxy-3

Owner: team identity. Pager: #oncall-identity. Runs 2 replicas in the prod cluster, memory limit 1Gi. Data store: OpenSearch cluster. Main external dependency: the fraud-scoring model.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 800 ms.

Alerts:
- reviews-proxy-3-latency: p99 above 800 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- reviews-proxy-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- reviews-proxy-3-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the reviews-proxy-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback reviews-proxy-3` before you debug.
3. Check the fraud-scoring model: its status page and our reviews-proxy-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set reviews-proxy-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/reviews-proxy-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 171. gateway-worker-3

Owner: team platform. Pager: #oncall-platform. Runs 2 replicas in the prod cluster, memory limit 2Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the email provider.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- gateway-worker-3-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- gateway-worker-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- gateway-worker-3-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the gateway-worker-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback gateway-worker-3` before you debug.
3. Check the email provider: its status page and our gateway-worker-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set gateway-worker-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/gateway-worker-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the platform secondary and open an incident channel.

Known issues: a slow consumer on the shared Kafka topic delays this service; check consumer lag first.
## 172. gateway-indexer-3

Owner: team storefront. Pager: #oncall-storefront. Runs 9 replicas in the prod cluster, memory limit 1Gi. Data store: Kafka topic. Main external dependency: the internal auth service.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 700 ms.

Alerts:
- gateway-indexer-3-latency: p99 above 700 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- gateway-indexer-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- gateway-indexer-3-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the gateway-indexer-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback gateway-indexer-3` before you debug.
3. Check the internal auth service: its status page and our gateway-indexer-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set gateway-indexer-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/gateway-indexer-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the storefront secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 173. session-worker-3

Owner: team identity. Pager: #oncall-identity. Runs 6 replicas in the prod cluster, memory limit 512Mi. Data store: S3-compatible Spaces bucket. Main external dependency: the tax API.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- session-worker-3-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- session-worker-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- session-worker-3-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the session-worker-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback session-worker-3` before you debug.
3. Check the tax API: its status page and our session-worker-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set session-worker-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/session-worker-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 174. session-proxy-3

Owner: team data. Pager: #oncall-data. Runs 6 replicas in the prod cluster, memory limit 2Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the email provider.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- session-proxy-3-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- session-proxy-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- session-proxy-3-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the session-proxy-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback session-proxy-3` before you debug.
3. Check the email provider: its status page and our session-proxy-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set session-proxy-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/session-proxy-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 175. billing-worker-3

Owner: team identity. Pager: #oncall-identity. Runs 4 replicas in the prod cluster, memory limit 512Mi. Data store: Kafka topic. Main external dependency: the payments provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 600 ms.

Alerts:
- billing-worker-3-latency: p99 above 600 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- billing-worker-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- billing-worker-3-saturation: CPU above 85% or memory above 90% of 512Mi for 15 minutes. Severity: ticket.

First steps:
1. Open the billing-worker-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback billing-worker-3` before you debug.
3. Check the payments provider: its status page and our billing-worker-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set billing-worker-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/billing-worker-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the identity secondary and open an incident channel.

Known issues: TLS certificates for the internal endpoint renew at 03:00 UTC and can cause a short burst of 5xx.
## 176. billing-consumer-3

Owner: team storefront. Pager: #oncall-storefront. Runs 8 replicas in the prod cluster, memory limit 1Gi. Data store: OpenSearch cluster. Main external dependency: the payments provider.

SLO: 99.95% of requests succeed over 28 days, p99 latency under 1200 ms.

Alerts:
- billing-consumer-3-latency: p99 above 1200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- billing-consumer-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- billing-consumer-3-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the billing-consumer-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback billing-consumer-3` before you debug.
3. Check the payments provider: its status page and our billing-consumer-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set billing-consumer-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/billing-consumer-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the storefront secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
## 177. export-api-3

Owner: team storefront. Pager: #oncall-storefront. Runs 5 replicas in the prod cluster, memory limit 4Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the fraud-scoring model.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 500 ms.

Alerts:
- export-api-3-latency: p99 above 500 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- export-api-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- export-api-3-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the export-api-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback export-api-3` before you debug.
3. Check the fraud-scoring model: its status page and our export-api-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set export-api-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/export-api-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the storefront secondary and open an incident channel.

Known issues: connection pool exhaustion after the nightly batch; raise the pool only after checking for leaked transactions.
## 178. export-proxy-3

Owner: team data. Pager: #oncall-data. Runs 5 replicas in the prod cluster, memory limit 1Gi. Data store: none. Main external dependency: the internal auth service.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 200 ms.

Alerts:
- export-proxy-3-latency: p99 above 200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- export-proxy-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- export-proxy-3-saturation: CPU above 85% or memory above 90% of 1Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the export-proxy-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback export-proxy-3` before you debug.
3. Check the internal auth service: its status page and our export-proxy-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set export-proxy-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/export-proxy-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the data secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 179. webhooks-api-3

Owner: team platform. Pager: #oncall-platform. Runs 5 replicas in the prod cluster, memory limit 2Gi. Data store: Postgres (managed, 3 nodes). Main external dependency: the fraud-scoring model.

SLO: 99.9% of requests succeed over 28 days, p99 latency under 200 ms.

Alerts:
- webhooks-api-3-latency: p99 above 200 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- webhooks-api-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- webhooks-api-3-saturation: CPU above 85% or memory above 90% of 2Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the webhooks-api-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback webhooks-api-3` before you debug.
3. Check the fraud-scoring model: its status page and our webhooks-api-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set webhooks-api-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/webhooks-api-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the platform secondary and open an incident channel.

Known issues: cold caches after a deploy make p99 spike for about 5 minutes; do not page for it.
## 180. webhooks-worker-3

Owner: team payments-core. Pager: #oncall-payments-core. Runs 5 replicas in the prod cluster, memory limit 4Gi. Data store: S3-compatible Spaces bucket. Main external dependency: the payments provider.

SLO: 99.5% of requests succeed over 28 days, p99 latency under 1300 ms.

Alerts:
- webhooks-worker-3-latency: p99 above 1300 ms for 10 minutes. Severity: page during business hours, ticket at night unless checkout is affected.
- webhooks-worker-3-errors: 5xx above 2% for 5 minutes. Severity: page.
- webhooks-worker-3-saturation: CPU above 85% or memory above 90% of 4Gi for 15 minutes. Severity: ticket.

First steps:
1. Open the webhooks-worker-3 dashboard and compare the last hour with the same hour yesterday.
2. Check the deploy log: if a deploy went out in the last 30 minutes, roll it back with `deployctl rollback webhooks-worker-3` before you debug.
3. Check the payments provider: its status page and our webhooks-worker-3-dependency panel. If it is failing, switch to the degraded mode with `featurectl set webhooks-worker-3.degraded true`.
4. If memory is above 90%, restart one replica at a time with `kubectl rollout restart deploy/webhooks-worker-3 -n prod` and watch for OOMKilled events.
5. If the cause is still unknown after 20 minutes, escalate to the payments-core secondary and open an incident channel.

Known issues: the health check hits the database, so a database failover marks every replica unhealthy at once.
