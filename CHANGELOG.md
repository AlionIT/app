# CHANGELOG

All notable changes to this project are documented in this file.

This file is not updated on every commit.
Changes are usually collected when preparing a version and tag.

## [Unreleased]

### Added

### Changed

### Fixed

## [0.1.0] - 2026-04-10

### Added

- Set up the initial AlionIT npm workspace monorepo with a root target router.
- Added the Electron desktop target used as the current prototype shell for the future AlionIT site.
- Added root commands for `start`, `dev`, `check`, `pack`, `dist`, and `prod:smoke`.
- Added explicit target selection for `desktop` through positional arguments and `--target`.
- Added reserved placeholder targets for `web`, `mobile`, and `server`.
- Added a Windows application icon for the desktop app in development and packaged builds.
- Added desktop smoke-mode support for automated launch checks.
- Added a desktop live-reload development runner for renderer reloads and main-process restarts.
- Added baseline project documentation, including README, npm workflow, start guide, Electron icon guide, live-reload guide, and project-start templates.
- Added the initial project `.gitignore` and npm lockfile.

### Changed

- Standardized the project workflow around commits, changelog preparation, versions, and annotated release tags.
- Standardized `CHANGELOG.md` and Git commit messages to use English.
