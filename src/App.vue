<template>
  <v-app>
    <router-view />
    <OnlineStatus class="d-print-none" />
    <Modal />
    <Dialogs />
    <Loader />
    <Alerts />
  </v-app>
</template>

<script setup lang="ts">
import 'core-js/actual/array'
import 'resize-observer-polyfill/dist/ResizeObserver.global'

import { onBeforeMount, provide, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { RoleContextKey } from './injectionKeys'
import useAuthentication from './composables/useAuthentication'
import useLoader from './composables/useLoader'

import Alerts from './components/Alerts.vue'
import Dialogs from './components/Dialogs.vue'
import Loader from './components/Loader.vue'
import Modal from './components/Modal.vue'
import OnlineStatus from './components/OnlineStatus.vue'
import useOrganisation from './modules/organisations/useOrganisation'
import { frontendVersion } from './utils/Socket'
import { openDialogEvent } from './utils/events'

const { t } = useI18n()
const loader = useLoader('App')
const { fetchAuthenticatedUser } = useAuthentication()
const { fetchOrganisation } = useOrganisation()

onBeforeMount(async () => {
  try {
    const [user] = await Promise.all([
      fetchAuthenticatedUser(),
      fetchOrganisation()
    ])
    if (!user) loader.setLoaded()
  } catch {
    loader.setLoaded(false)
  }
})
provide(RoleContextKey, 'organisation') // Default context name
provide('cols', {
  default: {
    cols: 12,
    lg: 8,
    offsetLg: 2
  }
})

function promptVersionReload() {
  openDialogEvent.emit({
    resolve(reload) {
      if (reload) location.reload()
      else setTimeout(promptVersionReload, 30_000)
    },
    title: t('system.versionReloadQuery'),
    dismissible: false,
    no: t('system.reloadLater'),
    yes: t('system.reloadNow')
  })
  console.log('SEARCHME', import.meta.env.VITE_FRONTEND_VERSION)
}

watch(
  frontendVersion,
  (version) => {
    const clientVersion = import.meta.env.VITE_FRONTEND_VERSION
    if (!(version && clientVersion)) return
    if (version !== clientVersion) promptVersionReload()
  },
  { immediate: true }
)
</script>

<style lang="sass">
@import './theme/fonts.sass'

*
  box-sizing: border-box

.v-sheet,
.v-list
  --v-border-opacity: 1 !important

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
