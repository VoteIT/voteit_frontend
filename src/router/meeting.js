import Meeting from '../views/Meeting'
import AgendaItem from '@/components/meeting/AgendaItem'
import Start from '@/components/meeting/Start'

export default {
  path: '/m/:id/:slug',
  name: 'Meeting',
  component: Meeting,
  children: [
    {
      path: '',
      name: 'Index',
      components: {
        main: Start
      }
    },
    {
      path: 'a/:aid/:aslug',
      name: 'Agenda item',
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
