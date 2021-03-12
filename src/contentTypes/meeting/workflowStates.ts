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
    icon: 'mdi-pause',
    state: MeetingState.Upcoming,
    name: 'Upcoming'
  },
  {
    transition: 'ongoing',
    icon: 'mdi-play',
    state: MeetingState.Ongoing,
    name: 'Ongoing'
  },
  {
    transition: 'close',
    icon: 'mdi-close',
    state: MeetingState.Closed,
    name: 'Upcoming'
  },
  {
    transition: 'request_archiving',
    icon: 'mdi-archive',
    state: MeetingState.Archiving,
    name: 'Archiving',
    isFinal: true
  },
  {
    transition: 'archive',
    icon: 'mdi-archive',
    state: MeetingState.Archived,
    name: 'Archived',
    isFinal: true
  }
]
