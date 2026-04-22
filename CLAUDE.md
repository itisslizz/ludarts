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

## Games

Each game lives in `src/games/<game-id>/` with `useGameLogic.ts` (reducer) and `GameView.tsx`.

| Game ID | Name | Players | Targets | Description |
|---------|------|---------|---------|-------------|
| `around-the-world` | Around The World | 1 | 1–20, Bull | Hit each number in sequence |
| `x01` | X01 | 1–6 | All | Count down from 301/501/701 to zero (configurable out mode) |
| `cricket` | Cricket | 2–6 | 15–20, Bull | Close targets and outscore opponents |

### Game Architecture
- **State management:** `useReducer` with action types `REGISTER_THROW`, `END_TURN`, `UNDO`, `RESET`
- **Board integration:** Games register throw handlers via `onThrowDetected` and takeout handlers via `onTakeout`
- **Routing:** `GameScreen` dispatches to game views; `GameConfigScreen` handles per-game config (X01 only currently)
- **Bust/Takeout:** Both immediately end the current turn and advance to the next player

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
