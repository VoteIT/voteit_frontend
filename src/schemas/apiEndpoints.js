import meetingStates from './meetingStates.js'
import pollStates from './pollStates.js'
import proposalStates from './proposalStates.json'
import agendaStates from './agendaStates.json'
import speakerListStates from './speakerListStates.js'

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
