import { RouterView } from 'vue-router'
import meeting from '@/views/meeting'
import Agenda from '@/components/meeting/Agenda.vue'

export default {
  path: '/m/:id/:slug',
  name: 'Meeting',
  components: {
    default: meeting.Meeting,
    navigationDrawer: Agenda
  },
  children: [
    {
      path: '',
      name: 'index',
      component: meeting.Start
    },
    {
      path: 'lists/:system/:aid',
      name: 'spakerLists',
      component: meeting.SpeakerLists
    },
    {
      path: 'settings',
      name: 'settings',
      component: meeting.ControlPanel,
      children: [{
        path: ':panel',
        name: 'settings-tab',
        component: meeting.ControlPanel
      }]
    },
    {
      path: 'participants',
      name: 'participants',
      component: meeting.Participants
    },
    {
      path: 'polls',
      component: RouterView,
      children: [
        {
          path: '',
          name: 'polls',
          component: meeting.Polls
        },
        {
          path: ':pid/:pslug',
          name: 'poll',
          component: meeting.Poll
        },
        {
          path: 'new',
          name: 'start-poll',
          component: meeting.StartPoll
        },
        {
          path: 'new/:aid',
          name: 'start-poll-ai',
          component: meeting.StartPoll
        },
        {
          path: ':state',
          name: 'poll-state',
          component: meeting.Polls
        }
      ]
    },
    {
      path: 'a/:aid/:aslug',
      name: 'agenda-item',
      component: meeting.AgendaItem
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      // component: () => import(/* webpackChunkName: "about" */ '../views/Meeting.vue')
    }
  ]
}
