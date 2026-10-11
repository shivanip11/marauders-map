# Frontend

The React + Vite client handles the parchment reveal, account forms, Google Maps, browser geolocation, and live markers.

Start with the [project README](../README.md) and [setup guide](../docs/setup.md). Copy [.env.example](.env.example) to `.env` and add your Maps browser key.

```sh
npm ci
npm run dev
```

Open http://localhost:5173 with the backend on port 4000. Leave `VITE_API_URL` empty locally to use the API and WebSocket proxy.

`npm run build` writes `dist/`; `npm run lint` runs Oxlint. Production routing is explained in the [deployment guide](../docs/deployment.md).
