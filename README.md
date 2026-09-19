<div align="center">

# 🐾 Animal Cup — AI Animal Football Simulator

**AI Animal Football Simulator**

Pick from 8 animal national teams, set your formation, and watch fully simulated 7v7 matches with live stats — playable anywhere on mobile.



</div>

---





> **Project Origin**
> This project is based on the original work [Animal Cup](https://app-ce3abc4512.happyseeds.space/)
> from the [HappySeeds](https://happyseeds.ai/) platform.
> It was further developed using **Claude Code** and released as open source.

### 🎮 Introduction

Animal Cup is inspired by classic arcade football games. You choose a team from 8 animal national squads, set your formation, and watch a fully simulated 7v7 match while viewing real-time statistics. The game is optimized for mobile devices, allowing you to play anytime, anywhere, and supports local multiplayer matches. ### 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Match Engine**: Pre-built Pixi.js runtime (`public/match-runtime-min/`)
- **Deployment**: Cloudflare Workers (via OpenNext)
- **Multiplayer**: LAN WebSocket relay (mobile phones act as wireless controllers)
- **Internationalization**: Built-in multi-language support (`app/i18n/`)

### 📂 Project Structure

```text
app/
├── api/          # Backend API routes
├── data/         # Game data (teams, players, etc.)
├── i18n/         # Multi-language content
├── lan/          # LAN match pages
├── lobby/        # Lobby (team selection, formation setup)
├── match/        # Match view
├── pad/          # Mobile controller page
├── ui/           # UI components
├── GameClient.jsx  # Game client entry point
├── Landing.jsx     # Landing page
└── layout.jsx      # Global layout
public/
└── match-runtime-min/   # Pre-built match engine (Pixi runtime)
script/           # Build / validation / LAN service scripts
```

### 🕹 Quick Start

Using pnpm is recommended (`pnpm-lock.yaml` is included in the repo):

```bash
# Install dependencies
pnpm install

# Start development server (port 13000)
pnpm dev
```

Open `http://localhost:13000` to get started.

**LAN Multiplayer:**

```bash
pnpm dev:lan
```

The match runs on a shared large screen; mobile phones connect as wireless controllers after scanning a QR code. ### 🛠 Common Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server (port 13000) |
| `pnpm dev:lan` | Start the development server with LAN multiplayer support |
| `pnpm lan` | Start the LAN relay service independently |
| `pnpm build` | Production build |
| `pnpm build:worker` | Build the Cloudflare Workers version |
| `pnpm start` | Run the production build |

### 📄 License

This project is open-sourced under the [Apache License 2.0](./LICENSE). ---

<a name="english"></a>

## English

> **Origin**
> This project is derived from the original
> [Animal Cup](https://app-ce3abc4512.happyseeds.space/) on
> [HappySeeds](https://happyseeds.ai/), remixed and rebuilt with **Claude Code**.

### 🎮 Overview

Animal Cup is inspired by classic arcade football games. Pick from 8 animal
national teams, set your formation, then watch a fully simulated 7v7 match
with live stats. The whole game is mobile-optimized so you can play anywhere,
and it supports local-network multiplayer.

### 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router) + React 19
- **Match Engine**: Pre-built Pixi.js runtime (`public/match-runtime-min/`)
- **Deployment**: Cloudflare Workers (via OpenNext)
- **Multiplayer**: LAN WebSocket relay (phones act as wireless gamepads)
- **i18n**: Built-in multi-language support (`app/i18n/`)

### 📂 Project Structure

```text
app/
├── api/ # Backend API routes
├── data/ # Game data (teams, players, etc.)
├── i18n/ # Localized strings
├── lan/ # LAN multiplayer pages
├── lobby/ # Lobby (team select, formation setup)
├── match/ # Match page
├── pad/ # Phone gamepad page
├── ui/ # UI components
├── GameClient.jsx # Game client entry
├── Landing.jsx # Landing page
└── layout.jsx # Global layout
public/
└── match-runtime-min/ # Pre-built match engine (Pixi runtime)
script/ # Build / verification / LAN server scripts
```

### 🕹Quick Start

pnpm is recommended (a `pnpm-lock.yaml` is shipped):

```bash
#Install dependencies
pnpm install

# Start the dev server (port 13000)
pnpmdev
```

Open `http://localhost:13000`.

**LAN multiplayer:**

```bash
pnpmdev:lan
```

The match runs on a shared big screen; phones scan a QR code to join as
wireless gamepads.

### 🛠 Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the dev server (port 13000) |
| `pnpm dev:lan` | Dev server with LAN multiplayer |
| `pnpm lan` | Start the LAN relay server standalone |
| `pnpm build` | Production build |
| `pnpm build:worker` | Build for Cloudflare Workers |
| `pnpm start` | Run the production build |

### 📄 License

Released under the [Apache License 2.0](./LICENSE).
