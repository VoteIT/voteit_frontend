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

    onBeforeMount(async () => {
      try {
        const [user] = await Promise.all([
          fetchAuthenticatedUser(),
          fetchOrganisations()
        ])
        if (!user) loader.setLoaded()
      } catch {
        loader.setLoaded(false)
      }
    })
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

// Temporary Vuetify fix
// TODO Remove when v-text-input supports hide-details
.v-input.hide-details
  .v-input__details
    display: none
</style>
