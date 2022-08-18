import AgendaItemView from '@/modules/agendas/AgendaItemView.vue'
import navigationDrawer from '@/modules/meetings/NavigationDrawer.vue'
import appBar from '@/components/AppBar.vue'
import polls from '@/modules/polls/router'
import speakerLists from '@/modules/speakerLists/router'

import StartView from './StartView.vue'
import ParticipantsView from './ParticipantsView.vue'
import ElectoralRegistersView from './electoralRegisters/ElectoralRegistersView.vue'
import MinutesView from './MinutesView.vue'
import MeetingView from './MeetingView.vue'
import ControlPanelView from '@/modules/meetings/ControlPanel.vue'

export default {
  path: '/m/:id/:slug',
  name: 'Meeting',
  components: {
    default: MeetingView,
    navigationDrawer,
    appBar
  },
  props: {
    default: (route: any) => ({ meetingId: Number(route.params.id) }),
    navigationDrawer: false,
    appBar: false
  },
  children: [
    {
      path: '',
      name: 'meeting',
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
    {
      path: 'er',
      name: 'electoral-registers',
      component: ElectoralRegistersView
    },
    {
      path: 'minutes',
      name: 'meeting-minutes',
      component: MinutesView
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
