# Deployment

[← Project overview](../README.md)

The public frontend is [marauders-map-sigma.vercel.app](https://marauders-map-sigma.vercel.app/). The backend host and database provider are not specified in this repository; the steps below describe the app’s requirements rather than assuming a particular provider.

## Frontend

Configure your host to use `client/` as the project root, install with `npm ci`, build with `npm run build`, and publish `dist/`. On Vercel, select the Vite preset.

Set `VITE_GOOGLE_MAPS_API_KEY` and, if the backend is on a separate domain, `VITE_API_URL=https://YOUR_BACKEND_HOST`. Redeploy after changing either value. Add the deployed frontend domain to the browser key’s allowed HTTP referrers.

Leaving `VITE_API_URL` empty uses the frontend origin for API requests and Socket.IO. That works in production only if your host or reverse proxy routes both `/api` and `/socket.io` to the backend, including WebSocket upgrades. The proxy in `vite.config.js` applies to development only.

## Backend

Use `server/` as the service root, install with `npm ci`, and start with `npm start`. Run a persistent Node service on a platform that supports Socket.IO and WebSockets. The server listens on `PORT`, defaulting to 4000.

Set all server variables from [`server/.env.example`](../server/.env.example) in the hosting dashboard, using production values:

- `DATABASE_URL`: a PostgreSQL database with PostGIS and the appropriate application schema.
- `REDIS_URL`: a reachable Redis endpoint; use `rediss://` when your provider requires TLS.
- `JWT_SECRET`: a private random value shared by backend instances.
- `CLIENT_ORIGIN`: the exact frontend origin, such as `https://marauders-map-sigma.vercel.app`, without a trailing slash. The current code accepts one configured origin, not a comma-separated list.
- `PORT`: use the port assigned by your platform.

Never put database credentials, Redis credentials, or JWT secrets in frontend variables.

## Database changes

The application does not automatically run migrations. Initialize PostGIS and the base schema using the [setup guide](setup.md#without-docker) for an empty database. Review [the current location-schema limitations](troubleshooting.md#current-location-sharing-limitations) before relying on sharing.

`locations-latlng.sql` is a destructive alternate table definition, not a safe upgrade script. Back up existing data and reconcile runtime readers and writers before any schema change.

## Verify a deployment

1. Confirm the backend root URL responds with the API-running message.
2. Open the frontend and check for Maps errors in the browser console.
3. Create an account and sign in; confirm the map reports a connected socket.
4. Allow location access. Test sharing with two separate accounts on two devices.
5. Stop sharing and check that the other device removes the marker.
6. Refresh or reconnect and check that visible users return.

The Redis adapter carries events across backend instances. If scaling with Socket.IO’s default polling transport, also configure sticky sessions at the load balancer. See [Socket.IO’s multi-node guide](https://socket.io/docs/v4/using-multiple-nodes/).
