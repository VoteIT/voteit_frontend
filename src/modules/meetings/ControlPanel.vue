<template>
  <teleport to="#toolbar">
    <v-toolbar color="secondary-lighten-2" elevation="1" class="text-black">
      <v-breadcrumbs v-if="breadcrumbs" :items="breadcrumbs" />
      <v-toolbar-title v-else>
        {{ t('meeting.controlPanel') }}
      </v-toolbar-title>
    </v-toolbar>
  </teleport>
  <v-row id="setting-panels">
    <v-col v-if="currentComponent">
      <component :is="currentComponent"/>
    </v-col>
    <v-col class="grid" v-else>
      <v-card v-for="{ icon, id, component, description, title, quickComponent } in panelPlugins" :key="id">
        <router-link v-if="component" :to="`${meetingPath}/settings/${id}`">
          <v-card-title class="d-flex text-black">
            <v-icon sm :icon="icon" class="mr-2" />
            <span class="flex-grow-1 text-truncate">
              {{ title }}
            </span>
            <v-icon icon="mdi-chevron-right" />
          </v-card-title>
        </router-link>
        <v-card-title v-else>
          <v-icon sm :icon="icon" class="mr-2" />
          {{ title }}
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

import usePermission from '@/composables/usePermission'
import useMeeting from '@/modules/meetings/useMeeting'

import { meetingSettingsPlugins } from './registry'
import useMeetingTitle from './useMeetingTitle'
import useComponentApi from './useComponentApi'
import useLoader from '@/composables/useLoader'

import './controlPanels'

const { t } = useI18n()
const route = useRoute()
const { isModerator, meeting, meetingId, meetingPath } = useMeeting()

useMeetingTitle(t('settings'))
usePermission(isModerator, { to: meetingPath })
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
        title: panel.getTitle(t),
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
    to: `${meetingPath.value}/settings`
  },
  {
    text: t(currentPlugin.value.getTitle(t)),
    to: `${meetingPath.value}/settings/${currentPlugin.value.id}`
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
