# Local setup

[← Project overview](../README.md)

## Prerequisites

- Node.js 22.12 or newer and npm. The locked Vite version requires Node 20.19+ or 22.12+; this guide uses the latter.
- Git.
- Docker Desktop with its engine running, or PostgreSQL with PostGIS and a Redis service you can reach.
- A Google Maps Platform project and browser API key.

## Google Maps

Enable billing and the Maps JavaScript API in your Google Cloud project. The app loads the Places library and uses `PlacesService.nearbySearch` for landmark labels, so enable the compatible Places API for your project as well. Existing legacy Places access and newer projects may differ; use the browser console to identify authorization errors. See [Google’s setup guide](https://developers.google.com/maps/get-started) and [Maps troubleshooting](https://developers.google.com/maps/documentation/javascript/troubleshooting).

Create a browser key with HTTP referrer restrictions for `http://localhost:5173/*`, your production domain, and any HTTPS test-tunnel domain. Restrict API access to the services the app uses. Put the key in `client/.env` as `VITE_GOOGLE_MAPS_API_KEY`. Browser keys are visible in the frontend bundle; server secrets must never use a `VITE_` prefix.

## Environment files

Copy the templates as shown in the [README](../README.md#1-clone-and-configure), then edit the copies. Do not overwrite an existing `.env` containing your own settings.

Generate a JWT secret:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Paste the output into `JWT_SECRET` in `server/.env`.

### Client variables

| Variable | Local value | Meaning |
| --- | --- | --- |
| `VITE_GOOGLE_MAPS_API_KEY` | Your browser key | Maps loader and Places library |
| `VITE_API_URL` | Empty | Uses the current origin; Vite proxies API and sockets locally |
| `NGROK_HOST` | Empty normally | Allowed Vite hostname for a tunnel; no scheme or path |

`VITE_API_URL` is a backend origin, for example `https://api.example.com`, not a URL ending in `/api`. Both Axios and Socket.IO use it. Vite embeds `VITE_` values at build time: rebuild after production changes.

### Server variables

| Variable | Local value | Meaning |
| --- | --- | --- |
| `DATABASE_URL` | See `server/.env.example` | PostgreSQL connection string |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection; use the provider’s TLS URL when required |
| `JWT_SECRET` | Random generated value | Signs and verifies authentication tokens |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Exact frontend origin for HTTP and socket CORS |
| `PORT` | `4000` | Backend port; Vite’s local proxy targets port 4000 |

Run server commands from `server/`, where dotenv expects `.env`. A deployment’s environment variables do not update your local file.

## Database and Redis with Docker

From the root:

```sh
docker compose up -d --wait
docker compose ps
docker compose exec redis redis-cli ping
docker compose exec postgres psql -U marauders -d marauders_map -c "SELECT postgis_version();"
```

Redis should respond `PONG`. PostgreSQL should report a PostGIS version. The PostGIS image initializes the extension; `server/db/schema.sql` runs automatically only when the database volume is first created. Check initialization with `docker compose logs postgres` if startup fails.

The provided schema is the base schema, not a complete fix for the location-handler inconsistencies. Read [current limitations](troubleshooting.md#current-location-sharing-limitations) before testing live sharing. Do not apply `locations-latlng.sql` as a routine migration: it drops existing locations and removes the geometry column that snapshots still use.

Stop dependencies with `docker compose stop`, resume with `docker compose up -d`, or remove containers with `docker compose down`. The named PostgreSQL volume preserves data. `docker compose down -v` deletes that database volume; use it only when intentionally discarding local data.

## Without Docker

Create a dedicated PostgreSQL database with PostGIS installed. From the repository root, using your actual connection URL:

```sh
psql "postgresql://USER:PASSWORD@HOST:5432/DATABASE" -v ON_ERROR_STOP=1 -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql "postgresql://USER:PASSWORD@HOST:5432/DATABASE" -v ON_ERROR_STOP=1 -f server/db/schema.sql
```

Run the schema once on an empty database; it is not an idempotent migration. Extension creation may require an administrator or your database provider’s dashboard. Set `DATABASE_URL` and `REDIS_URL` to reachable services, following provider requirements for TLS and URL-encoded credentials.

## Start the applications

Install each package with `npm ci`, then run `npm run dev` from `server/` and `client/` in separate terminals. Open http://localhost:5173. The backend waits for Redis connections before listening.

To verify the API independently, open http://localhost:4000; it should return the API-running message. This route is a basic response check, not a database health check.

## Test on your phone with HTTPS

Geolocation needs a secure context. Localhost works on your computer; an ordinary HTTP LAN address on your phone usually does not. Use the live site or an HTTPS tunnel.

1. Install ngrok and authenticate it using [ngrok’s instructions](https://ngrok.com/docs/getting-started/).
2. Start one frontend tunnel: `ngrok http 5173`.
3. Copy the exact forwarding hostname into `NGROK_HOST` in `client/.env`, without `https://` or a path.
4. Set `CLIENT_ORIGIN` in `server/.env` to the full HTTPS origin. Leave `VITE_API_URL` empty.
5. Add the tunnel’s HTTP referrer to the Maps key restrictions, then restart both apps.
6. Keep the frontend, backend, and tunnel running. Open the HTTPS forwarding URL on each device.

Vite forwards both API and WebSocket traffic, so no separate port-4000 tunnel is needed. Update settings when the tunnel hostname changes.
