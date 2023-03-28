# Changelog

Document notable changes here.

Version format is `major`.`minor`.`patch`. Until major version 1 is realeased, API changes accours on minor version bumps, but never on patch version bumps.

## 0.12.1
Bugfix release

- Fixed date conversion problem causing issues for "find meeting" function

## 0.12.0
Support for meeting dialects and using meeting groups to define voting rights and setting Electoral Register. (Skipping 0.11 to sync with backend version)

- Allow selecting a meeting dialect when starting a meeting [#224](https://github.com/VoteIT/voteit_frontend/issues/224)
- Use Electoral Register definitions loaded from API [#225](https://github.com/VoteIT/voteit_frontend/issues/225)
- Dynamic role columns in participant list [#226](https://github.com/VoteIT/voteit_frontend/issues/226)
- Sometimes restrict ability to change Electoral Register method [#227](https://github.com/VoteIT/voteit_frontend/issues/227)
- Dialect role selection in meeting groups [#229](https://github.com/VoteIT/voteit_frontend/issues/229)
- Active users component (better alternative to presence check) [#232](https://github.com/VoteIT/voteit_frontend/issues/232)
- Allow manually triggering Electoral Register creation [#241](https://github.com/VoteIT/voteit_frontend/issues/241)
- Major overhaul of Control Panel (Multiple issues)
- Presence check is now a component (default off) [#260](https://github.com/VoteIT/voteit_frontend/issues/260)
- Allow user to select language (en and sv supported) [#222](https://github.com/VoteIT/voteit_frontend/issues/222)
- Improved visaualization of STV results

## 0.10.3
- Show "Add user" in meeting only for organisation managers [#242](https://github.com/VoteIT/voteit_frontend/issues/242)
- Add save to agenda item ordering [#244](https://github.com/VoteIT/voteit_frontend/issues/244)
- Auto-truncate long text proposal titles [#233](https://github.com/VoteIT/voteit_frontend/issues/233)
- Fix long ordered lists (ol) in rich text [#230](https://github.com/VoteIT/voteit_frontend/issues/230)

## 0.10.2
- Tag editing for proposals now work as for discussion posts [#238](https://github.com/VoteIT/voteit_frontend/issues/238)
- Plenary view subscribes to AI channel (fixes problem with proposal text tags availability) [#237](https://github.com/VoteIT/voteit_frontend/issues/237)
- Dev migrated from Webpack to Vite [#234](https://github.com/VoteIT/voteit_frontend/issues/234)

## 0.10.1
- Organisation or meeting title in app bar
- User API logic to determine of moderator can change meeting state

## 0.10.0
- Add `deleting` state to meetings
- Allow filtering on meeting states in Find meeting [#219](https://github.com/VoteIT/voteit_frontend/issues/219)
- Rename Settings to Control panel
- Add Export from meeting in Control panel, closed [#218](https://github.com/VoteIT/voteit_frontend/issues/218)

## 0.9.6

### Changed
- PollsView (listing) now keeps open poll states in history, making back navigation nicer.

### Fixed
- Reset vote data when switching poll, fixed [#217](https://github.com/VoteIT/voteit_frontend/issues/217)

## 0.9.5
Skipped patch version numbers, due to high number of changes.

### Changed
- Loader now waits for channel subscriptions [#140](https://github.com/VoteIT/voteit_frontend/issues/140)
- Added loading spinner on AI discussions while waiting for channel subscription [#140](https://github.com/VoteIT/voteit_frontend/issues/140)
- Limit bug reporting function to meeting moderators, closed [#208](https://github.com/VoteIT/voteit_frontend/issues/208)
- Added print button to minutes page, closed [#205](https://github.com/VoteIT/voteit_frontend/issues/205)
- UserSearch rewritten using VAutocomplete, closed [#200](https://github.com/VoteIT/voteit_frontend/issues/200)

### Fixed
- Fix order of years on organisation page "Find meeting", fixed [#210](https://github.com/VoteIT/voteit_frontend/issues/210)
- Crucial buttons got double-click protection, fixed [#201](https://github.com/VoteIT/voteit_frontend/issues/201)
- Fix DurationInput (values were strings, but handled as numbers), fixed [#206](https://github.com/VoteIT/voteit_frontend/issues/206)
- Allow clicking checkmark icon to toggle voter in manual Electoral Register form, fixed [#196](https://github.com/VoteIT/voteit_frontend/issues/196)

## Previous preleases
For info on previous releases, see [Closed Milestones](https://github.com/VoteIT/voteit_frontend/milestones?state=closed) on GitHub project.
