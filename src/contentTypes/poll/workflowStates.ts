import { MeetingRole } from '../types'

export default [
  {
    transition: 'unpublish',
    icon: 'visibility_off',
    state: 'private',
    name: 'Private',
    requiresRole: MeetingRole.Moderator
  },
  {
    transition: 'upcoming',
    icon: 'pause',
    state: 'upcoming',
    name: 'Upcoming'
  },
  {
    transition: 'ongoing',
    icon: 'how_to_vote',
    state: 'ongoing',
    name: 'Ongoing'
  },
  {
    transition: 'close',
    icon: 'gavel',
    state: 'closed',
    name: 'Closed'
  },
  {
    transition: 'finish',
    icon: 'check',
    state: 'finished',
    name: 'Finished',
    isFinal: true
  },
  {
    transition: 'cancel',
    icon: 'block',
    state: 'canceled',
    name: 'Canceled',
    isFinal: true
  },
  {
    icon: 'report',
    state: 'failed',
    name: 'Failed',
    isFinal: true
  }
]
