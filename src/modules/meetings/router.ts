import AgendaItemView from '@/modules/agendas/AgendaItemView.vue'
import navigationDrawer from '@/modules/agendas/NavigationDrawer.vue'
import appBar from '@/components/AppBar.vue'
import polls from '@/modules/polls/router'
import speakerLists from '@/modules/speakerLists/router'

import StartView from './StartView.vue'
import ParticipantsView from './ParticipantsView.vue'
import MeetingView from './MeetingView.vue'
import ControlPanelView from '@/views/meeting/ControlPanel.vue'

export default {
  path: '/m/:id/:slug',
  name: 'Meeting',
  components: {
    default: MeetingView,
    navigationDrawer,
    appBar
  },
  children: [
    {
      path: '',
      name: 'index',
      component: StartView
    },
    speakerLists,
    {
      path: 'settings',
      name: 'settings',
      component: ControlPanelView,
      children: [{
        path: ':panel',
        name: 'settings-tab',
        component: ControlPanelView
      }]
    },
    {
      path: 'participants',
      name: 'participants',
      component: ParticipantsView
    },
    polls,
    {
      path: 'a/:aid/:aslug',
      name: 'agenda-item',
      component: AgendaItemView
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      // component: () => import(/* webpackChunkName: "about" */ '../views/Meeting.vue')
    }
  ]
}
