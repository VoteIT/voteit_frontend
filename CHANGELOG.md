# Changelog

Document notable changes here.

Version format is `major`.`minor`.`patch`. Until major version 1 is realeased, API changes accours on minor version bumps, but never on patch version bumps.

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
