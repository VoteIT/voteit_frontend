<template>
  <div>
    <slot :empty="tabStates.length === 0" />
    <Dropdown v-for="{ state, polls } in tabStates" :key="state" :title="`${t(`workflowState.plural.${state}`)} (${polls.length})`" v-model="dropdowns[state]" :class="groupClass">
      <PollCard :poll="p" v-for="p in polls" :key="p.pk" :class="pollClass" />
    </Dropdown>
  </div>
</template>

<script lang="ts" setup>
import { computed, PropType, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { orderBy } from 'lodash'

import useMeeting from '../meetings/useMeeting'
import PollCard from '../polls/Poll.vue'
import usePolls from '../polls/usePolls'

import { pollType } from './contentTypes'
import { PollState } from './types'
import type { Poll } from './methods/types'

const STATE_ORDERS: Partial<Record<PollState, [keyof Poll, 'asc' | 'desc']>> = {
  ongoing: ['started', 'asc'],
  finished: ['closed', 'desc']
}

const props = defineProps({
  agendaItem: Number,
  groupClass: [String, Object],
  pollClass: {
    type: [String, Object],
    default: 'my-1'
  },
  modelValue: {
    type: Array as PropType<PollState[]>,
    default: () => [PollState.Ongoing]
  }
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const { meetingId } = useMeeting()
const { getPolls, getAiPolls } = usePolls()
const { getPriorityStates } = pollType.useWorkflows()

const dropdowns = reactive(Object.fromEntries(Object.values(PollState).map(s => [s, props.modelValue.includes(s)])) as Record<PollState, boolean>)

watch(dropdowns, value => emit('update:modelValue', (Object.keys(value) as PollState[]).filter(k => value[k])))

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
</script>
