/**
 * Liveness for the container's health check. It says that this process is serving, nothing more: no
 * backend call, no database, no configuration read, so a backend outage doesn't get the web app
 * restarted (docs/observability.md).
 */
export function GET(): Response {
  return Response.json({ status: "UP" });
}
