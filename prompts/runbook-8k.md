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
