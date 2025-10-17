<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import useAgenda from '../agendas/useAgenda'
import useAgendaItem from '../agendas/useAgendaItem'
import { Proposal, ProposalState } from '../proposals/types'
import { proposalType } from '../proposals/contentTypes'
import { Poll } from '../polls/types'
import { pollType } from '../polls/contentTypes'
import { PollStartData } from '../polls/methods/types'
import useRoom from '../rooms/useRoom'
import useMeetingId from '../meetings/useMeetingId'

import PollModal from './PollModal.vue'

const props = defineProps<{
  methodName: Poll['method_name']
  proposals: Proposal[]
  settings: object | null
}>()

defineEmits<{
  (e: 'cancel'): void
}>()

const { t } = useI18n()
const { getState } = proposalType.useWorkflows()
const meetingId = useMeetingId()
const { agendaId } = useAgenda(meetingId)
const { nextPollTitle } = useAgendaItem(agendaId)
const { isBroadcasting, roomOpenPoll, setBroadcast, setHandler, setPoll } =
  useRoom()

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

const createdId = shallowRef<number>()
const createdPoll = computed(() =>
  roomOpenPoll.value?.pk === createdId.value ? roomOpenPoll.value : undefined
)

const createState = shallowRef<'creating' | 'done' | 'failed'>()
async function createPoll() {
  createState.value = 'creating'
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
    createState.value = 'done'
  } catch {
    createState.value = 'failed'
    alert("^Couldn't create poll!")
  }
}

const takingOver = shallowRef(false)
async function takeOverAndStart() {
  takingOver.value = true
  try {
    await setHandler()
    await setBroadcast({
      agenda_item: agendaId.value,
      highlighted: props.proposals.map((p) => p.pk)
    })
  } catch {
    alert("^Couldn't take over broadcast")
  }
  takingOver.value = false
  createPoll()
}

onMounted(() => {
  if (!isBroadcasting.value || protectedProposals.value.length) return
  createPoll()
})
</script>

<template>
  <div v-if="!isBroadcasting">
    <v-alert
      class="mb-4"
      icon="mdi-broadcast-off"
      :text="$t('plenary.requiresBroadcastingDescription')"
      :title="$t('plenary.requiresBroadcasting')"
      type="warning"
    />
    <div class="text-right">
      <v-btn :text="$t('cancel')" variant="text" @click="$emit('cancel')" />
      <v-btn
        color="warning"
        :loading="takingOver"
        prepend-icon="mdi-broadcast"
        :text="$t('plenary.takeOverBroadcast')"
        @click="takeOverAndStart"
      />
    </div>
  </div>
  <PollModal v-else-if="createdPoll" :data="createdPoll" />
  <div v-else-if="!createState && protectedProposals.length">
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
      <v-btn :text="$t('cancel')" variant="text" @click="$emit('cancel')" />
      <v-btn
        color="warning"
        :loading="!!createState"
        :text="$t('plenary.startPoll')"
        @click="createPoll"
      />
    </div>
  </div>
  <v-progress-circular indeterminate v-else class="mb-4" />
</template>
