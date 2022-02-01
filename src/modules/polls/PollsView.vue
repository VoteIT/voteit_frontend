<template>
  <v-row>
    <v-col offset-lg="2" lg="8">
      <header class="d-flex align-end mb-4">
        <h1 class="flex-grow-1">
          {{ t('poll.all') }}
        </h1>
        <v-btn v-if="canAddPoll" color="primary" prepend-icon="mdi-star-plus" :to="toAddPoll">
          {{ t('poll.new') }}
        </v-btn>
      </header>
      <v-divider />
      <Dropdown v-for="s in tabStates" :key="s.state" :title="`${t(`workflowState.plural.${s.state}`)} (${s.polls.length})`" :open="s.state==='ongoing'" class="mt-4">
        <Poll :poll="p" v-for="p in s.polls" :key="p.pk" />
      </Dropdown>
      <p v-if="tabStates.length === 0">
        <em>{{ t('poll.noPublishedPolls') }}</em>
      </p>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'

import useMeeting from '../meetings/useMeeting'
import useMeetingTitle from '../meetings/useMeetingTitle'
import Poll from '../polls/Poll.vue'
import usePolls from '../polls/usePolls'

import { WorkflowState } from '@/contentTypes/types'
import { canAddPoll } from './rules'
import { pollType } from './contentTypes'

export default defineComponent({
  name: 'Polls',
  components: {
    Poll
  },
  setup () {
    const { t } = useI18n()
    const { meeting, meetingPath, meetingId } = useMeeting()
    const { getPolls } = usePolls()
    const { getPriorityStates } = pollType.useWorkflows()
    useMeetingTitle(t('poll.all'))

    const tabStates = computed(() => {
      return getPriorityStates()
        .map(s => ({
          ...s,
          polls: getPolls(meetingId.value, s.state)
        }))
        .filter(s => s.polls.length)
    })

    return {
      t,
      tabStates,
      canAddPoll: computed(() => meeting.value && canAddPoll(meeting.value)),
      toAddPoll: computed(() => meetingPath.value + '/polls/new'),
      getStatePath (s: WorkflowState) {
        if (s.state === 'ongoing') return `${meetingPath.value}/polls`
        return `${meetingPath.value}/polls/${s.state}`
      }
    }
  }
})
</script>
