<template>
  <div>
    <slot :empty="tabStates.length === 0" />
    <Dropdown v-for="{ state, polls } in tabStates" :key="state" :title="`${t(`workflowState.plural.${state}`)} (${polls.length})`" :modelValue="state==='ongoing'" :class="groupClass">
      <Poll :poll="p" v-for="p in polls" :key="p.pk" />
    </Dropdown>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { orderBy } from 'lodash'

import useMeeting from '../meetings/useMeeting'
import PollVue from '../polls/Poll.vue'
import usePolls from '../polls/usePolls'

import { pollType } from './contentTypes'
import { PollState } from './types'
import { Poll } from './methods/types'

const STATE_ORDERS: Partial<Record<PollState, [keyof Poll, 'asc' | 'desc']>> = {
  ongoing: ['started', 'asc'],
  finished: ['closed', 'desc']
}

export default defineComponent({
  components: {
    Poll: PollVue
  },
  props: {
    agendaItem: Number,
    groupClass: [String, Object]
  },
  setup (props) {
    const { t } = useI18n()
    const { meetingId } = useMeeting()
    const { getPolls, getAiPolls } = usePolls()
    const { getPriorityStates } = pollType.useWorkflows()

    const tabStates = computed(() => {
      return getPriorityStates()
        .map((s) => {
          const [attr, direction] = STATE_ORDERS[s.state] || ['pk', 'asc']
          const polls = props.agendaItem
            ? getAiPolls(props.agendaItem, s.state)
            : getPolls(meetingId.value, s.state)
          return {
            ...s,
            polls: orderBy(polls, [attr], [direction])
          }
        })
        .filter(s => s.polls.length)
    })

    return {
      t,
      tabStates
    }
  }
})
</script>
