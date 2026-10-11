# Deployment

What runs in production, and how it gets there. The reasoning is in
[ADR-011](../docs/decisions/011-deployment.md).

## What runs

| Service | Image | Reached at |
|---|---|---|
| web | `ghcr.io/mggokmen/mustafagokselgokmen-web` | `127.0.0.1:13000`, proxied by nginx |
| api | `ghcr.io/mggokmen/mustafagokselgokmen-api` | `127.0.0.1:18080`, proxied by nginx under `/api/` |
| postgres | `postgres:18` | compose network only |

**Not deployed:** Kafka and the notification service. The server has other tenants and not enough
memory; the API runs with `OUTBOX_TARGET=log`, which records events in the same transaction as the
change and writes them to the log instead of publishing them
([ADR-008](../docs/decisions/008-transactional-outbox.md)).

Nothing listens on a public port. The applications bind to loopback, and the nginx that already
serves the other sites on this machine is the only way in.

## First time

```bash
# On the server, as root:
mkdir -p /srv/mustafagokselgokmen && cd /srv/mustafagokselgokmen
# copy compose.prod.yml and .env.example here, then:
cp .env.example .env && chmod 600 .env   # fill it in
docker compose -f compose.prod.yml --env-file .env pull
docker compose -f compose.prod.yml --env-file .env up -d
```

The API applies its own Flyway migrations on start; there is no separate migration step.

## Deploying a new release

```bash
cd /srv/mustafagokselgokmen
sed -i 's/^APP_VERSION=.*/APP_VERSION=X.Y.Z/' .env
docker compose -f compose.prod.yml --env-file .env pull
docker compose -f compose.prod.yml --env-file .env up -d
docker compose -f compose.prod.yml --env-file .env ps
```

Then check that what is running is what was intended:

```bash
curl -s localhost:18080/actuator/health
curl -s localhost:13000/healthz
```

Deployment is manual on purpose. Automating it means giving a workflow a key to a machine that
hosts seven unrelated sites, which deserves its own decision ([ADR-011](../docs/decisions/011-deployment.md)).

## Rolling back

Set `APP_VERSION` to the previous tag and run the same two commands. Images are immutable and
remain in the registry, so a rollback is a pull, not a rebuild.

A migration that has already run is not undone by a rollback. Flyway is forward-only
([ADR-004](../docs/decisions/004-database-migration.md)), so a release that changes the schema can
only be rolled back if the previous version still understands it.

## nginx

The vhost lives on the server, not here: it belongs to that machine's configuration, which hosts
other sites. It terminates TLS with a Let's Encrypt certificate, proxies `/` to the web app and
`/api/` to the API, and serves the ACME challenge path from disk. Cloudflare sits in front in
**Full (strict)** mode.

**It must not add security headers.** The application sends its own
([ADR-012](../docs/decisions/012-security-headers.md)), and a browser enforces every policy it
receives, so a second `Content-Security-Policy` from the proxy is intersected with the first and
the strictest one silently wins. That is not theoretical: this vhost kept the policy written for
the static placeholder it used to serve, and production shipped correct HTML with every stylesheet
and script blocked.
