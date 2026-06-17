<script lang="ts" setup>
import { computed } from 'vue'

import useMeetingId from '../meetings/useMeetingId'
import useMeetingStore from '../meetings/useMeetingStore'
import { MeetingState } from '../meetings/types'

import ImportSection from './ImportSection.vue'
import ExportSection from './ExportSection.vue'
import DownloadSection from './DownloadSection.vue'

const meetingId = useMeetingId()
const meetingStore = useMeetingStore()

const isUpcoming = computed(
  () =>
    meetingStore.getMeeting(meetingId.value)?.state === MeetingState.Upcoming
)
</script>

<template>
  <div>
    <h1 class="mb-6">{{ $t('exportImport.importAndExport') }}</h1>
    <ImportSection v-if="isUpcoming" class="mb-8" />
    <v-alert
      v-else
      class="mb-8"
      type="info"
      variant="tonal"
      :text="$t('exportImport.importOnlyUpcoming')"
    />
    <v-divider class="my-6" />
    <ExportSection />
    <v-divider class="my-6" />
    <DownloadSection />
  </div>
</template>
