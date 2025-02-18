<script lang="ts" setup>
import { imap, sum } from 'itertools'
import { Duration } from 'luxon'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { durationToString } from '@/utils'
import restApi from '@/utils/restApi'
import User from '@/components/User.vue'
import useMeeting from '../meetings/useMeeting'

import useSpeakerHistory from './useSpeakerHistory'
import useSpeakerSystems from './useSpeakerSystems'
import { meetingRoomStore } from '../rooms/useRooms'

function getDownloadUrl(system: number, type: 'csv' | 'json') {
  return `${restApi.defaults.baseURL}export-speakers/${system}/${type}/`
}

const { t } = useI18n()
const { isModerator, meetingId } = useMeeting()
const { allSpeakerSystems } = useSpeakerSystems(meetingId)
const currentTab = ref('default')
const speakerSystem = computed(() => {
  if (allSpeakerSystems.value.length === 1) return allSpeakerSystems.value[0].pk
  return Number(currentTab.value) || undefined
})
const { history } = useSpeakerHistory(meetingId, speakerSystem)

function secondsToTimeDisplay(seconds: number) {
  return durationToString(Duration.fromMillis(seconds * 1000))
}

function* getSystemTabs() {
  for (const system of allSpeakerSystems.value) {
    const room = meetingRoomStore.get(system.room)
    yield {
      value: String(system.pk),
      text: room?.title ?? '-'
    }
  }
}

const systemTabs = computed(() => {
  if (allSpeakerSystems.value.length <= 1) return
  return [
    {
      value: 'default',
      text: t('all')
    },
    ...getSystemTabs()
  ]
})

const totalTime = computed(
  () =>
    history.value &&
    secondsToTimeDisplay(sum(history.value.map((e) => e.seconds_spoken)))
)
const totalTimes = computed(() =>
  history.value ? sum(imap(history.value, (e) => e.times_spoken)) : 0
)
const annotatedHistory = computed(
  () =>
    history.value &&
    history.value.map((e) => ({
      ...e,
      timeSpoken: secondsToTimeDisplay(e.seconds_spoken)
    }))
)
</script>

<template>
  <div class="mt-4">
    <div class="d-flex">
      <v-tabs :items="systemTabs" v-model="currentTab" />
      <v-spacer />
      <v-menu v-if="speakerSystem && isModerator">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            prepend-icon="mdi-download"
            variant="tonal"
            color="primary"
            :disabled="!annotatedHistory?.length"
          >
            {{ $t('download') }}
          </v-btn>
        </template>
        <v-list>
          <v-list-item
            :href="getDownloadUrl(speakerSystem, 'csv')"
            append-icon="mdi-file-download"
            :title="`${t('speaker.history')} (CSV)`"
          />
          <v-list-item
            :href="getDownloadUrl(speakerSystem, 'json')"
            append-icon="mdi-file-download"
            :title="`${t('speaker.history')} (JSON)`"
          />
        </v-list>
      </v-menu>
    </div>
    <v-table v-if="annotatedHistory">
      <thead>
        <tr>
          <th>
            {{ $t('name') }}
          </th>
          <th>
            {{ $t('speaker.timesSpoken', totalTimes) }}
          </th>
          <th>
            {{ $t('speaker.timeSpoken', { time: totalTime }) }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="{ user, times_spoken, timeSpoken } in annotatedHistory"
          :key="user"
        >
          <td>
            <User :pk="user" userid />
          </td>
          <td>
            {{ times_spoken }}
          </td>
          <td>
            {{ timeSpoken }}
          </td>
        </tr>
      </tbody>
    </v-table>
    <div v-else class="text-center">
      <v-progress-circular indeterminate />
    </div>
  </div>
</template>
