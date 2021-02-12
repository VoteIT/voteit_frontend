export default [
  {
    transition: 'upcoming',
    icon: 'pause',
    state: 'upcoming',
    name: 'Upcoming'
  },
  {
    transition: 'ongoing',
    icon: 'play_arrow',
    state: 'ongoing',
    name: 'Ongoing'
  },
  {
    transition: 'close',
    icon: 'close',
    state: 'closed',
    name: 'Upcoming'
  },
  {
    transition: 'request_archiving',
    icon: 'archive',
    state: 'archiving',
    name: 'Archiving',
    isFinal: true
  },
  {
    transition: 'archive',
    icon: 'archive',
    state: 'archived',
    name: 'Archived',
    isFinal: true
  }
]
