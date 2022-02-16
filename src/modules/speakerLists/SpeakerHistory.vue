<template>
  <div>
    <Tabs :tabs="systemTabs" v-model="currentTab" />
    <v-table v-if="history">
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
        <tr v-for="{ user, times_spoken, timeSpoken } in history" :key="user">
          <td>
            <User :pk="user" />
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

<script lang="ts">
import { sum } from 'lodash'
import moment from 'moment'
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Tabs from '@/components/Tabs.vue'

import useMeeting from '../meetings/useMeeting'

import useSpeakerHistory from './useSpeakerHistory'
import useSpeakerSystems from './useSpeakerSystems'

export default defineComponent({
  setup () {
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
        name: 'default',
        title: t('all')
      }]
      for (const system of allSpeakerSystems.value) {
        tabs.push({
          name: String(system.pk),
          title: system.title
        })
      }
      return tabs
    })

    const totalTime = computed(() => history.value && secondsToTimeDisplay(sum(history.value.map(e => e.seconds_spoken))))
    const totalTimes = computed(() => history.value && sum(history.value.map(e => e.times_spoken)))

    return {
      t,
      currentTab,
      history: computed(() => history.value && history.value.map(e => ({ ...e, timeSpoken: secondsToTimeDisplay(e.seconds_spoken) }))),
      systemTabs,
      totalTime,
      totalTimes
    }
  },
  components: {
    Tabs
  }
})
</script>
