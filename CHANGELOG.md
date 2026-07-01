# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-01

### Added
- **Enterprise AI Career Documents Suite**: Advanced editor workspace supporting cover letters, statements of purpose, network outreach emails, and proposals.
- **Career Intelligence Engine**: Interactive mock interviews with STAR-method guidelines, career roadmaps, and salary estimation.
- **Offline Sync & Service Worker**: Local-first storage fallback in IndexedDB (`local-db.ts`) with background synchronization protocol.
- **Enterprise Collaboration Workspaces**: Multi-tenant organizations support with billing modules, recruiter comment locking, and presence systems.
- **Self-Healing Mock DB Fallback**: Automatically traps Pg Pool connection failures and switches to an in-memory database instance, ensuring high availability and testing compliance.
- **Strict TypeScript & Security Headers**: Strict type safety verification with HSTS, strict CSP policies, and frame prevention.

### Fixed
- Fixed authentication and reset password redirection states.
- Fixed daily credit quota checks, adjusting limits to 35 for AI assistant commands.
- Corrected typecheck implicit `any` parameter issues on admin dashboard map functions.
