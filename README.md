# The Marauder's Map
<<<<<<< HEAD
A real-time, multi-user location-sharing web app styled after the Marauder's Map from Harry Potter.
=======
A real-time, multi-user location-sharing web app styled after the Marauder's Map from Harry Potter.

## HTTPS development with ngrok

Use one tunnel to the frontend. Vite forwards `/api` and `/socket.io` to the
backend on port 4000, including WebSocket connections.

In `client/.env`, leave `VITE_API_URL=` empty and set
`NGROK_HOST=your-assigned-host.ngrok-free.dev` to your ngrok hostname (no scheme
or path). Keep your Google Maps key in this file. In `server/.env`, set
`CLIENT_ORIGIN=https://your-assigned-host.ngrok-free.dev`. Copy the exact hostname
from ngrok's forwarding URL, including its `.dev` or `.app` ending.

Run these commands in three separate terminals from the project root:

| Terminal | Commands |
| --- | --- |
| Backend | `cd server`, then `npm run dev` |
| Frontend | `cd client`, then `npm run dev` |
| Tunnel | `ngrok http 5173` |

Keep all three running. Open the **HTTPS forwarding URL shown by ngrok** in your
browser or on your phone. The local servers still print HTTP URLs; ngrok provides
HTTPS for the public address. Pressing Ctrl+C in the ngrok terminal disconnects
the tunnel. A separate tunnel to port 4000 is not needed.

If the ngrok hostname changes, update `NGROK_HOST` and `CLIENT_ORIGIN` and restart
the frontend and backend. This proxy configuration applies to the Vite dev
server; a production deployment needs its own API/WebSocket routing or an explicit
HTTPS `VITE_API_URL`.

## Seeing other users

Sign in separately on each device and allow browser location access. In the map
panel, choose **Share with everyone on this map** on each account that should be
visible. Sharing starts disabled; seeing your own footsteps does not mean your
location is shared. The setting applies to the account and can be turned off with
**Stop sharing my location**.

The panel shows the connection status and other visible users. Choose **Show
everyone** to fit their positions on screen, or choose a name to find that user.
Users who reconnect receive existing shared positions without waiting for anyone
to move. Offline markers disappear after a short reconnection grace period.

After upgrading from the original sessionless login, refresh and sign in again
on each device so a valid session is created.

## Sharing integration checks

With PostgreSQL (including PostGIS), Redis, and both packages' dependencies
installed, run `npm run test:integration` in `server`. The test uses a temporary
database schema and isolated Redis channel, checks two-user sharing, permissions,
session ownership and reconnection, and removes its test data afterward. The
database role needs permission to create a schema.
>>>>>>> 9edf66a (able to share location to every other user on the map)
