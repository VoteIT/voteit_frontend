<template>
  <div>
    <online-status/>
    <router-view/>
    <modal/>
    <dialogs/>
    <loader/>
    <alerts/>
  </div>
</template>

<script lang="ts">
import { defineComponent, onBeforeMount, provide } from 'vue'
import { useI18n } from 'vue-i18n'

import useAuthentication from './composables/useAuthentication'
import useLoader from './composables/useLoader'

import Alerts from './components/Alerts.vue'
import Dialogs from './components/Dialogs.vue'
import Loader from './components/Loader.vue'
import Modal from './components/modals/Modal.vue'
import OnlineStatus from './components/OnlineStatus.vue'

export default defineComponent({
  components: {
    OnlineStatus,
    Loader,
    Alerts,
    Modal,
    Dialogs
  },
  setup () {
    const { t } = useI18n()
    const loader = useLoader('App')
    const { user, authenticate } = useAuthentication()

    onBeforeMount(() => {
      if (user.value) authenticate(user.value)
      else loader.setLoaded()
    })
    provide('t', t)
    provide('debug', process.env.NODE_ENV === 'development')
  }
})
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
