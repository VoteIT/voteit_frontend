import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import JoinMeeting from '../views/JoinMeeting.vue'
import meeting from './meeting'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  meeting,
  {
    path: '/join/:id/:slug',
    name: 'JoinMeeting',
    component: JoinMeeting
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
