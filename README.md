# VoteIT frontend

VoteIT is an open source project for digital decision processes. The project is maintained by the Swedish organisation [VoteIT](https://voteit.se/), and mainly used by [the member organizations](https://voteit.se/om-voteit/#medlemsorganisationer).

This repository contains the user interface (frontend) for VoteIT, based on [Vue 3](https://vuejs.org/) and [Vuetify](https://vuetifyjs.com/).  
Backend repository is found at [VoteIT/voteit](https://github.com/VoteIT/voteit/).

## Architecture overview

The app is built with:

- **[Vue 3](https://vuejs.org/)** (Composition API / `<script setup>`) for UI components
- **[Vuetify 3](https://vuetifyjs.com/)** for the component library
- **[Pinia](https://pinia.vuejs.org/)** for state management
- **[Vue Router 4](https://router.vuejs.org/)** for client-side routing
- An in-house **WebSocket client** (`src/socket/`) for real-time updates
- **[Vue i18n](https://vue-i18n.intlify.dev/)** for translations (Swedish/English)

### Module system

Feature functionality lives in `src/modules/`. Each module registers itself into shared plugin registries (routes, menu items, settings panels, etc.) at import time via side effects. The import order in `src/main.ts` matters — see the comment there for details.

Key modules: `auth`, `organisations`, `meetings`, `polls`, `proposals`, `agendas`, `discussions`, `speakerLists`, `plenary`, `rooms`, `notes`, `tokenAPI`.

### Key directories

| Path                | Purpose                                          |
| ------------------- | ------------------------------------------------ |
| `src/modules/`      | Feature modules (each self-contained)            |
| `src/components/`   | Shared UI components                             |
| `src/composables/`  | Reusable Vue 3 composables                       |
| `src/socket/`       | WebSocket client and channel subscriptions       |
| `src/utils/`        | Utilities, REST API client, event bus            |
| `src/contentTypes/` | Content type registry and base classes           |
| `src/plugins/`      | Vue plugin configuration (Pinia, Vuetify)        |
| `src/locales/`      | i18n translation files                           |

## Prerequisites

- **Node.js 22 or 24** (see `.nvmrc` or CI matrix)
- A running **VoteIT backend** — see [VoteIT/voteit](https://github.com/VoteIT/voteit/) for backend setup

## Project development setup

```bash
npm install
npm run dev
```

The dev server starts at `http://localhost:3000` and proxies API/WebSocket requests to the backend.

### Environment variables

Copy `.env.development` and adjust if needed:

```
VITE_ID_HOST=http://id.localhost:8081   # OAuth identity provider
VITE_PROXY_HOST=voteit.localhost:8000   # Backend host:port to proxy requests to
```

## Available scripts

| Command                  | What it does                                 |
| ------------------------ | -------------------------------------------- |
| `npm run dev`            | Start dev server on port 3000                |
| `npm run build`          | Type-check and build for production          |
| `npm test`               | Run unit tests with Vitest                   |
| `npm run lint`           | Run ESLint (use `--no-fix` in CI)            |
| `npm run typeCheck`      | Run TypeScript type checker without building |
| `npm run extractLocales` | Report missing/unused translation keys       |

## Run test suite

```bash
npm test
```

Tests are colocated with source files as `*.test.ts`. Run type checking separately with `npm run typeCheck`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for coding conventions, how to add a module, translation workflow, and PR process.
