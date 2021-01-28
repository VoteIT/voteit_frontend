import pollStates from './pollStates.js'
import proposalStates from './proposalStates.json'
import agendaStates from './agendaStates.json'
import speakerListStates from './speakerListStates.js'

export default {
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
    uri: 'meetings'
  },
  proposal: {
    uri: 'proposals',
    states: proposalStates
  },
  speaker_list: {
    uri: 'speaker-lists',
    states: speakerListStates
  }
}
