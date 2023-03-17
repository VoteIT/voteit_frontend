<template>
  <MeetingToolbar>
    <v-breadcrumbs v-if="breadcrumbs" :items="breadcrumbs" />
    <v-toolbar-title v-else>
      {{ t('meeting.controlPanel') }}
    </v-toolbar-title>
  </MeetingToolbar>
  <v-row id="setting-panels">
    <v-col v-if="currentComponent">
      <component :is="currentComponent"/>
    </v-col>
    <v-col class="grid" v-else>
      <v-card
        v-for="{ icon, id, description, disabled, title, to, quickComponent } in panelPlugins"
        class="d-flex flex-column"
        :disabled="disabled"
        :key="id"
        :to="to"
      >
        <v-card-title class="d-flex">
          <v-icon sm :icon="icon" class="mr-2" />
          <span class="flex-grow-1 text-truncate">
            {{ title }}
          </span>
          <v-icon icon="mdi-chevron-right" v-if="to" />
        </v-card-title>
        <component v-if="quickComponent" :is="quickComponent" />
        <v-card-text v-if="description">
          {{ description }}
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { sortBy } from 'lodash'
import { computed, onBeforeMount, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import useLoader from '@/composables/useLoader'
import usePermission from '@/composables/usePermission'

import { meetingSettingsPlugins } from './registry'
import MeetingToolbar from './MeetingToolbar.vue'
import useMeeting from './useMeeting'
import useMeetingTitle from './useMeetingTitle'
import useComponentApi from './useComponentApi'

import './controlPanels'
import type { Meeting } from './types'

const { t } = useI18n()
const route = useRoute()
const { isModerator, meeting, meetingId, getMeetingRoute } = useMeeting()

useMeetingTitle(t('settings'))
usePermission(isModerator, { to: computed(() => getMeetingRoute('meeting')) })
const { fetchComponents, clearComponents } = useComponentApi(meetingId)
const loader = useLoader('ControlPanel')

onBeforeMount(() => {
  loader.call(fetchComponents)
})
onUnmounted(clearComponents)

const panelPlugins = computed(() => {
  if (!meeting.value) return []
  return sortBy(meetingSettingsPlugins
    .getActivePlugins(meeting.value)
    .map(panel => {
      return {
        description: panel.getDescription && panel.getDescription(t),
        disabled: !!panel.isDisabled?.(meeting.value as Meeting),
        title: panel.getTitle(t),
        to: panel.route
          ? getMeetingRoute(panel.route.name, panel.route.params)
          : panel.component
            ? getMeetingRoute('controlPanel', { panel: panel.id })
            : undefined,
        ...panel
      }
    }), 'title')
})
const currentPanel = computed(() => route.params.panel as string | undefined)
const currentPlugin = computed(() => currentPanel.value ? meetingSettingsPlugins.getPlugin(currentPanel.value) : undefined)
const currentComponent = computed(() => currentPlugin.value?.component)

const breadcrumbs = computed(() => {
  if (!currentPlugin.value) return
  return [{
    text: t('meeting.controlPanel'),
    to: getMeetingRoute('settings')
  },
  {
    text: currentPlugin.value.getTitle(t),
    to: getMeetingRoute('controlPanel', { panel: currentPlugin.value.id })
  }]
})
</script>

<style lang="sass" scoped>
@import vuetify/lib/styles/tools/display

#setting-panels
  a
    text-decoration: none

.grid
  display: grid
  width: 100%
  gap: 1rem
  grid-template-columns: repeat(var(--cols, 1), 1fr)
  +media-breakpoint-up(sm)
    --cols: 2
  +media-breakpoint-up(lg)
    --cols: 3
  +media-breakpoint-up(xl)
    --cols: 4
</style>
