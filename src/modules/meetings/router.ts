import AgendaItemView from '@/modules/agendas/AgendaItemView.vue'
import navigationDrawer from '@/modules/meetings/NavigationDrawer.vue'
import appBar from './AppBar.vue'
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
      path: 'p',
      name: 'participants',
      component: ParticipantsView
    },
    {
      path: 'p/:tabId',
      name: 'participantsTab',
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
    }
  ]
}
