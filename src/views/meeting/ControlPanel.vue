<template>
  <div>
    <h1>{{ t('meeting.settingsFor', meeting) }}</h1>
    <nav class="tabs">
      <RouterLink v-for="p in panels" :key="p.name" :to="`${meetingPath}/settings/${p.path}`">
        <Icon c-if="p.icon" sm :name="p.icon"/>
        {{ p.name }}
      </RouterLink>
    </nav>
    <div v-for="p in panels" :key="p.name">
      <component ref="panelComponents" :is="p" v-if="currentPanel === p.path"/>
    </div>
    <p v-if="!currentPanel">Select a tab... <Icon>arrow_upward</Icon></p>
  </div>
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
    const currentPanel = computed(() => route.params.panel)
    return {
      meeting,
      meetingPath,
      panels,
      currentPanel
    }
  }
})
</script>

<style lang="sass" scoped>
nav.tabs
  display: flex
  margin-top: 20px
  border-bottom: 1px solid #bbb
  padding-bottom: 0
  a
    text-decoration: none
    margin: 0 5px -1px
    padding: 8px 12px
    border: 1px solid #000
    border-bottom: 0
    border-radius: 4px 4px 0 0
    background-color: #333
    font-weight: 700
    color: #ddf
    > span
      vertical-align: super
      font-size: 80%
    .material-icons
      color: #779
      vertical-align: text-bottom
    &.router-link-exact-active
      background-color: #fff
      color: #000
      border-color: #bbb
</style>
