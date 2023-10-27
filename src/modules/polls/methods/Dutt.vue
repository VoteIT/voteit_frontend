<template>
  <div>
    <FlagVoteSelector
      v-if="!disabled"
      class="mb-4"
      :proposals="proposals"
      :warn="!!selected.length"
      @selected="selectIds"
    />
    <v-item-group v-model="selected" multiple>
      <v-item
        v-for="p in proposals"
        :key="p.pk"
        :value="p.pk"
        v-slot="{ toggle, isSelected }"
      >
        <VoteProposal :proposal="p" class="mb-4">
          <template #vote>
            <div class="text-center">
              <v-checkbox
                @update:modelValue="toggle?.()"
                :disabled="disabled"
                :modelValue="isSelected"
                hide-details
                :label="t('select')"
                class="d-inline-block mb-n2"
                density="compact"
              />
            </div>
          </template>
        </VoteProposal>
      </v-item>
    </v-item-group>
    <v-alert v-if="!disabled && validHelpText" :text="validHelpText" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import VoteProposal from '@/modules/proposals/VoteProposal.vue'
import FlagVoteSelector from '@/modules/reactions/FlagVoteSelector.vue'
import type { Proposal } from '@/modules/proposals/types'

import type { DuttPoll, DuttVote } from './types'

const props = defineProps<{
  disabled?: boolean
  modelValue?: DuttVote
  poll: DuttPoll
  proposals: Proposal[]
}>()

// eslint-disable-next-line func-call-spacing
const emit = defineEmits<{
  (e: 'update:modelValue', vote?: DuttVote): void
}>()

const { t } = useI18n()

const selected = ref<number[]>(props.modelValue?.choices ?? [])

// eslint-disable-next-line vue/return-in-computed-property
const missingProposals = computed(() => {
  const len = selected.value.length
  const { min } = props.poll.settings
  if (min > 0 && len < min) return min - len
})

// eslint-disable-next-line vue/return-in-computed-property
const surplusProposals = computed(() => {
  const len = selected.value.length
  const { max } = props.poll.settings
  if (max > 0 && len > max) return len - max
})

const validVote = computed(() => {
  if (missingProposals.value || surplusProposals.value) return
  return {
    choices: selected.value
  }
})

watch(validVote, (value) => {
  emit('update:modelValue', value)
})

const validHelpText = computed(() => {
  if (missingProposals.value)
    return t('poll.dutt.minHelpText', missingProposals.value)
  if (surplusProposals.value)
    return t('poll.dutt.maxHelpText', surplusProposals.value)
  return t('poll.dutt.validVoteHelpText')
})

function selectIds(proposals: number[]) {
  selected.value = proposals
}
</script>
