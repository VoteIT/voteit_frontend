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
      name: 'pollStart',
      component: StartPoll
    },
    {
      path: 'new/:aid',
      name: 'pollStartAI',
      component: StartPoll
    },
    {
      path: ':state',
      name: 'pollState',
      component: Polls
    }
  ]
}
