# CLAUDE.md — VoteIT Frontend

Codebase guide for AI-assisted development. See also [CONTRIBUTING.md](CONTRIBUTING.md) and [README.md](README.md).

## Stack

- **Vue 3** (`<script setup lang="ts">`) + **Vuetify 3** + **Pinia** + **Vue Router 4**
- **TypeScript** (strict mode, path alias `@/` → `src/`)
- **Vite** for builds, **Vitest** for tests (happy-dom environment)
- **envelope-client** for real-time WebSocket updates
- **Vue i18n** for translations (keys in `src/locales/`)

## Project layout

```
src/
  main.ts            # App entry — module registration order matters here
  modules/           # Feature modules (self-contained, side-effect registration)
  components/        # Shared UI components
  composables/       # Reusable Vue 3 composables
  utils/             # REST API client, WebSocket, TypedEvent, general utilities
  contentTypes/      # ContentType base class and registry
  plugins/           # Pinia + Vuetify configuration
  locales/           # i18n translation files
  views/             # Page-level route components
  theme/             # Vuetify theme overrides
```

## Module registration pattern

Modules in `src/modules/` register themselves via **side effects at import time**. They push routes, menu items, settings panels etc. into shared registries (e.g. `meetingSettingsPlugins`, `agendaMenuPlugins` from `src/modules/meetings/registry.ts`).

The import order in `src/main.ts` is therefore load-order-dependent:
- `auth` and `organisations` must come before `meetings`
- Sub-modules (e.g. `polls/methods`, `speakerLists/genderTags`) must come after their parent

When adding a new module, append its import to `src/main.ts` **after** any modules it depends on.

## Key composables to reuse

Before writing new logic, check if one of these already covers it:

| Composable | File | Purpose |
|-----------|------|---------|
| `useLoader` | `src/composables/useLoader.ts` | Track async loading state |
| `useErrorHandler` | `src/composables/useErrorHandler.ts` | Centralised error catching and display |
| `usePermission` | `src/composables/usePermission.ts` | Guard routes/actions behind auth/role checks |
| `useAlert` | `src/composables/useAlert.ts` | Show snackbar/toast alerts |
| `useModal` | `src/composables/useModal.ts` | Open modal dialogs |
| `useContextRoles` | `src/composables/useContextRoles.ts` | Query user roles for a given content object |
| `useChannel` | `src/composables/useChannel.ts` | Subscribe to a WebSocket channel |

## Content stores are shallow — replace, never mutate

Content stores hold server objects in `shallowReactive(new Map<number, T>())`, not `reactive(...)`. Only the map itself
is tracked; values come back **raw**.

This works because `ContentType.updateMap()` (`src/contentTypes/ContentType.ts`) — the funnel for all socket-driven
store writes — replaces whole entries (`map.set(item.pk, item)`), and the server sends full objects rather than diffs.

Two rules follow, and breaking either fails **silently** (no error, just a view that never updates):

- **Never mutate a stored object in place.** Not `store.get(pk)!.title = x`, not `Object.assign(store.get(pk)!, patch)`,
  not `push`/`splice` on one of its arrays. Build a new object and `set()` it — see `useRoomStore` for the merge pattern:
  `meetingRooms.set(room, { ..._room, ...partial })`.
- **A nested container needs its own wrapper.** A `Map`/`Set`/array stored inside a shallow store is not made reactive
  for you. Either wrap it explicitly (`tagStore.set(m, shallowReactive(new Map()))` in `useParticipantTags`) or replace
  it wholesale on every change (`contextRoles.set(key, new Set([...]))` in `useContextRoles`).

Deep `reactive()` is still the right choice for local component form state, where `v-model` binds nested fields.

## Role key encoding

`useContextRoles` stores roles in a flat shallow-reactive `Map` keyed by a slash-delimited string:

```
Format:  "<contentType>/<objectPk>/<userId>"
Example: "organisation/123/456"
```

When `userId` is `''`, the key is used as a **prefix** to query all users on an object (see `iterRoles`).

## Event bus

Global UI events are in `src/utils/events.ts` as `TypedEvent` instances. Notable shortcuts for `openAlertEvent`:

```typescript
openAlertEvent.emit('plain info message')
openAlertEvent.emit('*warning message')   // '*' prefix → warning level
openAlertEvent.emit('^error message')     // '^' prefix → error level
```

## Naming conventions

- **No `I`-prefix** on interfaces/types — use plain names (`User`, `Meeting`, not `IUser`)
- Composables: `use` prefix, return only what callers need
- Components: PascalCase (`.vue`), utilities: camelCase (`.ts`)

## Known issues / active FIXMEs

- `src/contentTypes/types.ts:18` — The `Transition`/`State` 1-to-1 relationship is modelled incorrectly; marked FIXME
- `src/utils/Socket.ts:49` — Outgoing heartbeat is a workaround for a backend connectivity-tracking limitation; TODO to remove when backend handles it
- `src/modules/meetings/types.ts` — The `Previous` meeting state is a workaround, not a real state
- `src/modules/polls/rules.ts` — Adding polls to different contexts needs architectural improvement (TODO)

## CI

- Every push/PR: lint (`eslint --no-fix`) → build (type-check included) → tests
- Every `v*` tag: same checks, then Docker image built and pushed to GHCR
