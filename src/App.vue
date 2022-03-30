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

#app
  min-height: 100vh

.v-btn
  text-transform: none !important
  letter-spacing: .04em !important

// Temporary Vuetify fix
// TODO Remove when v-text-input supports hide-details
// .v-input.hide-details
//   .v-input__details
//     display: none

// TODO Remove when fixed upstream
.v-dialog .v-overlay__content
  max-height: calc(100vh - 40px) !important
  .v-sheet
    overflow-y: auto !important
</style>
