# Troubleshooting

[← Project overview](../README.md)

| Symptom | Check |
| --- | --- |
| Redis `ECONNREFUSED` at localhost:6379 | Start Redis with `docker compose up -d redis`. A deployment fix does not change local `.env`. |
| Docker engine stopped or unavailable | Open Docker Desktop and use Troubleshoot → Restart Docker Desktop. Check `docker info` in your terminal. [Docker troubleshooting](https://docs.docker.com/desktop/troubleshoot-and-support/troubleshoot/) |
| Database connection refused | Start PostgreSQL; verify `DATABASE_URL`, port, and credentials. |
| `type geography does not exist` | Enable PostGIS in the database before applying the schema. |
| `relation users does not exist` | Apply the base schema once to the database named in `DATABASE_URL`. |
| Map blank or marked for development | Check key, billing, enabled APIs, and HTTP referrer restrictions in the browser console. [Google troubleshooting](https://developers.google.com/maps/documentation/javascript/troubleshooting) |
| No landmarks | Check Places API access and errors from `PlacesService`; legacy API access may differ on new projects. |
| API requests hit the frontend in production | Set `VITE_API_URL` to the backend origin and rebuild, or configure production API and socket routing. |
| Socket stays disconnected | Check backend logs, exact `CLIENT_ORIGIN`, Redis availability, and WebSocket routing. |
| Phone cannot get location | Open the HTTPS deployment or an HTTPS tunnel and allow browser/OS location access. |
| Only your footsteps appear | Sharing is off by default; enable it on each account you want visible. Use different accounts on the two devices. |
| Session expired or unauthorized | Refresh and sign in again. Authentication lives in React state; refresh returns to the sign-in flow. |
| Port already in use | Stop the conflicting local service or change the Compose port and matching connection URL. Vite’s API proxy assumes backend port 4000. |
| Vite rejects an ngrok hostname | Set `NGROK_HOST` to the exact hostname without scheme or path, then restart Vite. |

## Current location-sharing limitations

The checked-in backend and SQL are not fully consistent:

1. `server/db/schema.sql` defines `locations.geom`, but the location handler writes `lat` and `lng`. With the base schema, writes fail because those columns do not exist.
2. `server/db/locations-latlng.sql` creates `lat` and `lng` but removes `geom`; snapshots still call `ST_Y` and `ST_X` on `geom`, so applying that file does not resolve the full mismatch. It also drops existing location rows.
3. The location insert uses `socket.userId` even though authentication stores the user ID in `socket.data.userId`. This can cause a null-user constraint failure after the column mismatch is resolved.
4. The handler writes before checking sharing permissions, while the integration test expects private updates never to be saved. This behavior also needs reconciliation.

These are existing runtime issues, not configuration mistakes. A complete fix must align the schema, insert, snapshot reader, authenticated user ID, and permission checks together. The documentation update intentionally does not change application behavior. The deployed schema/revision may differ from this checkout.

## Useful diagnostics

From the repository root:

```sh
docker compose ps
docker compose logs --tail 50 postgres redis
docker compose exec redis redis-cli ping
docker compose exec postgres psql -U marauders -d marauders_map -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'locations';"
```

Inspect the browser console, Network tab, and backend terminal together. When reporting a problem, include the command, error, operating system, Node version, and whether it occurs locally or on the deployment. Redact credentials, JWTs, and private coordinates.
