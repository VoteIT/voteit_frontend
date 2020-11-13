import Meeting from '../views/Meeting'

export default {
  path: '/m/:id/:slug',
  name: 'Meeting',
  component: Meeting,
  children: [
    {
      path: '/m/:id/:slug/yada',
      name: 'About',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ '../views/Meeting.vue')
    }
  ]
}
