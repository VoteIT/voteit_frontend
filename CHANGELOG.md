# Changelog

Document notable changes here.

Version format is `major`.`minor`.`patch`. Until major version 1 is realeased, API changes accours on minor version bumps, but never on patch version bumps.

## 0.17.2 (2023-09-04)
- Fix Repeated Schulze creation form [#221](https://github.com/VoteIT/voteit_frontend/issues/221)

## 0.17.1 (2023-08-22)
- New validation rule for tabbed text imports (equal column count)
- Disable alert for ping request timeout

## 0.17.0 (2023-06-19)
Optimizations for large meetings.

- Agenda Item body is now a separate content, sent on Agenda channel [#199](https://github.com/VoteIT/voteit_frontend/issues/199)
- Unnecessary user data dropped from API (full name calculated) [#312](https://github.com/VoteIT/voteit_frontend/issues/312)

## 0.16 (UNRELEASED)
- Function to show ballot for poll in Plenary view [#90](https://github.com/VoteIT/voteit_frontend/issues/90)
- Display ordering setting and disabled ballot for private and upcoming polls [#286](https://github.com/VoteIT/voteit_frontend/issues/286)
- Allow selecting proporal order in start poll view [#307](https://github.com/VoteIT/voteit_frontend/issues/307)
- Organisation managers can edit organisation contact information on organisation page tab [#308](https://github.com/VoteIT/voteit_frontend/issues/308)
- Added editable contact info to organisation page [#309](https://github.com/VoteIT/voteit_frontend/issues/309)

## 0.15.0 (2023-05-25)

### Changed
- Handle invite annotations (display, add, clear)
- Invite form displays result instead of closing modal

## 0.14.3 (2023-05-13)
- Bugfix: Speaker priority max value off by one (historic reasons)
- Bugfix: Tag click in plenary should use state filter

## 0.14.2

### Changed
- Select type of invitation before adding invites (error handling + prepares for mixed invites) [#290](https://github.com/VoteIT/voteit_frontend/issues/290)
- New API data structure for adding invitations

### Fixed
- Modifying Agenda Item or adding/removing proposals deselected proposals in Plenary View [#291](https://github.com/VoteIT/voteit_frontend/issues/291)
- Tag clicks in Plenary View selected proposals from other Agenda Items [#292](https://github.com/VoteIT/voteit_frontend/issues/292)

## 0.14.1
- Bugfix: Copy invitation user data updated to match new data structure (supports multiple types of user data)

## 0.14.0
- Add dialect support for delegating group votes [#284](https://github.com/VoteIT/voteit_frontend/issues/284)
- Rewritten, more efficient, functions for handling server time

## 0.13 (dev)
- New data structure for invites [#268](https://github.com/VoteIT/voteit_frontend/issues/268)
- Transitions in Plenary view protected from double-click [#255](https://github.com/VoteIT/voteit_frontend/issues/255)
- Enforced form rules in poll start view [#269](https://github.com/VoteIT/voteit_frontend/issues/269)
- Fix problem where invite form remained disabled when modified [#236](https://github.com/VoteIT/voteit_frontend/issues/236)

## 0.12.7
- Bugfix: Server ahead calculation based on Date header used incorrect date format and did not handle parsing errors.

## 0.12.6
- User roles and meeting groups now displayed in user menu when in meetings [#277](https://github.com/VoteIT/voteit_frontend/issues/277)
- Edit and display text body and tags for meeting groups [#273](https://github.com/VoteIT/voteit_frontend/issues/273)
- Action to purge active status for inactive users in control panel [#267](https://github.com/VoteIT/voteit_frontend/issues/267)
- Add control for workflow state to Plenary view [#257](https://github.com/VoteIT/voteit_frontend/issues/257)
- Add named speaker lists and edit spekar list names in speaker management view [#271](https://github.com/VoteIT/voteit_frontend/issues/271)
- Bugfix: All users got choice to post as all groups [#278](https://github.com/VoteIT/voteit_frontend/issues/278)

## 0.12.5
Bugfix release

- Fixed problem with locale imports and missing translation keys due to vite export method
- Implemented form validation rules for startpoll settings [#269](https://github.com/VoteIT/voteit_frontend/issues/269)
- Fixed issue where invitation form stayed disabled when modified [#236](https://github.com/VoteIT/voteit_frontend/issues/236)
- Added Loading indication to invites page [#212](https://github.com/VoteIT/voteit_frontend/issues/212)
- Protect from double-click on transitions in plenary view [#255](https://github.com/VoteIT/voteit_frontend/issues/255)

## 0.12.4
- Import and export of meeting groups [#265](https://github.com/VoteIT/voteit_frontend/issues/265)

## 0.12.3
- Simplify selection of Electoral Register [#266](https://github.com/VoteIT/voteit_frontend/issues/266)

## 0.12.2
Bugfix release

- Fixed several poll result components that broke in 0.12 release

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
