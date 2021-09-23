import { RouterView } from 'vue-router'

import Poll from './PollView.vue'
import Polls from './PollsView.vue'
import StartPoll from './StartPollView.vue'

export default {
  path: 'polls',
  component: RouterView,
  children: [
    {
      path: '',
      name: 'polls',
      component: Polls
    },
    {
      path: ':pid/:pslug',
      name: 'poll',
      component: Poll
    },
    {
      path: 'new',
      name: 'start-poll',
      component: StartPoll
    },
    {
      path: 'new/:aid',
      name: 'start-poll-ai',
      component: StartPoll
    },
    {
      path: ':state',
      name: 'poll-state',
      component: Polls
    }
  ]
}
