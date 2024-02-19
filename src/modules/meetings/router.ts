import AgendaEditView from '../agendas/AgendaEditView.vue'
import AgendaItemView from '../agendas/AgendaItemView.vue'
import polls from '../polls/router'

import ControlPanelView from './ControlPanel.vue'
import ElectoralRegistersView from './electoralRegisters/ElectoralRegistersView.vue'
import JoinMeeting from './JoinView.vue'
import ParticipantsView from './ParticipantsView.vue'
import StartView from './StartView.vue'
import MeetingView from './MeetingView.vue'
import MinutesView from './MinutesView.vue'

export default [
  {
    path: '/m/:id/:slug',
    name: 'MeetingRouterView',
    component: MeetingView,
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
        component: ElectoralRegistersView
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
        component: AgendaItemView
      }
    ]
  },
  // Join has url outside meeting, so users don't need meeting roles to visit this view.
  {
    path: '/join/:id/:slug',
    name: 'meeting:join',
    component: JoinMeeting
  }
]
