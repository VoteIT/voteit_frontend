import meeting from '../views/meeting'

export default {
  path: '/m/:id/:slug',
  name: 'Meeting',
  component: meeting.Meeting,
  children: [
    {
      path: '',
      name: 'index',
      component: meeting.Start
    },
    {
      path: 'participants',
      name: 'participants',
      component: meeting.Participants
    },
    {
      path: 'polls',
      name: 'polls',
      component: meeting.Polls
    },
    {
      path: 'polls/new',
      name: 'start-poll',
      component: meeting.StartPoll
    },
    {
      path: 'polls/new/:aid',
      name: 'start-poll-ai',
      component: meeting.StartPoll
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
