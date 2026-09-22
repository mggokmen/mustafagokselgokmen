# Observability Standards

Start small and useful: structured logs and health checks now, metrics and tracing once there is
something to watch.

| Capability | Now (MVP) | Later |
|---|---|---|
| Logging | Structured JSON logs (ECS) in containers | Central log storage |
| Health | Actuator health, liveness and readiness | — |
| Metrics | Micrometer (included with Actuator), not exposed | Prometheus endpoint and Grafana dashboards |
| Tracing | — | OpenTelemetry |

## Logging

- **Format:** containers log JSON in the Elastic Common Schema. The Dockerfile sets
  `LOGGING_STRUCTURED_FORMAT_CONSOLE=ecs` to turn this on. Local runs keep human-readable text.
- **Output:** logs go to stdout only, and the platform collects them. Containers write no log files.
- **Levels:**

| Level | Use for |
|---|---|
| `ERROR` | An unexpected failure that needs attention |
| `WARN` | Something unusual that was handled |
| `INFO` | A significant business event, such as a user being created or a message changing status |
| `DEBUG` | Diagnostics. Turned off in production. |

- **Traceability:** every request's log lines carry a request ID. Authenticated requests also carry
  the user ID. Both are added to the logging context (MDC) as part of the authentication feature.
- **What must never be logged:** see [security.md](security.md#logging).

## Health checks

| Endpoint | Purpose |
|---|---|
| `GET /actuator/health` | Overall status, including the database. Public, without details. Used by the Docker `HEALTHCHECK` and by Compose. |
| `GET /actuator/health/liveness` | For orchestrators that restart unhealthy instances |
| `GET /actuator/health/readiness` | For orchestrators that route traffic only to ready instances |

Only `health` is exposed over HTTP. Every other Actuator endpoint stays off the public port.

## Metrics (next step)

Micrometer is already present through Actuator. When a monitoring stack is set up:
- Expose `/actuator/prometheus` on a separate, non-public management port.
- Add dashboards for request rate, error rate, latency and the database connection pool.

## Tracing (later)

Add OpenTelemetry through the Micrometer Tracing bridge, with trace IDs in log lines. This becomes
useful once requests travel across more than one service.
