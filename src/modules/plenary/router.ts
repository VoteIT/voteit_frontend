import router from '@/router'

import { agendaItemRequirement } from '../agendas/requirements'
import { meetingRequirement } from '../meetings/requirements'
import { roomRequirement } from '../rooms/requirements'

import Plenary from './Plenary.vue'

router.addRoute({
  path: '/cast/:id/:roomId/:aid/:tab?',
  name: 'room:broadcast',
  component: Plenary,
  // Not nested under MeetingRouterView, so it asks for the meeting itself
  meta: { load: [meetingRequirement, roomRequirement, agendaItemRequirement] },
  beforeEnter(to) {
    if (!to.params.tab) {
      return {
        ...to,
        params: {
          ...to.params,
          tab: localStorage.getItem('plenary:viewMode') ?? 'decisions'
        }
      }
    }
  }
})
