<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import useAgenda from '../agendas/useAgenda'
import useAgendaItem from '../agendas/useAgendaItem'
import { Proposal, ProposalState } from '../proposals/types'
import { proposalType } from '../proposals/contentTypes'
import { Poll } from '../polls/types'
import { pollType } from '../polls/contentTypes'
import { PollMethodSettings, PollStartData } from '../polls/methods/types'
import useRoom from '../rooms/useRoom'
import useMeeting from '../meetings/useMeeting'

import PollModal from './PollModal.vue'

const props = defineProps<{
  methodName: Poll['method_name']
  proposals: Proposal[]
  settings: PollMethodSettings | null
}>()

defineEmits<{
  (e: 'cancel'): void
}>()

const { t } = useI18n()
const { getState } = proposalType.useWorkflows()
const { meetingId } = useMeeting()
const { agendaId } = useAgenda(meetingId)
const { nextPollTitle } = useAgendaItem(agendaId)
const { roomOpenPoll, setPoll } = useRoom()

const protectedProposals = computed(() =>
  props.proposals.filter((p) => p.state !== ProposalState.Published)
)

/**
 * Selected proposals that are in a protected state (not published)
 * If user tries to start a poll with any of these, have them confirm that it's ok
 */
const protectedProposalStates = computed(() =>
  [
    ...new Set(
      protectedProposals.value.map((p) => getState(p.state)?.getName(t))
    )
  ].join(', ')
)

const createdId = ref<number>()
const createdPoll = computed(() =>
  roomOpenPoll.value?.pk === createdId.value ? roomOpenPoll.value : undefined
)
const working = ref(false)
async function createPoll() {
  working.value = true
  const pollData: Omit<PollStartData, 'p_ord' | 'withheld_result'> = {
    agenda_item: agendaId.value,
    meeting: meetingId.value,
    title: nextPollTitle.value as string,
    proposals: props.proposals.map((p) => p.pk),
    method_name: props.methodName,
    start: true,
    settings: props.settings
  }
  try {
    const { data } = await pollType.api.add(pollData)
    createdId.value = data.pk
    setPoll(data.pk)
  } catch {}
  working.value = false
}

onMounted(() => {
  if (!protectedProposals.value.length) createPoll()
})
</script>

<template>
  <PollModal v-if="createdPoll" :data="createdPoll" />
  <div v-else-if="protectedProposals.length">
    <p class="mb-6">
      <i18n-t
        keypath="plenary.confirmStartProtectedStates"
        :plural="protectedProposals.length"
      >
        <template #states>
          <em>
            {{ protectedProposalStates }}
          </em>
        </template>
      </i18n-t>
    </p>
    <div class="text-right">
      <v-btn variant="text" @click="$emit('cancel')">
        {{ t('cancel') }}
      </v-btn>
      <v-btn color="warning" @click="createPoll">
        {{ t('plenary.startPoll') }}
      </v-btn>
    </div>
  </div>
  <v-progress-circular indeterminate v-else class="mb-4" />
</template>
