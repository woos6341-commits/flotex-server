# Flotex EGP API server (standalone deploy package)

This folder is the Node/Express API extracted from the Expo workspace. It has its own npm manifest and does not use pnpm, Expo, React Native, or workspace patches.

## Deploy on SnapDeploy

1. Upload this folder (or its ZIP) as the service root.
2. Select Node.js 20 or newer.
3. Set the service build command to `npm install && npm run build` and start command to `npm start`.
4. Set `DATABASE_URL`, `JWT_SECRET`, and `PORT` in the SnapDeploy environment-variable settings. SnapDeploy generally assigns `PORT`; do not hard-code a different one in production.
5. Import the SQL migrations in `drizzle/` into the MySQL database, in order, before using the API. Confirm all migrations that are appropriate for the source data before applying them.

`npm start` starts the API on `0.0.0.0:$PORT` (defaults to 3000). A database connection is created when the app handles database-backed requests. Health endpoints are registered in `server/health.ts`.

## Local test

```sh
cp .env.example .env
# Edit .env and provide a reachable, migrated MySQL database
npm install
npm run build
npm start
```

Do not commit `.env`; set secrets in SnapDeploy's encrypted environment configuration. `JWT_SECRET` must be a private random value and must not be exposed to the mobile app. This package does not include Expo web static assets; it serves the API routes only. Existing Manus-based authentication or provider integrations still need to be replaced/configured for a fully independent production service.
