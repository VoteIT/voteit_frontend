<script setup lang="ts">
import { computed, provide } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'

import { RoleContextKey } from '@/injectionKeys'
import useMeetingChannel from '../meetings/useMeetingChannel'
import useMeetingTitle from '../meetings/useMeetingTitle'

import useSpeakerSystem from './useSpeakerSystem'
import FullscreenAppBar from './FullscreenAppBar.vue'
import ActiveSpeakerList from './ActiveSpeakerList.vue'

provide(RoleContextKey, 'meeting')
const { t } = useI18n()
const route = useRoute()
const speakerSystemId = computed(() => Number(route.params.system))
useMeetingChannel()

const { speakerSystem } = useSpeakerSystem(speakerSystemId)

useMeetingTitle(
  computed(() => t('speaker.fullscreenSystem', { ...speakerSystem.value }))
)
</script>

<template>
  <FullscreenAppBar />
  <v-main>
    <v-container>
      <v-row>
        <v-col sm="10" offset-sm="1" md="8" offset-md="2">
          <ActiveSpeakerList :system-id="speakerSystemId" />
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>
