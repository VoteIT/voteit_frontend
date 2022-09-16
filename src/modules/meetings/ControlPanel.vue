<template>
  <v-row>
    <v-col>
      <header>
        <h1>{{ t('meeting.settings.for', { ...meeting }) }}</h1>
        <v-breadcrumbs v-if="breadcrumbs.length" :items="breadcrumbs" />
        <v-btn color="primary" v-if="currentComponent" prepend-icon="mdi-chevron-left" :to="`${meetingPath}/settings`">
          {{ t('meeting.settings.all') }}
        </v-btn>
      </header>
    </v-col>
  </v-row>
  <v-row id="setting-panels">
    <v-col v-if="currentComponent">
      <component :is="currentComponent"/>
    </v-col>
    <v-col v-else v-for="{ icon, id, component, translationKey, quickComponent } in panelPlugins" :key="id" sm="6" md="4" lg="3" cols="12" class="panels">
      <router-link v-if="component" :to="`${meetingPath}/settings/${id}`">
        <v-card>
          <v-card-title>
            <v-icon sm :icon="icon" class="mr-2" />
            {{ t(translationKey) }}
          </v-card-title>
          <!-- Won't work on linked
          <v-divider v-if="quickComponent" />
          <v-card-text v-if="quickComponent">
            <component :is="quickComponent" />
          </v-card-text> -->
        </v-card>
      </router-link>
      <v-card v-else>
        <v-card-title>
          <v-icon sm :icon="icon" class="mr-2" />
          {{ t(translationKey) }}
        </v-card-title>
        <v-divider v-if="quickComponent" />
        <v-card-text v-if="quickComponent">
          <component :is="quickComponent" />
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import usePermission from '@/composables/usePermission'
import useMeeting from '@/modules/meetings/useMeeting'

import { meetingSettingsPlugins } from './registry'
import useMeetingTitle from './useMeetingTitle'
import useComponentApi from './useComponentApi'
import useLoader from '@/composables/useLoader'

require('./controlPanels')

export default defineComponent({
  setup () {
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
      return meetingSettingsPlugins
        .getActivePlugins(meeting.value)
    })
    const currentPanel = computed(() => route.params.panel as string | undefined)
    const currentComponent = computed(() => panelPlugins.value.find(p => p.id === route.params.panel)?.component)

    const breadcrumbs = computed(() => {
      if (currentPanel.value || !currentComponent.value) return []
      return [{
        text: t('settings'),
        to: `${meetingPath.value}/settings`
      },
      {
        text: t(currentComponent.value.translationKey),
        to: `${meetingPath.value}/settings/${currentComponent.value.path}`
      }]
    })

    return {
      t,
      breadcrumbs,
      meeting,
      meetingPath,
      panelPlugins,
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
  .panels
    .v-card
      transition: transform .5s
      &:hover
        transform: scale(1.03)
</style>
