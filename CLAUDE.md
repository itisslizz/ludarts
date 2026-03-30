# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project Overview

A React/Next.js web application for interacting with a local Autodarts board. Autodarts is an automated dart scoring system that uses cameras to detect dart throws on a physical dartboard.

## Tech Stack

- **Framework:** Next.js 16 with App Router (`src/app/`)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **React:** v19

## Commands

```bash
npm run dev          # Start dev server (Turbopack, port 3000)
npm run build        # Production build
npm run lint         # ESLint
npm run start        # Start production server
```

## Autodarts Integration

### API
- **Cloud API:** `https://api.autodarts.io` — Bearer token auth
- **Local Board Manager:** `http://autodarts.local:3180`
- **WebSocket:** `WS /ms/v0/subscribe` for live game events

### Key API Service Prefixes
| Prefix | Path | Purpose |
|--------|------|---------|
| auth | `/auth/v1/*` | Authentication & token refresh |
| gs | `/gs/v0/*` | Game Service — lobbies, matches, throws |
| as | `/as/v0/*` | Account & Stats |
| bs | `/bs/v0/*` | Board Service — board state, camera stream |
| us | `/us/v0/*` | User Service |
| ms | `/ms/v0/*` | Message/WebSocket — live events |

### Important Endpoints
- `POST /gs/v0/lobbies` — create a lobby (variant, settings, players)
- `POST /gs/v0/lobbies/{id}/start` — start a match
- `GET /gs/v0/matches/{id}` — get match state
- `POST /gs/v0/matches/{id}/undo` — undo last throw
- `GET /bs/v0/boards/{id}/stream` — camera stream from board
- `WS /ms/v0/subscribe` — subscribe to real-time game events

### Authentication Flow
1. Obtain Bearer token via Autodarts auth
2. Refresh with `POST /auth/v1/refresh` using `refreshToken`
3. All API calls use `Authorization: Bearer <token>` header

> **Note:** There is no official public OpenAPI spec. The API surface above is community-documented and may change.
