import Meeting from '../views/Meeting'
import AgendaItem from '@/components/meeting/AgendaItem'
import Participants from '@/components/meeting/Participants'
import Start from '@/components/meeting/Start'

export default {
  path: '/m/:id/:slug',
  name: 'Meeting',
  component: Meeting,
  children: [
    {
      path: '',
      name: 'index',
      components: {
        main: Start
      }
    },
    {
      path: 'participants',
      name: 'participants',
      components: {
        main: Participants
      }
    },
    {
      path: 'a/:aid/:aslug',
      name: 'agenda-item',
      components: {
        main: AgendaItem
      }
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      // component: () => import(/* webpackChunkName: "about" */ '../views/Meeting.vue')
    }
  ]
}
