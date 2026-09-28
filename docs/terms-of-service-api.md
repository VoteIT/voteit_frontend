# Terms of service: suggested changes to the backend prototype

The frontend on `feature/gdpr-extensions` now uses the prototype in `voteit` (`/api/terms-of-service/` and the
`require_tos_accept` pipeline step) as it is. This document lists what the frontend does with it, and a few changes
that would make it more solid. None of them block the frontend.

## How the frontend uses the prototype

- **Login:** `/accept-tos` (`src/modules/auth/AcceptTosView.vue`) reads `partial_token` and `resume_url` from the
  query.
  - It fetches `GET terms-of-service/` anonymously and shows `global_body`, then `body`.
  - Accepting resumes with a full page load of `resume_url?partial_token=…&accept_tos=<pk>`.
  - Cancelling goes home.
  - It only follows a `resume_url` matching `^/complete/[\w-]+/$`, since the value comes from the address bar.
- **Control panel:** org managers list all versions, publish with `POST {body}` and correct with `PATCH {body}`. The
  form edits `body`, the organisation's addition; `global_body` is shown read-only.
- **No acceptance inside the app.** Users are only asked at login. `POST terms-of-service/<pk>/accept/` is unused.

## Suggested changes

### 1. Say when a version needs review

When `create_org_tos` adds versions for new global terms, the control panel should ask the org manager to check that
their addition still fits.

The frontend currently guesses: the newest version needs review when its `based_on` differs from the previous
version's and its `body` is unchanged. That clears only when the manager publishes or corrects the text. An addition
that is still fine can't be marked as reviewed without changing it.

Suggestion: a `reviewed` datetime on `TermsOfService`, null when `create_org_tos` makes the row and set by `POST` and
`PATCH` from a manager. Add a `POST terms-of-service/<pk>/reviewed/` action for "looks good as it is". The frontend
would flag attention when the newest version's `reviewed` is null.

### 2. Add `modified`

With a `modified` datetime (auto_now), the version history could show that a version was corrected after it was
published, and when. Corrections change what users agreed to, even if only slightly, so that trail is worth showing.

### 3. Limit `PATCH` to versions nobody is past

`PATCH` works on any version, including old ones that were replaced long ago. The frontend only corrects the newest.
Suggest refusing `PATCH` on versions older than the active one with a 400.

### 4. Decide whether connecting a login method asks for acceptance

`require_tos_accept` runs whenever the pipeline does, including when a logged-in user connects another login method
(`user` is set). That's probably fine, since it only asks if they haven't accepted the active version, but it's worth
confirming as intended.

### 5. Users with an open session

A version that takes effect while someone is logged in isn't asked for until their next login. That's the agreed
behaviour for now. If it ever needs tightening, the user payload would need the accepted version, and the frontend
would bring back an in-app dialog using the existing `accept` action.
