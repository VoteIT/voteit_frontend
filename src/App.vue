<template>
  <v-app>
    <router-view name="navigationDrawer"/>
    <SystemBar/>
    <v-main>
      <v-container>
        <router-view/>
      </v-container>
    </v-main>
    <OnlineStatus/>
    <Modal/>
    <Dialogs/>
    <Loader/>
    <Alerts/>
  </v-app>
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
import SystemBar from './components/SystemBar.vue'

export default defineComponent({
  components: {
    OnlineStatus,
    Loader,
    Alerts,
    Modal,
    Dialogs,
    SystemBar
  },
  setup () {
    const { t } = useI18n()
    const loader = useLoader('App')
    const { fetchAuthenticatedUser } = useAuthentication()

    onBeforeMount(async () => {
      // if (user.value) authenticate(user.value)
      // else loader.setLoaded()
      if (!await fetchAuthenticatedUser()) loader.setLoaded()
    })
    provide('t', t)
    provide('debug', process.env.NODE_ENV === 'development')
  }
})
/* Disabled from style below
$material-icons-font-path: '~material-icons/iconfont/'
@import '~material-icons/iconfont/material-icons.scss'
*/
</script>

<style lang="sass">
@import './theme/fonts.sass'
// @import './theme/dark.sass'
// @import './theme/light.sass'

// :root
//   @include light-theme
//  @media (prefers-color-scheme: dark)
//    @include dark-theme

*
  box-sizing: border-box

// TODO: Revisit how Vuetify should handle scroll
html,
.v-main__wrap
  overflow-y: auto !important

.v-btn
  text-transform: none !important
  letter-spacing: .04em !important

form
  > div
    margin-bottom: 1em
  label
    font-weight: bold
    font-size: 10pt
  select,
  input[type=text],
  input[type=number]
    min-height: 2em
    padding: 0 .4em
    border-bottom: rgb(var(--v-border-color))
    background-color: var(--v-theme-background)
    &:focus
      border-bottom: 1px solid rgb(var(--v-theme-on-background))
      outline: none
  select,
  input[type=text]
    width: 100%
  input[type=checkbox]
    margin-right: .4em
</style>
