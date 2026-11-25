<script lang="ts" setup>
import { orderBy } from '@/utils'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import Dropdown from '@/components/Dropdown.vue'
import useMeetingId from '../meetings/useMeetingId'
import PollCard from '../polls/Poll.vue'
import usePollStore from '../polls/usePollStore'

import { pollType } from './contentTypes'
import { Poll, PollState } from './types'

const STATE_ORDERS: Partial<Record<PollState, [keyof Poll, 'asc' | 'desc']>> = {
  ongoing: ['started', 'asc'],
  finished: ['closed', 'desc']
}

const props = withDefaults(
  defineProps<{
    agendaItem?: number
    pollGap?: number
  }>(),
  {
    pollGap: 2
  }
)

const openStates = defineModel<PollState[]>({
  default: () => [PollState.Ongoing]
})

const { t } = useI18n()
const meetingId = useMeetingId()
const { getMeetingPolls, getAiPolls } = usePollStore()

function setOpen(state: PollState, open: boolean) {
  openStates.value = open
    ? [...openStates.value, state]
    : openStates.value.filter((s) => s !== state)
}

// When the user moves a poll to another state, open that group so it stays
// visible. Awaited here, since the card is likely gone by the time it resolves.
async function openOnTransition(newState: Promise<PollState | undefined>) {
  const state = await newState
  if (state && !openStates.value.includes(state)) setOpen(state, true)
}

const tabStates = computed(() => {
  return pollType.sm
    .getPriorityStates()
    .map((s) => {
      const [attr, direction] = STATE_ORDERS[s.state] || ['pk', 'asc']
      const polls = props.agendaItem
        ? getAiPolls(props.agendaItem, s.state)
        : getMeetingPolls(meetingId.value, s.state)
      return {
        ...s,
        polls: orderBy(polls, attr, direction),
        title: `${s.translate(t, polls.length)} (${polls.length})`
      }
    })
    .filter((s) => s.polls.length)
})
</script>

<template>
  <div class="d-flex flex-column">
    <slot v-if="tabStates.length === 0" name="empty"></slot>
    <Dropdown
      v-for="{ state, polls, title } in tabStates"
      :key="state"
      :title="title"
      :model-value="openStates.includes(state)"
      @update:model-value="setOpen(state, $event)"
    >
      <div class="d-flex flex-column my-1" :class="`ga-${pollGap}`">
        <PollCard
          :poll="p"
          v-for="p in polls"
          :key="p.pk"
          @transition="openOnTransition"
        />
      </div>
    </Dropdown>
  </div>
</template>
