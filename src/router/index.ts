import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import JoinMeeting from '../views/JoinMeeting.vue'
import meeting from './meeting'
import plenary from '@/modules/plenary/router'
import AppBar from '@/components/AppBar.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    components: {
      default: Home,
      appBar: AppBar
    }
  },
  meeting,
  plenary,
  {
    path: '/join/:id/:slug',
    name: 'JoinMeeting',
    components: {
      default: JoinMeeting,
      appBar: AppBar
    }
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
