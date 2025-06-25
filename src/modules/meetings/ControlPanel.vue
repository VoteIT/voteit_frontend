<template>
  <MeetingToolbar>
    <v-breadcrumbs v-if="breadcrumbs" :items="breadcrumbs" />
    <v-toolbar-title v-else>
      {{ $t('meeting.controlPanel') }}
    </v-toolbar-title>
  </MeetingToolbar>
  <v-row id="setting-panels">
    <v-col v-if="currentComponent">
      <component :is="currentComponent" />
    </v-col>
    <v-col class="grid" v-else>
      <v-card
        v-for="{
          icon,
          id,
          description,
          disabled,
          title,
          to,
          quickComponent
        } in panelPlugins"
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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { titleSorter } from '@/utils'
import usePermission from '@/composables/usePermission'

import { meetingSettingsPlugins } from './registry'
import MeetingToolbar from './MeetingToolbar.vue'
import useMeeting from './useMeeting'
import useMeetingTitle from './useMeetingTitle'
import './controlPanels'
import type { Meeting } from './types'

const { t } = useI18n()
const route = useRoute()
const { isModerator, meeting, getMeetingRoute } = useMeeting()

useMeetingTitle(t('settings'))
usePermission(isModerator, { to: computed(() => getMeetingRoute('meeting')) })

const panelPlugins = computed(() => {
  if (!meeting.value) return []
  return sortBy(
    meetingSettingsPlugins.getActivePlugins(meeting.value).map((panel) => {
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
    }),
    titleSorter
  )
})
const currentPanel = computed(() => route.params.panel as string | undefined)
const currentPlugin = computed(() =>
  currentPanel.value
    ? meetingSettingsPlugins.getPlugin(currentPanel.value)
    : undefined
)
const currentComponent = computed(() => currentPlugin.value?.component)

const breadcrumbs = computed(() => {
  if (!currentPlugin.value) return
  return [
    {
      title: t('meeting.controlPanel'),
      to: getMeetingRoute('settings')
    },
    {
      title: currentPlugin.value.getTitle(t),
      to: getMeetingRoute('controlPanel', { panel: currentPlugin.value.id })
    }
  ]
})
</script>

<style lang="sass" scoped>
@use 'vuetify/lib/styles/tools/display'

#setting-panels
  a
    text-decoration: none

.grid
  display: grid
  width: 100%
  gap: 1rem
  grid-template-columns: repeat(var(--cols, 1), 1fr)
  +display.media-breakpoint-up(sm)
    --cols: 2
  +display.media-breakpoint-up(lg)
    --cols: 3
  +display.media-breakpoint-up(xl)
    --cols: 4
</style>
