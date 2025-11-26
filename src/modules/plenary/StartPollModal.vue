<script setup lang="ts">
import { computed, onMounted, shallowRef } from 'vue'

import useAgendaItem from '../agendas/useAgendaItem'
import useRoom from '../rooms/useRoom'
import useMeetingId from '../meetings/useMeetingId'
import { Poll } from '../polls/types'
import { PollStartData } from '../polls/methods/types'
import useMeetingPolls from '../polls/useMeetingPolls'
import usePolls from '../polls/usePolls'
import { Proposal } from '../proposals/types'

import PollModal from './PollModal.vue'

const props = defineProps<{
  methodName: Poll['method_name']
  proposals: Proposal[]
  settings: object | null
}>()

defineEmits<{
  (e: 'cancel'): void
}>()

const meetingId = useMeetingId()
const { agendaId, nextPollTitle } = useAgendaItem()
const { isBroadcasting, setBroadcast, setHandler, setPoll } = useRoom()
const { meetingOngoingPolls } = useMeetingPolls(meetingId)
const { createPoll: create, getPoll } = usePolls()

/**
 * Ongoing polls with any on the selected proposals.
 * If user tries to start a poll with any of these, have them confirm that it's ok
 */
const blockingPolls = computed(() =>
  meetingOngoingPolls.value.filter((poll) =>
    poll.proposals.some((pid) =>
      props.proposals.some((prop) => prop.pk === pid)
    )
  )
)

/**
 * Blocking poll names for template
 */
const blockingPollNames = computed(() =>
  blockingPolls.value.map((p) => p.title).join(', ')
)

const createdId = shallowRef<number>()
const createdPoll = computed(() =>
  typeof createdId.value === 'number' ? getPoll(createdId.value) : undefined
)

const createState = shallowRef<'creating' | 'done' | 'failed'>()
async function createPoll() {
  createState.value = 'creating'
  const pollData: PollStartData = {
    agenda_item: agendaId.value,
    meeting: meetingId.value,
    proposals: props.proposals.map((p) => p.pk),
    method_name: props.methodName,
    start: true,
    settings: props.settings,
    title: nextPollTitle.value
  }
  try {
    const { pk } = await create(pollData)
    createdId.value = pk
    setPoll(pk)
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
  if (!isBroadcasting.value || blockingPolls.value.length) return
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
  <div v-else-if="!createState && blockingPolls.length">
    <p class="mb-6">
      <i18n-t
        keypath="plenary.confirmStartBlockingPolls"
        :plural="blockingPolls.length"
      >
        <template #polls>
          <em>
            {{ blockingPollNames }}
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
