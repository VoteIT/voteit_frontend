import { computed } from 'vue'

import { meetingBubblePlugins } from '../meetings/registry'

import UnvotedPollsBubble from './UnvotedPollsBubble.vue'
import usePolls from './usePolls'

const { getNextUnvotedPoll } = usePolls()

meetingBubblePlugins.register({
  component: UnvotedPollsBubble,
  icon: 'mdi-vote',
  id: 'unvotedPolls',
  order: 0,
  requireAttention: computed(() => true),
  checkActive(meeting) {
    return !!getNextUnvotedPoll(meeting.pk)
  }
})
