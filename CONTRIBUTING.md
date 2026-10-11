# Contributing

Start with the [setup guide](docs/setup.md). Discuss larger changes in an issue before opening a pull request. Small fixes, clearer documentation, and screenshot contributions are welcome.

## Workflow

1. Fork and clone the repository.
2. Create a branch describing your change.
3. Install dependencies in both packages and configure your own `.env` files.
4. Make the change and run the relevant checks below.
5. Open a pull request explaining the problem, resulting behavior, and validation. Include before/after screenshots for UI changes.

Keep changes focused. Do not commit `.env` files, credentials, generated `dist/` output, or personal location data. Use the example files to document new configuration.

## Validation

Frontend:

```sh
cd client
npm run lint
npm run build
```

Sharing integration checks:

```sh
cd server
npm run test:integration
```

The integration test requires both packages’ dependencies, a reachable Redis service, and PostgreSQL with PostGIS. It uses `server/.env`; use development services, not production. The database role must be able to create and drop a temporary schema. The test uses isolated tables and a Redis adapter channel and cleans up afterward. It runs its own HTTP server, so the development server does not need to be running.

The current location handler and base schema have [known inconsistencies](docs/troubleshooting.md#current-location-sharing-limitations), so the existing integration suite is expected to fail until those are corrected. Do not describe the suite as passing without actually running it.

Manually check location-related changes with separate accounts: sharing on/off, reconnecting, and offline marker removal.

## Screenshots

Follow the [screenshot guide](docs/screenshots/README.md). Use demonstration names and a non-sensitive location.

## License

No project license is currently included. Do not add a license or claim licensing terms without the maintainer’s decision.
