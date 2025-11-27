<script lang="ts" setup>
import { shallowRef } from 'vue'
import { useDisplay } from 'vuetify'

import { toggleNavDrawerEvent } from '@/utils/events'
import MenuLevel from '@/components/MenuLevel.vue'
import useLoader from '@/composables/useLoader'

import ComponentSlot from './ComponentSlot.vue'
import PollMenu from './menus/PollMenu.vue'
import AgendaMenu from './menus/AgendaMenu.vue'
import MeetingMenu from './menus/MeetingMenu.vue'

const { mobile } = useDisplay()
const { initDone } = useLoader('Agenda')

const isOpen = shallowRef(!mobile.value)
function toggleDrawer() {
  if (mobile.value) isOpen.value = !isOpen.value
}
toggleNavDrawerEvent.on(toggleDrawer)
</script>

<template>
  <v-navigation-drawer
    app
    id="meeting-navigation"
    v-model="isOpen"
    width="348"
    class="d-print-none"
  >
    <MenuLevel v-if="initDone">
      <MeetingMenu />
      <PollMenu />
      <AgendaMenu />
    </MenuLevel>
    <template #append>
      <ComponentSlot name="appendMenu" />
    </template>
  </v-navigation-drawer>
</template>

<style lang="sass">
#meeting-navigation
  background-color: rgb(var(--v-theme-app-bar))
  color: rgb(var(--v-theme-on-app-bar))

  .v-chip--selected
    background-color: rgb(var(--v-theme-app-bar-active))
    .v-chip__overlay
       opacity: 0
</style>
