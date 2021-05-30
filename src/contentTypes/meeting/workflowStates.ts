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
    state: MeetingState.Upcoming
  },
  {
    transition: 'ongoing',
    icon: 'mdi-play',
    state: MeetingState.Ongoing
  },
  {
    transition: 'close',
    icon: 'mdi-close',
    state: MeetingState.Closed
  },
  {
    transition: 'request_archiving',
    icon: 'mdi-archive',
    state: MeetingState.Archiving,
    isFinal: true
  },
  {
    transition: 'archive',
    icon: 'mdi-archive',
    state: MeetingState.Archived,
    isFinal: true
  }
]
