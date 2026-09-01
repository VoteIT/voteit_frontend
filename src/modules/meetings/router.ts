import router from '@/router'

import { agendaItemRequirement } from '../agendas/requirements'
import AgendaEditView from '../agendas/AgendaEditView.vue'
import AgendaItemView from '../agendas/AgendaItemView.vue'
import polls from '../polls/router'

import ControlPanelView from './ControlPanelView.vue'
import ElectoralRegistersView from './electoralRegisters/ElectoralRegistersView.vue'
import JoinMeeting from './JoinView.vue'
import ParticipantsView from './ParticipantsView.vue'
import StartView from './StartView.vue'
import MeetingView from './MeetingView.vue'
import MinutesView from './MinutesView.vue'
import { electoralRegisterRequirement } from './electoralRegisters/requirements'
import { meetingRequirement } from './requirements'

router.addRoute({
  path: '/m/:id/:slug',
  name: 'MeetingRouterView',
  component: MeetingView,
  // Everything below lives inside the meeting, so the meeting and its channel
  // are loaded once here rather than by each of them
  meta: { load: meetingRequirement },
  children: [
    {
      path: '',
      name: 'meeting',
      component: StartView
    },
    {
      path: 'settings',
      name: 'settings',
      component: ControlPanelView,
      children: [
        {
          path: ':panel',
          name: 'controlPanel',
          component: ControlPanelView
        }
      ]
    },
    {
      path: 'agenda',
      name: 'agendaEdit',
      component: AgendaEditView
    },
    {
      path: 'p',
      name: 'participants',
      component: ParticipantsView,
      children: [
        {
          path: ':tabId',
          name: 'participantsTab',
          component: ParticipantsView
        }
      ]
    },
    {
      path: 'er',
      name: 'electoralRegisters',
      component: ElectoralRegistersView,
      meta: { load: electoralRegisterRequirement }
    },
    {
      path: 'minutes',
      name: 'meetingMinutes',
      component: MinutesView
    },
    polls,
    {
      path: 'a/:aid/:aslug',
      name: 'agendaItem',
      component: AgendaItemView,
      meta: { load: agendaItemRequirement }
    }
  ]
})

// Join has url outside meeting, so users don't need meeting roles to visit this view.
router.addRoute({
  component: JoinMeeting,
  name: 'meeting:join',
  path: '/join/:id/:slug'
})
