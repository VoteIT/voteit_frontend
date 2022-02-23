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
      <Dropdown v-for="{ state, polls } in tabStates" :key="state" :title="`${t(`workflowState.plural.${state}`)} (${polls.length})`" :modelValue="state==='ongoing'" class="mt-4">
        <Poll :poll="p" v-for="p in polls" :key="p.pk" />
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
import { orderBy } from 'lodash'

import useMeeting from '../meetings/useMeeting'
import useMeetingTitle from '../meetings/useMeetingTitle'
import PollVue from '../polls/Poll.vue'
import usePolls from '../polls/usePolls'

import { WorkflowState } from '@/contentTypes/types'
import { canAddPoll } from './rules'
import { pollType } from './contentTypes'
import { PollState } from './types'
import { Poll } from './methods/types'

const STATE_ORDERS: Partial<Record<PollState, [keyof Poll, 'asc' | 'desc']>> = {
  ongoing: ['started', 'asc'],
  finished: ['closed', 'desc']
}

export default defineComponent({
  name: 'Polls',
  components: {
    Poll: PollVue
  },
  setup () {
    const { t } = useI18n()
    const { meeting, meetingPath, meetingId } = useMeeting()
    const { getPolls } = usePolls()
    const { getPriorityStates } = pollType.useWorkflows()
    useMeetingTitle(t('poll.all'))

    const tabStates = computed(() => {
      return getPriorityStates()
        .map((s) => {
          const [attr, direction] = STATE_ORDERS[s.state] || ['pk', 'asc']
          return {
            ...s,
            polls: orderBy(getPolls(meetingId.value, s.state), [attr], [direction])
          }
        })
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
