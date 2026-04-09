# Start

The initial monorepo structure is already created in this repository.

## What is ready

- `desktop/` contains the working Electron placeholder application.
- `web/`, `mobile/`, and `server/` are reserved targets with `README.md` placeholders.
- the root `package.json` routes commands through `scripts/run-target.js`.
- the project is launched from the repository root.

## Current launch rules

- `npm start` runs `desktop` by default.
- `npm start -- desktop` explicitly runs the same desktop target.
- `npm start -- --target desktop` is also supported.
- `npm run dev -- desktop` runs the desktop target in explicit dev mode.
- `npm run check -- desktop` runs the desktop validation script.
- `npm start -- web` shows a clear placeholder message because that target is not configured yet.

## Notes

- the desktop application now lives inside `desktop/`.
- the desktop target now uses `desktop/assets/app.ico` both in dev mode and in Windows packaging.
- the npm workflow standard is described in `docs/npm.md`.
- developer notes belong in `docs/dev/`.
- end-user and overview help belong in `docs/help/`.
- for smoke verification, use `ALIONIT_SMOKE=1` before the desktop start command so the app closes automatically after a successful launch.
