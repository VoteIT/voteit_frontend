# Changelog

Document notable changes here.

Version format is `major`.`minor`.`patch`. Until major version 1 is realeased, API changes accours on minor version bumps, but never on patch version bumps.

## 0.29.1 (2025-01-23)

- Allow displaying full proposal text on diff proposals

## 0.29.0 (2024-12-16)

- Use bulk change/delete messages in agenda edit

## 0.26.12 (2024-11-08)

- Allow starting repeated Schulze poll with 2 proposals+deny
- Bugfix: Keyboard nav in plenary view disabled input fields in modals

## 0.26.11 (2024-11-07)

- Some richtext editor issues resolved

## 0.26.10 (2024-11-04)

- Bugfix: menu crashed for agenda item title w/o latin chars (slugify)
- Bugfix: Hidden result dialog had double close buttons

## 0.26.9 (2024-10-17)

- Minor bugfixes regarding Richtext editing

## 0.26.8 (2024-10-16)

- Plenary keyboard navigation exceptions (on keymod or when target is in overlay or .no-keynav)
- Meeting minutes now defaults to showing only approved proposals
- Dependecy updates (npm audit fixes)
- Bugfix: Richtext editor allowed empty tags

## 0.26.7 (2024-10-07)

- Left and right separately scrolled in real-time view
- Ask participants to confirm setting as non-active in meeting
- Ask in real-time view if user is active in meeting

## 0.26.6 (2024-09-17)

- Bugfix: Electoral register fetch rewritten to avoid self-DDOS when starting polls

## 0.26.5 (2024-08-27)

- Fix: Poll body HTML was incorrectly rendered

## 0.26.4 (2024-06-05)

- Author user names were not displayed in MinutesView

## 0.26.3 (2024-04-22)

- Update html lang attribute dynamically to reflect selected locale
- Safari UI fixes for menu

## 0.26.2 (2024-04-02)

- Manual Electoral Register weight input fixed (min-width)
- User count added to name column in role matrix
- Replace buttons with switches in group tab and room control panel

## 0.26.1 (2024-03-25)

- Bugfix: Could not show invite annotations
- Hide proposal dropdown menu if no actions available

## 0.26.0 (2024-03-11)

- Drop presence check component

## 0.25.2 (2024-03-06)

- Bugfix: Text size selection in real-time view now changes size of all proposal text. [#357](https://github.com/VoteIT/voteit_frontend/issues/357)
- Proposal highlighting in real-time view improved. [#358](https://github.com/VoteIT/voteit_frontend/issues/358)
- Bugfix: Make all text ordering case insensitive.

## 0.25.1 (2024-03-05)

- Agenda order moved to modal, to fix upwards scrolling bug. [#353](https://github.com/VoteIT/voteit_frontend/issues/353)
- Long poll titles now breaks line in real-time voting modal. [#354](https://github.com/VoteIT/voteit_frontend/issues/354)
- User can now expand to show all closed polls in real-time voting modal. [#355](https://github.com/VoteIT/voteit_frontend/issues/355)
- Login button disabled if organization is not active. [#356](https://github.com/VoteIT/voteit_frontend/issues/356)

## 0.25.0 (2024-03-04)

Entering speaker list and voting in real-time view.

- Users can now enter and leave currently active speaker list in real-time view.
- New _projector mode_ in real-time view to disable interaction (enter/leave sl and voting) and follow broadcast completely.
- Moderators will get an option to activate _projector mode_ when entering real-time view.
- New poll modal in real-time view that allows voting and looking at results. Opens autmatically when a poll is broadcasted.
- Poll statuses (progress) are now sent to all on meeting channel. Follow voting-buttons removed.
- Broadcast view shows ongoing polls progress in menu.
- New feature in broadcast- and real-time views to send selection of text and highlight proposals.

## 0.24.1 (2024-02-29)

- Fix new bug in 0.24, when posting multiple proposals

## 0.24.0 (2024-02-29)

Updates to group posting and group display on speakers.

- Toggles for post_as and show_on_speaker in group list [#349](https://github.com/VoteIT/voteit_frontend/issues/349) [#350](https://github.com/VoteIT/voteit_frontend/issues/350)
- Display group membership(s) on members in speaker lists [#351](https://github.com/VoteIT/voteit_frontend/issues/351)
- Users can now choose to post as themselves, as member of any group they're member in, or as group [#352](https://github.com/VoteIT/voteit_frontend/issues/352)
- Proposal edit modal no longer persistent, unless proposal is actively being edited.

## 0.23.1 (2024-02-22)

- Bug fix: Show correct values in groups "in current ER" count [#348](https://github.com/VoteIT/voteit_frontend/issues/348)

## 0.23.0 (2024-02-21)

- Add "other tags" to empty broadcast/decisions view
- Display alert for org managers on organisation home if contact information required check
- Copy join link now uses link to join page
- Allow deleting rooms with no speakers on any of it's speaker lists. (Backend does check)
- Bugfix: Add back AppBar to join view
- Bugfix: Meeting NavigationDrawer should open active menus automatically
- Bugfix: Could not add speaker configuration after initially creating room

## 0.22.2 (2024-02-13)

- Bugfix in broadcast view: When selecting approved proposals, they were not selected in broadcast view

## 0.22.1 (2024-02-12)

- Fix problems with creation and deletion of room/speaker settings

## 0.22.0 (2024-02-12)

Introducing VoteIT real-time view.  
Information in swedish: [Project info](https://voteit.se/nyheter/realtidsvy-detta-ar-nytt.html) - [What's new](https://voteit.se/nyheter/realtidsvy-detta-ar-nytt.html)

- Adds meeting rooms, which also configures it's own speaker system.
- Plenary view and speaker handling now moved to broadcasting view.
- Broadcasting / decisions gives useful information and offers actions to move forward.
- Real-time view allows following meeting in real-time, allowing simultaneous display of active speaker list and broadcasted proposals.
- Start meeting is now a guide with multiple steps.
- Multiple updates to dependencies, including Vue and Vuetify.

## 0.21.0 (2023-11-27)

- Allow setting min/max ranked proposals in repeated IRV [#335](https://github.com/VoteIT/voteit_frontend/issues/335)
- Select all proposal states when filtering on tag in Agenda Item view [#336](https://github.com/VoteIT/voteit_frontend/issues/336)
- Display exact time on hover when showing relative times or dates (Moment.vue)

## 0.20.3 (2023-11-17)

- Use tag filters also in plenary view
- Display winning proposal before breakdown in schulze result

## 0.20.2 (2023-11-09)

- Fix bug for adding or replacing voter column in participant list.

## 0.20.1 (2023-11-08)

- Fix mistake with double participant role in ordered list

## 0.20.0 (2023-11-07)

- Role refactoring changes (name changes of meeting roles)
- Font switch (Noto Sans) to fix spacing problem with quotation marks

## 0.19.0 (2023-10-25)

- Support polls with withheld result [#330](https://github.com/VoteIT/voteit_frontend/issues/330)
- Add delete button to RoleMatrix and hide participant role in participant list [#329](https://github.com/VoteIT/voteit_frontend/issues/329)

## 0.18.1 (2023-10-18)

- Rection button updates (clearer if user interacted)
- Handle user invalidated message from backend [#327](https://github.com/VoteIT/voteit_frontend/issues/327)
- Handle frontend_version message from backend [#197](https://github.com/VoteIT/voteit_frontend/issues/197)

## 0.18.0 (2023-10-09)

- WebSocket / Envelope integration rewritten, using `envelope-client` library.
- Added flag button in reaction buttons [#324](https://github.com/VoteIT/voteit_frontend/issues/324)
- Reaction buttons can now be displayed in polls and on plenary view
- Reaction buttons can now be used as vote templates in applicable methods
- Reaction buttons can now only be modified or interacted with in upcoming or open meetings
- Improved permission handling when loading meeting user has no access to [#321](https://github.com/VoteIT/voteit_frontend/issues/321)
- Agenda display mode dropped from AgendaItemView [#323](https://github.com/VoteIT/voteit_frontend/issues/323)
- Show generic VoteIT information if domain has no organisation [#320](https://github.com/VoteIT/voteit_frontend/issues/320)
- Reply function for discussion posts [#304](https://github.com/VoteIT/voteit_frontend/issues/304)
- Simple keyboard navigation in speaker management [#322](https://github.com/VoteIT/voteit_frontend/issues/322)
- Translation refactoring, allowing correct function of extractLocales, correct workflow names based on context and easier pluralization. [#325](https://github.com/VoteIT/voteit_frontend/issues/325)
- Fix null issue when clearing search in invite filter [#297](https://github.com/VoteIT/voteit_frontend/issues/297)
- Fix null issue when clearing dialect or er method blocked meeting creation

## 0.17.3 (2023-09-07)

- Add simple keyboard navigation to Plenary view

## 0.17.2 (2023-09-04)

- Fix Repeated Schulze creation form [#221](https://github.com/VoteIT/voteit_frontend/issues/221)
- Always fetch available transitions when opening workflow menu [#316](https://github.com/VoteIT/voteit_frontend/issues/316)

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
