import meetingStates from '../workflows/meetingStates.js'
import pollStates from '../workflows/pollStates.js'
import proposalStates from '../workflows/proposalStates.json'
import agendaStates from '../workflows/agendaStates.json'
import speakerListStates from '../workflows/speakerListStates.js'

export default {
  dev_login: {
    uri: 'dev-login'
  },
  poll: {
    uri: 'polls',
    states: pollStates
  },
  discussion_post: {
    uri: 'discussion-posts'
  },
  agenda_item: {
    uri: 'agenda-items',
    states: agendaStates
  },
  meeting: {
    uri: 'meetings',
    states: meetingStates
  },
  proposal: {
    uri: 'proposals',
    states: proposalStates
  },
  speaker_list: {
    uri: 'speaker-lists',
    states: speakerListStates
  },
  meeting_roles: {
    uri: 'meeting-roles'
  },
  access_policy: {
    uri: 'access-policies'
  }
}
