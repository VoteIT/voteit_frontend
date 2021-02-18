export default [
  {
    transition: 'unpublish',
    icon: 'visibility_off',
    state: 'private',
    requiresRole: 'moderator'
  },
  {
    transition: 'upcoming',
    icon: 'pause',
    state: 'upcoming'
  },
  {
    transition: 'ongoing',
    icon: 'play_arrow',
    state: 'ongoing'
  },
  {
    transition: 'close',
    icon: 'close',
    state: 'closed'
  },
  {
    transition: 'archive',
    icon: 'archive',
    state: 'archived'
  }
]
