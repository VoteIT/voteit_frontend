<template>
  <div>
    <div class="d-flex">
      <v-tabs :items="systemTabs" v-model="currentTab" />
      <v-spacer />
      <v-menu v-if="speakerSystem">
        <template #activator="{ props }">
          <v-btn v-bind="props" prepend-icon="mdi-download" variant="tonal" color="primary">
            {{ t('download') }}
          </v-btn>
        </template>
        <v-list>
          <v-list-item :href="getDownloadUrl(speakerSystem, 'csv')" append-icon="mdi-file-download" :title="`${t('speaker.history')} (CSV)`" />
          <v-list-item :href="getDownloadUrl(speakerSystem, 'json')" append-icon="mdi-file-download" :title="`${t('speaker.history')} (JSON)`" />
        </v-list>
      </v-menu>
    </div>
    <v-table v-if="annotatedHistory">
      <thead>
        <tr>
          <th>
            {{ t('name') }}
          </th>
          <th>
            {{ t('speaker.timesSpoken', totalTimes) }}
          </th>
          <th>
            {{ t('speaker.timeSpoken', { time: totalTime }) }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="{ user, times_spoken, timeSpoken } in annotatedHistory" :key="user">
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

<script lang="ts" setup>
import { sum } from 'lodash'
import moment from 'moment'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import restApi from '@/utils/restApi'
import useMeeting from '../meetings/useMeeting'

import useSpeakerHistory from './useSpeakerHistory'
import useSpeakerSystems from './useSpeakerSystems'

function getDownloadUrl (system: number, type: 'csv' | 'json') {
  return `${restApi.defaults.baseURL}export-speakers/${system}/${type}/`
}

const { t } = useI18n()
const { meetingId } = useMeeting()
const speakerSystem = ref<number | undefined>(undefined)
const { history } = useSpeakerHistory(meetingId, speakerSystem)
const { allSpeakerSystems } = useSpeakerSystems(meetingId)

const currentTab = computed({
  get () {
    return String(speakerSystem.value ?? 'default')
  },
  set (value) {
    if (value === 'default') speakerSystem.value = undefined
    else speakerSystem.value = Number(value)
  }
})

const digits = (n: number) => n.toLocaleString(undefined, { minimumIntegerDigits: 2 })

function secondsToTimeDisplay (seconds: number) {
  const duration = moment.duration(seconds * 1000)
  if (duration.hours()) return `${duration.hours()}:${digits(duration.minutes())}:${digits(duration.seconds())}`
  return `${duration.minutes()}:${digits(duration.seconds())}`
}

const systemTabs = computed(() => {
  if (allSpeakerSystems.value.length <= 1) return
  const tabs = [{
    value: 'default',
    title: t('all')
  }]
  for (const system of allSpeakerSystems.value) {
    tabs.push({
      value: String(system.pk),
      title: system.title
    })
  }
  return tabs
})

const totalTime = computed(() => history.value && secondsToTimeDisplay(sum(history.value.map(e => e.seconds_spoken))))
const totalTimes = computed(() => history.value && sum(history.value.map(e => e.times_spoken)))
const annotatedHistory = computed(() => history.value && history.value.map(e => ({ ...e, timeSpoken: secondsToTimeDisplay(e.seconds_spoken) })))
</script>
