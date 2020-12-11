import meeting from '../views/meeting'

export default {
  path: '/m/:id/:slug',
  name: 'Meeting',
  component: meeting.Main,
  children: [
    {
      path: '',
      name: 'index',
      components: {
        main: meeting.Start
      }
    },
    {
      path: 'participants',
      name: 'participants',
      components: {
        main: meeting.Participants
      }
    },
    {
      path: 'polls',
      name: 'polls',
      components: {
        main: meeting.Polls
      }
    },
    {
      path: 'a/:aid/:aslug',
      name: 'agenda-item',
      components: {
        main: meeting.AgendaItem
      }
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      // component: () => import(/* webpackChunkName: "about" */ '../views/Meeting.vue')
    }
  ]
}
