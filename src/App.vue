<template>
  <v-app id="app">
    <router-view name="appBar" />
    <v-main>
      <router-view name="navigationDrawer"/>
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

import useAuthentication from './composables/useAuthentication'
import useLoader from './composables/useLoader'

import Alerts from './components/Alerts.vue'
import Dialogs from './components/Dialogs.vue'
import Loader from './components/Loader.vue'
import Modal from './components/Modal.vue'
import OnlineStatus from './components/OnlineStatus.vue'
import useOrganisations from './modules/organisations/useOrganisations'
import { useRoute, useRouter } from 'vue-router'

export default defineComponent({
  components: {
    OnlineStatus,
    Loader,
    Alerts,
    Modal,
    Dialogs
  },
  setup () {
    const loader = useLoader('App')
    const { fetchAuthenticatedUser } = useAuthentication()
    const { fetchOrganisations } = useOrganisations()
    const route = useRoute()
    const router = useRouter()

    onBeforeMount(async () => {
      try {
        const [user] = await Promise.all([
          fetchAuthenticatedUser(),
          fetchOrganisations()
        ])
        if (!user) {
          if (route.path !== '/') await router.push('/') // Reroute unauthenticated user to start page
          loader.setLoaded()
        }
      } catch {
        loader.setLoaded(false)
      }
    })
    provide('context', 'organisation') // Default context name
    provide('cols', {
      default: {
        cols: 12,
        lg: 8,
        offsetLg: 2
      }
    })
  }
})
</script>

<style lang="sass">
@import './theme/fonts.sass'

*
  box-sizing: border-box

.v-btn
  text-transform: none !important
  letter-spacing: .04em !important

.btn-controls
  display: flex
  align-items: flex-end
  > .v-btn
    margin-right: .2rem
    &:last-child
      margin-right: 0

.btn-group
  .v-btn:not(:first-child)
    border-top-left-radius: 0
    border-bottom-left-radius: 0
  .v-btn:not(:last-child)
    border-top-right-radius: 0
    border-bottom-right-radius: 0

/* Vuetify has an elusive blocked scrolling issue. This disables scroll blocking. */
html.v-overlay-scroll-blocked
  position: initial !important
  overflow-y: auto !important

@media print
  .v-main
    padding: 0 !important

  .v-row,
  .v-application__wrap,
  .v-layout
    display: block !important
</style>
