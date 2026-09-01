# CLAUDE.md — VoteIT Frontend

Codebase guide for AI-assisted development. See also [CONTRIBUTING.md](CONTRIBUTING.md) and [README.md](README.md).

## Stack

- **Vue 3** (`<script setup lang="ts">`) + **Vuetify 3** + **Pinia** + **Vue Router 4**
- **TypeScript** (strict mode, path alias `@/` → `src/`)
- **Vite** for builds, **Vitest** for tests (happy-dom environment)
- **`src/socket/`** — in-house WebSocket client for real-time updates
- **Vue i18n** for translations (keys in `src/locales/`)

## Project layout

```
src/
  main.ts            # App entry — module registration order matters here
  modules/           # Feature modules (self-contained, side-effect registration)
  components/        # Shared UI components
  composables/       # Reusable Vue 3 composables
  socket/            # WebSocket client, channel subscriptions
  loader/            # App boot + what each route must load before it's shown
  utils/             # REST API client, TypedEvent, general utilities
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
| `useErrorHandler` | `src/composables/useErrorHandler.ts` | Centralised error catching and display |
| `usePermission` | `src/composables/usePermission.ts` | Guard routes/actions behind auth/role checks |
| `useAlert` | `src/composables/useAlert.ts` | Show snackbar/toast alerts |
| `useModal` | `src/composables/useModal.ts` | Open modal dialogs |
| `useContextRoles` | `src/composables/useContextRoles.ts` | Query user roles for a given content object |
| `useChannel` | `src/socket/useChannel.ts` | Subscribe to a real-time channel |

## Loading

Nothing loads by mounting. The app's boot fetches run from `startAppLoad()` in `src/loader/appReady.ts`, called by
`main.ts` before the router's first navigation, and everything a route needs is declared on the route itself:

```typescript
router.addRoute({
  path: '/m/:id/:slug',
  name: 'MeetingRouterView',
  component: MeetingView,
  meta: { load: meetingRequirement }   // a RequirementFactory, or an array of them
})
```

`src/loader/index.ts` installs a `beforeResolve` guard that runs them. The consequences worth knowing:

- **A requirement loads in the background by default.** The navigation goes through at once and the view says what's
  still coming — the agenda item view's spinner reads `subscribed` from its own `useChannel`. Holding a navigation for
  a channel that fills in *part* of a page just makes the app feel slow; switching agenda items is the case that
  proves it.
- **`blocking: true` holds the navigation** until the requirement is met. Worth it only where the page is no use
  without it, or where the answer decides whether we belong on the route at all — `meetingRequirement` is currently
  the only one. A redirect can't be issued once the view is mounted, so only a blocking requirement may return one.
- **The first navigation waits for everything**, blocking or not. Nothing but the splash is on screen, so there is
  nothing there to feel slow, and the app's first page arrives whole with the splash counting it down.
- Requirements of one route record run in parallel and records run in sequence, parent first; within a record the
  background ones wait for the blocking ones. So nothing subscribes to meeting content before we know the meeting is
  ours — whether it's declared on a child record (the agenda item) or alongside it (the room routes ask for the
  meeting and the room together). Anything that genuinely depends on another step stays a single composite
  requirement — see `meetingRequirement` (`src/modules/meetings/requirements.ts`), where the fetch is what decides
  which channel to subscribe.
- A requirement with `release()` is **held** across navigations and skipped while it's in hand, so moving between two
  agenda items doesn't retake the meeting channel. One without it is a plain fetch that runs every time.

A factory decides from the route alone — it runs before the boot fetches have settled, so that the step count is
whole from the first frame instead of growing as data arrives. Anything that needs fetched state (who's signed in,
what's in a store) goes in `load`, which runs after; producing a requirement that turns out to have nothing to do is
fine. See `meetingListRequirement` (`src/modules/meetings/listRequirement.ts`).

Requirement factories import from `@/loader/channelRequirement` and `@/loader/types` directly. Importing `@/loader`
installs the guards, so only `main.ts` and the loading UI do that.

## Real-time channels

Channels are **objects, not strings**. Each one is created once with `defineChannel(name)` in its module's
`contentTypes.ts` and exported — `agendaItemChannel`, `participantChannel`, `roomChannel` and so on. Defining the same
name twice throws, so import the existing handle rather than calling `defineChannel` again.

```typescript
import { agendaItemChannel } from '../agendas/contentTypes'
import useChannel from '@/socket/useChannel'

const { promise, subscribed, subscribeError } = useChannel(agendaItemChannel, agendaId)
```

`useChannel` is for a target that follows **live data** rather than the route — the agenda item a room is showing, a
channel gated on a selected tab. When the target comes from route params, declare it with `channelFromParam` in the
route's `meta.load` *as well*, so the subscription is under way before the view is mounted. The view still calls
`useChannel` for the same target: that's what gives it `subscribed`, and unless the requirement is `blocking` the view
is up before the content is in.

Both arguments may be reactive; the subscription follows them and is dropped on unmount.

A channel's initial state arrives in bundles that are held back until the server says it's complete, then applied in
one tick. Two consequences worth knowing:

- `subscribed` (and the `promise`) settle only once **all** the initial state is in, not when the server accepts the
  subscription. The `promise` is a `ProgressPromise` — attach `onProgress` to follow the bundles as they land.
- `beforeChannelStateEvent` fires immediately before that state is applied. It's how `contentCleanup` drops what a
  previous subscription to the same channel left behind, without the views ever rendering an empty channel.

Use `channel.onSubscribe()` / `channel.onLeave()` for module-level side effects — they also fire for resubscriptions
after a reconnect, which the per-component `promise` does not.

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

- `src/socket/index.ts:40` — Outgoing heartbeat is a workaround for a backend connectivity-tracking limitation; TODO to remove when backend handles it
- `src/modules/meetings/types.ts` — The `Previous` meeting state is a workaround, not a real state
- `src/modules/polls/rules.ts` — Adding polls to different contexts needs architectural improvement (TODO)

## CI

- Every push/PR: lint (`eslint --no-fix`) → build (type-check included) → tests
- Every `v*` tag: same checks, then Docker image built and pushed to GHCR
