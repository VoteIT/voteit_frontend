<template>
  <v-row>
    <v-col>
      <header>
        <h1>{{ t('meeting.settings.for', meeting) }}</h1>
        <v-btn color="primary" v-if="currentComponent" prepend-icon="mdi-chevron-left" @click="$router.push(`${meetingPath}/settings`)">
          {{ t('meeting.settings.all') }}
        </v-btn>
      </header>
    </v-col>
  </v-row>
  <v-row id="setting-panels">
    <v-col v-if="currentComponent">
      <component :is="currentComponent"/>
    </v-col>
    <v-col v-else v-for="p in panels" :key="p.name" sm="6" md="4" lg="3" cols="12">
      <router-link :to="`${meetingPath}/settings/${p.path}`">
        <v-sheet color="surface" elevation="2" rounded outlined class="panel">
          <v-icon v-if="p.icon" sm :icon="p.icon"/>
          {{ p.name }}
        </v-sheet>
      </router-link>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useRoute } from 'vue-router'

import useMeeting from '@/composables/meeting/useMeeting'

import controlPanels from './controlPanels'

export default defineComponent({
  name: 'ControlPanel',
  inject: ['t'],
  setup () {
    const route = useRoute()
    const { meeting, meetingPath } = useMeeting()
    const panels = computed(() => {
      return Object.values(controlPanels)
    })
    const currentPanel = computed(() => route.params.panel as string)
    const currentComponent = computed(() => Object.values(controlPanels).find(p => p.path === route.params.panel))
    return {
      meeting,
      meetingPath,
      panels,
      currentPanel,
      currentComponent
    }
  }
})
</script>

<style lang="sass">
#setting-panels
  a
    text-decoration: none
  .panel
    padding: 1em
    transition: transform .5s
    &:hover
      transform: scale(1.03)
</style>
