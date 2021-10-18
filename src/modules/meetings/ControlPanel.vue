<template>
  <v-row>
    <v-col>
      <header>
        <h1>{{ t('meeting.settings.for', meeting) }}</h1>
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
    <v-col v-else v-for="p in panels" :key="p.name" sm="6" md="4" lg="3" cols="12" class="panels">
      <router-link :to="`${meetingPath}/settings/${p.path}`">
        <v-card>
          <v-card-title>
            <v-icon v-if="p.icon" sm :icon="p.icon" class="mr-2" />
            {{ t(p.translationKey) }}
          </v-card-title>
          <v-card-text v-if="p.description">
            {{ p.description }}
          </v-card-text>
        </v-card>
      </router-link>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

import useMeeting from '@/modules/meetings/useMeeting'

import controlPanels from './controlPanels'
import { useTitle } from '@vueuse/core'

export default defineComponent({
  name: 'ControlPanel',
  setup () {
    const { t } = useI18n()
    const route = useRoute()
    const { meeting, meetingPath } = useMeeting()

    useTitle(computed(() => `${t('settings')} | ${meeting.value?.title}`))

    const panels = computed(() => {
      return Object.values(controlPanels)
    })
    const currentPanel = computed(() => route.params.panel as string)
    const currentComponent = computed(() => Object.values(controlPanels).find(p => p.path === route.params.panel))

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
  .panels
    .v-card
      transition: transform .5s
      &:hover
        transform: scale(1.03)
</style>
