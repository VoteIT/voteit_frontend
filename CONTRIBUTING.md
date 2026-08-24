# Contributing to VoteIT Frontend

Thank you for contributing! This guide covers how to set up the project, the conventions we use, and what to do when submitting a PR.

## Development setup

1. **Prerequisites**: Node.js 22 or 24, and a running [VoteIT backend](https://github.com/VoteIT/voteit/).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   The app is available at `http://localhost:3000`. API and WebSocket requests are proxied to the backend via `VITE_PROXY_HOST` (see `.env.development`).

## Code style

The project uses **ESLint** + **Prettier**. Run the linter before pushing:

```bash
npm run lint
```

Key formatting rules (from `.prettierrc.json`):
- Single quotes (`'`)
- No semicolons
- No trailing commas
- 2-space indentation

TypeScript is checked separately:

```bash
npm run typeCheck
```

Both are run automatically in CI on every push and PR.

## Naming conventions

- **Files/components**: PascalCase for Vue components (`MeetingView.vue`), camelCase for composables and utilities (`useLoader.ts`, `restApi.ts`).
- **Types/interfaces**: No `I`-prefix — use plain names (`User`, `Meeting`). Avoid Hungarian notation.
- **Composables**: Prefix with `use` and return only what callers need.

## Adding a module

1. Create a directory under `src/modules/<name>/`.
2. Add an `index.ts` that registers the module into any shared registries (e.g. `meetingSettingsPlugins`, `agendaMenuPlugins`) via side effects.
3. Add routes in a `router.ts` file inside the module and import it from `index.ts`.
4. Import the module in `src/main.ts`.

**Import order in `src/main.ts` matters.** Modules register into shared registries at import time. `auth` and `organisations` must be imported before `meetings`, and sub-modules (e.g. `polls/methods`) must come after their parent (`polls`). See the comment block in `src/main.ts` for details.

## Adding translations

Translation files are in `src/locales/`. After adding new keys, run:

```bash
npm run extractLocales
```

This reports missing or unused translation keys across all locale files.

## Testing

Tests are colocated with source files as `*.test.ts`. Run the test suite with:

```bash
npm test
```

Write tests for new composables and utilities. Component tests use [Vue Test Utils](https://test-utils.vuejs.org/) and run in a [happy-dom](https://github.com/capricorn86/happy-dom) environment.

## Submitting a PR

1. Branch off `main`.
2. Make sure `npm run lint`, `npm test`, and `npm run build` all pass locally.
3. Open a PR — the template will prompt you for a description, test instructions, and a checklist.
4. CI runs lint + build + tests automatically. PRs should not be merged with failing CI.

## Known architectural patterns

- **Pinia stores** (`useXxxStore`) manage server-synced state per domain.
- **Composables** (`useXxx`) encapsulate reusable reactive logic. Prefer reusing `useLoader`, `useErrorHandler`, `usePermission`, and `useAlert` rather than reimplementing them.
- **ContentType registry** — the `ContentType` class in `src/contentTypes/` is the base for all server-pushed content. Modules register handlers via `.on('added', ...)` / `.on('removed', ...)`.
- **Real-time updates** come in over the WebSocket client in `src/socket/`. Subscriptions are channel objects created with `defineChannel()` and consumed via `useChannel()` — pass the exported channel, not its name. Falling back to REST is handled by the individual store or composable.
