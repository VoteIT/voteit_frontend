<template>
  <div>
    <online-status/>
    <router-view/>
    <modal/>
    <loader/>
    <alerts/>
  </div>
</template>

<script>
import OnlineStatus from '@/components/OnlineStatus'
import Loader from '@/components/Loader.vue'
import Alerts from '@/components/Alerts.vue'
import Modal from './components/modals/Modal'
import useAuthentication from '@/composables/useAuthentication.js'
import useLoader from '@/composables/useLoader.js'
import { onBeforeMount } from 'vue'

export default {
  components: {
    OnlineStatus,
    Loader,
    Alerts,
    Modal
  },
  setup () {
    const loader = useLoader('App')
    const { user, authenticate } = useAuthentication()

    onBeforeMount(_ => {
      if (user.value) authenticate(user.value)
      else loader.setLoaded()
    })
  }
}
</script>

<style lang="sass">
$material-icons-font-path: '~material-icons/iconfont/'
@import '~material-icons/iconfont/material-icons.scss'
@import '~quill/dist/quill.core.css'
@import '~quill/dist/quill.bubble.css'

*
  box-sizing: border-box

body
  margin: 0

#app
  font-family: Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing: antialiased
  -moz-osx-font-smoothing: grayscale
  color: #2c3e50

#offline
  margin: -10px -10px 10px
  background-color: #000
  color: #fff

#nav
  padding: 30px

  a
    font-weight: bold
    color: #2c3e50

    &.router-link-exact-active
      color: #42b983
</style>
