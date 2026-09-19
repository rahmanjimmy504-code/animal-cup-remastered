# 🐾 Animal Cup Remastered

**A community-developed remastered version of the original Animal Cup game.**

Animal Cup Remastered is a rebuilt and expanded version of the original **Animal Cup** experience. It keeps the core animal-football concept while providing a modern codebase, mobile-friendly gameplay, and web deployment support.

> **Important:** This repository is the **remastered/community version**. It is not the original Animal Cup repository.

## 🎮 What is Animal Cup Remastered?

Choose from animal national teams, set your formation, and watch simulated 7v7 football matches with live statistics. The game is designed for desktop and mobile devices.

### ✨ Remastered goals
- 🐾 Preserve the fun concept of the original Animal Cup
- ⚽ Improve and expand the gameplay experience
- 📱 Keep the game mobile-friendly
- 🌐 Make the project easy to run and deploy on the web
- ☁️ Support free-friendly deployment with Cloudflare Workers
- 🛠️ Keep the project open to further community development
- 🏆 Add a persistent Championship/Career mode
- 📊 Track lifetime match statistics, coins, streaks and achievements
- 💾 Save progression locally with no account or paid backend
- 🎮 Support human play, AI-vs-AI watching, touch controls and LAN play

## 🏆 Original Animal Cup

The original Animal Cup was published through the **HappySeeds** platform:

- Original game: https://app-ce3abc4512.happyseeds.space/
- HappySeeds: https://happyseeds.ai/

This remastered project builds on that concept while maintaining a clear distinction between the original project and this community-developed version.

## 🏆 Full game systems

Animal Cup Remastered is more than a match viewer. The current game layer includes:

- **Quick Match** — choose teams, formations, difficulty, match length and kit.
- **Human Play** — control your team on desktop or touch devices.
- **AI Watch** — let both teams play while you follow the broadcast-style HUD.
- **Championship Cup** — a persistent three-round knockout career run with a trophy outcome.
- **Career profile** — local matches, wins, draws, losses, goals, coins, streaks and achievements.
- **Match presentation** — scoreboard, possession/stat overlays, goal effects, crowd/audio events, screenshots, zoom and full-time results.
- **LAN multiplayer** — phones can act as controllers for a shared-screen match.
- **Mobile/PWA support** — responsive landing UI, touch controls and installable web-app metadata.

Progress is stored in browser `localStorage`; no login, database or paid service is required for the core progression systems.

## 🚀 Technology
- **Framework:** Next.js 15 (App Router) + React 19
- **Match engine:** Pixi.js runtime (`public/match-runtime-min/`)
- **Deployment:** Cloudflare Workers via OpenNext
- **Multiplayer:** LAN WebSocket relay
- **Internationalization:** Built-in multi-language support
- **Package manager:** pnpm

## 🕹️ Run locally

Install dependencies with `pnpm install`, then start the development server with `pnpm dev`.

The development server uses port `13000`.

### LAN multiplayer

Use `pnpm dev:lan` to start development with LAN multiplayer support. The match can run on a shared screen while phones connect as wireless controllers.

## ☁️ Cloudflare Workers

The project includes an OpenNext Cloudflare build. Use `pnpm build:worker` to build the Cloudflare Workers version.

Intended deployment flow:

**GitHub → Build → OpenNext → Cloudflare Workers → Animal Cup Remastered**

## 📂 Project structure

- `app/` — application pages, APIs, game data, lobby, match, LAN and UI
- `public/match-runtime-min/` — pre-built match engine
- `script/` — build, validation and LAN service scripts

## 🛠️ Common scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm dev:lan` | Start development with LAN multiplayer |
| `pnpm lan` | Start the LAN relay service |
| `pnpm build` | Create a production build |
| `pnpm build:worker` | Build for Cloudflare Workers |
| `pnpm start` | Run the production build |

## 📜 Project history

**Original Animal Cup** → **Community remix/rebuild** → **Animal Cup Remastered** → **Ongoing improvements**

## 👥 Attribution

This project acknowledges the original Animal Cup experience and its creators/platform. The remastered repository is maintained as a separate community-developed project.

The repository also contains development work produced with AI-assisted coding tools, including Claude Code.

## 📄 License

This repository is released under the **Apache License 2.0**. See [LICENSE](./LICENSE) for the full license text.

---

### 🐾 Animal Cup Remastered

**Original concept preserved. New codebase. New improvements. Community-driven development.**