<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import useAgendaItem from '../agendas/useAgendaItem'
import { Poll } from '../polls/types'
import { PollPlugin, pollPlugins } from '../polls/registry'
import StartPollForm from '../polls/StartPollForm.vue'
import { Proposal } from '../proposals/types'

import StartPollModal from './StartPollModal.vue'
import { QUICK_START_METHODS } from './usePlenary'

const props = defineProps<{
  proposals: Proposal[]
}>()

defineEmits<{
  (e: 'cancel'): void
}>()

const { t } = useI18n()
const { meetingAndAiOngoing, nextPollTitle } = useAgendaItem()

/**
 * Methods valid for the selected proposals, that aren't already quick start options
 */
const availableMethods = computed(() =>
  pollPlugins
    .getAvailableMethods(props.proposals.length)
    .filter(({ id }) => !QUICK_START_METHODS.has(id))
)

const selectedMethod = shallowRef<PollPlugin>()

type PollFormData = Pick<Poll, 'p_ord' | 'title' | 'withheld_result'> & {
  settings: object | null
}
const pollData = shallowRef<PollFormData>()

async function setPollData(data: PollFormData) {
  // Copy, so the form state isn't shared with StartPollModal
  pollData.value = { ...data }
}
</script>

<template>
  <StartPollModal
    v-if="selectedMethod && pollData"
    :method-name="selectedMethod.id"
    :p_ord="pollData.p_ord"
    :proposals="proposals"
    :settings="pollData.settings"
    :title="pollData.title"
    :withheld_result="pollData.withheld_result"
    @cancel="$emit('cancel')"
  />
  <div v-else-if="selectedMethod">
    <div class="d-flex align-center mb-4">
      <h3 class="flex-grow-1">{{ selectedMethod.getName(t) }}</h3>
      <v-btn
        prepend-icon="mdi-undo-variant"
        size="small"
        :text="$t('poll.chooseMethod')"
        variant="tonal"
        @click="selectedMethod = undefined"
      />
    </div>
    <StartPollForm
      :allow-start="meetingAndAiOngoing"
      :create-handler="setPollData"
      :poll-method="selectedMethod"
      :proposals="proposals.length"
      start-only
      :title="nextPollTitle"
    />
    <v-alert
      v-if="!meetingAndAiOngoing"
      class="mt-2"
      :text="$t('poll.cantStartWithoutOngoing')"
      type="info"
    />
  </div>
  <div v-else>
    <h3 class="mb-2">{{ $t('poll.chooseMethod') }}</h3>
    <v-alert
      v-if="!availableMethods.length"
      class="mb-4"
      :text="$t('plenary.noOtherPollMethods')"
      type="info"
    />
    <v-list v-else class="mb-4" lines="three">
      <v-list-item
        v-for="method in availableMethods"
        :key="method.id"
        :prepend-icon="method.discouraged ? 'mdi-alert-decagram' : 'mdi-vote'"
        :subtitle="method.getDescription(t)"
        :title="method.getName(t)"
        @click="selectedMethod = method"
      />
    </v-list>
    <div class="text-right">
      <v-btn :text="$t('cancel')" variant="text" @click="$emit('cancel')" />
    </div>
  </div>
</template>
