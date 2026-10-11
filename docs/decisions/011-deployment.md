# ADR-011: Where and how 0.2.0 is deployed

- Status: Accepted
- Date: 2026-10-10

## Context

`v0.2.0` publishes three images to GHCR, and nothing runs anywhere. `mustafagokselgokmen.com.tr`
points at a server through Cloudflare and currently serves a placeholder page.

The server is a VPS that already earns its keep: seven live sites, PostgreSQL and Redis, up for 178
days. What it has, measured rather than assumed:

| Resource | Measured |
|---|---|
| CPU / RAM | 2 cores, 3.7 GB total, **2.1 GB available** |
| Disk | 38 GB, 20 GB free |
| Load average | 0.29 |
| PostgreSQL | **16.15**, serving the existing sites |
| Docker | not installed |
| `ufw` | inactive; `iptables` INPUT policy is ACCEPT |
| Port 3000 | taken by another application |

What the full stack would need: two JVMs (~700 MB), Next.js (~150 MB), Kafka (~400 MB with a
restricted heap, ~1 GB with its defaults) and a database. That does not fit beside seven live sites
in 2.1 GB, and an out-of-memory kill would take someone else's site down, not ours.

## Decision

### The same server, as a second tenant behind its nginx

The applications run in Docker on this VPS, reached through the nginx that already serves the other
sites. The vhost for this domain becomes a reverse proxy; nothing about the other seven changes.

Docker is installed. It normally conflicts with `ufw` by writing its own `iptables` chains, but
`ufw` is inactive here and the INPUT policy already accepts, so there is nothing for it to
subvert — this was checked before deciding, not after.

### Kafka and the notification service stay out of production, for now

The API runs with `OUTBOX_TARGET=log`. Events are still recorded in the same transaction as the
change that produced them, exactly as [ADR-008](008-transactional-outbox.md) requires; they are
written to the log instead of a broker, which is the mode that ADR already describes for
environments without one.

This is a resource decision, not a change of mind. The outbox is what makes it reversible: when
there is a broker to publish to, the publisher drains the table and nothing was lost in the
meantime. Until then, **the notification service does not run in production**, and the dead-letter
and idempotency machinery it carries is exercised only by its tests and the local stack.

### Its own PostgreSQL 18, in a container

The server runs PostgreSQL 16. The project's standard is 18 everywhere, including tests
([database.md](../database.md#engine)), and the reason is not pedantry: the schema and queries are
tested against 18, so shipping onto 16 would deploy something other than what was tested.

A `postgres:18` container costs about 150 MB and keeps that promise, so the applications get their
own instance rather than sharing the server's. The existing PostgreSQL continues to serve the sites
that already use it, untouched.

### Ports, configuration and secrets

- The applications listen only on loopback; nginx is the only way in. Port 3000 is taken, so the
  web app uses another port on the host side.
- Configuration comes from an `.env` file on the server, readable by root only. Nothing is baked
  into an image, and the images are exactly the ones CI built and scanned.
- Cloudflare moves to **Full (strict)**: the origin now has a trusted Let's Encrypt certificate, so
  there is no reason to let Cloudflare skip verifying it.

### Deployment is a command, not a pipeline

`docker compose pull && docker compose up -d` against a compose file kept on the server, in the
repository under `deploy/`. There is no automated deployment from CI yet.

Automating it means giving a workflow a key to this machine, and this machine hosts seven sites
that have nothing to do with this project. That trade deserves its own decision, with its own ADR,
once deploying by hand has proven boring.

## Alternatives considered

- **The full stack with a restricted Kafka heap.** It might fit. "Might fit" on a box with seven
  live sites is a wager whose downside is somebody else's outage.
- **A second, larger server.** The honest answer for running everything, and the right move when
  the notification path needs to be live. It costs money for a portfolio that nobody is paged for
  yet.
- **Managed Kafka.** Removes the memory problem and adds a bill and an external dependency, for a
  single consumer that logs a line.
- **Sharing the server's PostgreSQL 16.** Saves 150 MB and gives up the guarantee that production
  runs the database the tests ran against.
- **Running the jars with systemd instead of Docker.** Would drop the images that CI builds and
  scans, and with them the thing that makes a release reproducible.

## Consequences

- Production runs **two of the three images**. The web app and API are live; the notification
  service is not, and the release notes say so.
- Events accumulate in `outbox_events` without being published. The table grows slowly — one row
  per message sent — and nothing prunes it. That is acceptable at this volume and becomes a real
  task before a broker appears.
- There is no staging environment. Changes go from a green pull request to this server.
- Deployment is manual, so the published images and what is running can drift apart. Checking the
  running version against the tag is part of deploying.
- The project's own claim that *every deployable ships as an image* still holds. What is new is
  that not every image is deployed.
