<script lang="ts" setup>
import { sorted } from 'itertools'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import usePermission from '@/composables/usePermission'

import { meetingSettingsPlugins } from './registry'
import MeetingToolbar from './MeetingToolbar.vue'
import useMeeting from './useMeeting'
import useMeetingTitle from './useMeetingTitle'
import './controlPanels'
import type { Meeting } from './types'
import { cols } from '@/utils/defaults'

const { t } = useI18n()
const route = useRoute()
const { isModerator, meeting } = useMeeting()

useMeetingTitle(t('settings'))
usePermission(isModerator, { to: computed(() => ({ name: 'meeting' })) })

const panelPlugins = computed(() => {
  if (!meeting.value) return []
  return meetingSettingsPlugins.getActivePlugins(meeting.value).map((panel) => {
    return {
      description: panel.getDescription && panel.getDescription(t),
      disabled: !!panel.isDisabled?.(meeting.value as Meeting),
      title: panel.getTitle(t),
      to:
        panel.route ??
        (panel.component || panel.getTabs
          ? { name: 'controlPanel', params: { panel: panel.id } }
          : undefined),
      ...panel
    }
  })
})
const advancedPanels = computed(() =>
  sorted(
    panelPlugins.value.filter(
      (p) => p.checkAdvanced?.(meeting.value as Meeting) ?? false
    ),
    (p) => p.title.toLocaleLowerCase()
  )
)
const panels = computed(() =>
  sorted(
    panelPlugins.value.filter(
      (p) => !(p.checkAdvanced?.(meeting.value as Meeting) ?? false)
    ),
    (p) => p.title.toLocaleLowerCase()
  )
)
const currentPanel = computed(() => route.params.panel as string | undefined)
const currentPlugin = computed(() =>
  currentPanel.value
    ? meetingSettingsPlugins.getPlugin(currentPanel.value)
    : undefined
)
const currentComponent = computed(() => currentPlugin.value?.component)
const currentTabs = computed(() =>
  meeting.value ? currentPlugin.value?.getTabs?.(meeting.value, t) : undefined
)
const tabItems = computed(
  () =>
    currentTabs.value?.map((tab) => ({
      value: tab.id,
      text: tab.title,
      prependIcon: tab.icon,
      disabled: !!tab.disabled
    }))
)
const currentTab = ref<string>()
// Reset selection when the active panel changes
watch(
  currentPlugin,
  () =>
    (currentTab.value = currentTabs.value?.find((tab) => !tab.disabled)?.id),
  { immediate: true }
)

const breadcrumbs = computed(() => {
  if (!currentPlugin.value) return
  return [
    {
      title: t('meeting.controlPanel'),
      to: { name: 'settings' }
    },
    {
      title: currentPlugin.value.getTitle(t),
      to: { name: 'controlPanel', params: { panel: currentPlugin.value.id } }
    }
  ]
})
</script>

<template>
  <MeetingToolbar v-if="breadcrumbs">
    <v-breadcrumbs :items="breadcrumbs" />
    <v-spacer />
    <v-tabs v-if="tabItems" v-model="currentTab" :items="tabItems" />
  </MeetingToolbar>
  <MeetingToolbar v-else :title="$t('meeting.controlPanel')">
    <v-menu v-if="advancedPanels.length">
      <template #activator="{ props }">
        <v-btn
          append-icon="mdi-chevron-down"
          :text="$t('meeting.advancedSettings')"
          v-bind="props"
        />
      </template>
      <v-list>
        <v-list-item
          v-for="panel in advancedPanels"
          :key="panel.id"
          :prepend-icon="panel.icon"
          :subtitle="panel.description"
          :title="panel.title"
          :to="panel.to"
        />
      </v-list>
    </v-menu>
  </MeetingToolbar>
  <v-row id="setting-panels">
    <v-col v-if="currentTabs" v-bind="cols.default">
      <v-window v-model="currentTab" :touch="false">
        <v-window-item v-for="tab in currentTabs" :key="tab.id" :value="tab.id">
          <component :is="tab.component" />
        </v-window-item>
      </v-window>
    </v-col>
    <v-col v-else-if="currentComponent">
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
        } in panels"
        class="d-flex flex-column"
        :disabled="disabled"
        :text="description"
        :key="id"
        :to="to"
      >
        <template #title>
          <div class="d-flex ga-2">
            <v-icon sm :icon="icon" />
            <span class="flex-grow-1 text-truncate">
              {{ title }}
            </span>
            <v-icon icon="mdi-chevron-right" v-if="to" />
          </div>
        </template>
        <component v-if="quickComponent" :is="quickComponent" />
      </v-card>
    </v-col>
  </v-row>
</template>

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
