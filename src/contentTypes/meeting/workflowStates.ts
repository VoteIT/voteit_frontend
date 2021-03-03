export enum MeetingState {
  Upcoming = 'upcoming',
  Ongoing = 'ongoing',
  Closed = 'closed',
  Archiving = 'archiving',
  Archived = 'archived'
}

export default [
  {
    transition: 'upcoming',
    icon: 'pause',
    state: MeetingState.Upcoming,
    name: 'Upcoming'
  },
  {
    transition: 'ongoing',
    icon: 'play_arrow',
    state: MeetingState.Ongoing,
    name: 'Ongoing'
  },
  {
    transition: 'close',
    icon: 'close',
    state: MeetingState.Closed,
    name: 'Upcoming'
  },
  {
    transition: 'request_archiving',
    icon: 'archive',
    state: MeetingState.Archiving,
    name: 'Archiving',
    isFinal: true
  },
  {
    transition: 'archive',
    icon: 'archive',
    state: MeetingState.Archived,
    name: 'Archived',
    isFinal: true
  }
]
