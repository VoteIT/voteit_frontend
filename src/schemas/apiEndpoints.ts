import meetingStates from '../contentTypes/meeting/workflowStates'
import pollStates from '../contentTypes/poll/workflowStates'
import proposalStates from '../contentTypes/proposal/workflowStates'
import agendaStates from '../contentTypes/agendaItem/workflowStates'
import speakerListStates from '../contentTypes/speakerList/workflowStates'

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
  },
  // New format, like Django natural_key. TODO: Use this everywhere or nowhere.
  'poll.electoralregister': {
    uri: 'electoral-registers'
  }
}
