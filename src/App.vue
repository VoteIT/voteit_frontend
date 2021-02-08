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
import { onBeforeMount, provide } from 'vue'
import { useI18n } from 'vue-i18n'

import useAuthentication from '@/composables/useAuthentication.js'
import useLoader from '@/composables/useLoader.js'

import Alerts from '@/components/Alerts.vue'
import Loader from '@/components/Loader.vue'
import Modal from './components/modals/Modal'
import OnlineStatus from '@/components/OnlineStatus'

export default {
  components: {
    OnlineStatus,
    Loader,
    Alerts,
    Modal
  },
  setup () {
    const { t } = useI18n()
    const loader = useLoader('App')
    const { user, authenticate } = useAuthentication()

    onBeforeMount(_ => {
      if (user.value) authenticate(user.value)
      else loader.setLoaded()
    })
    provide('t', t)
  }
}
</script>

<style lang="sass">
$material-icons-font-path: '~material-icons/iconfont/'
@import '~material-icons/iconfont/material-icons.scss'

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
