import { computed } from 'vue'

import { meetingBubblePlugins } from '../meetings/registry'

import UnvotedPollsBubble from './UnvotedPollsBubble.vue'
import usePollStore from './usePollStore'

meetingBubblePlugins.register({
  component: UnvotedPollsBubble,
  icon: 'mdi-vote',
  id: 'unvotedPolls',
  order: 0,
  requireAttention: true,
  checkActive(meeting) {
    return !!usePollStore().getNextUnvotedPoll(meeting.pk)
  }
})
