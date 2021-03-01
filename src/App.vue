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
@import './theme/dark.sass'
@import './theme/light.sass'

:root
  @include light-theme
  @media (prefers-color-scheme: dark)
    @include dark-theme

*
  box-sizing: border-box

body
  margin: 0
  background-color: var(--bg)
  color: var(--text)

a
  color: var(--link)
  &:active
    color: var(--link-active)

#app
  font-family: Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing: antialiased
  -moz-osx-font-smoothing: grayscale

#offline
  margin: -10px -10px 10px
  background-color: var(--inverted-bg)
  color: var(--inverted-text)
</style>
