<template>
  <div>
    <FlagVoteSelector
      v-if="!disabled"
      class="mb-4"
      :proposals="proposals"
      :warn="isValid"
      @selected="selectIds"
    />
    <VoteProposal v-for="p in proposals" :key="p.pk" :proposal="p" class="mb-4">
      <template #vote>
        <div class="text-center">
          <v-rating
            :length="stars"
            clearable
            v-model="grades[p.pk]"
            active-color="success"
            :size="stars > 8 ? 'x-small' : 'small'"
            :disabled="disabled"
            class="flex-wrap justify-center"
          />
        </div>
      </template>
    </VoteProposal>
    <Widget
      v-if="poll.settings.deny_proposal"
      color="warning"
      elevation="4"
      class="pa-4"
    >
      <h2 class="text-center">
        {{ $t('poll.deny') }}
      </h2>
      <div class="text-center">
        <v-rating
          :length="stars"
          clearable
          v-model="grades[0]"
          active-color="surface"
          size="small"
          :disabled="disabled"
          class="flex-wrap justify-center"
        />
      </div>
    </Widget>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'

import Widget from '@/components/Widget.vue'
import VoteProposal from '@/modules/proposals/VoteProposal.vue'
import type { Proposal } from '@/modules/proposals/types'
import FlagVoteSelector from '@/modules/reactions/FlagVoteSelector.vue'

import type { SchulzePoll, SchulzeVote } from './types'

const props = defineProps<{
  disabled?: boolean
  modelValue?: SchulzeVote
  poll: SchulzePoll
  proposals: Proposal[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', vote?: SchulzeVote): void
}>()

function getGrades() {
  if (props.modelValue) return Object.fromEntries(props.modelValue.ranking)
  const deny = props.poll.settings.deny_proposal ? [0] : []
  return Object.fromEntries(
    [...props.poll.proposals, ...deny].map((id) => [id, 0])
  )
}

const grades = reactive<Record<number, number>>(getGrades())
const stars = computed(() => props.poll.settings?.stars ?? 5)
/** Any grade set to non-zero?) */
const isValid = computed(() => Object.values(grades).some((n) => n))

watch(grades, () => {
  if (!isValid.value) return emit('update:modelValue') // Clear vote on invalid
  emit('update:modelValue', {
    ranking: Object.entries(grades).map(([k, v]) => [Number(k), v])
  })
})

function selectIds(proposals: number[]) {
  for (const { pk } of props.proposals) {
    grades[pk] = proposals.includes(pk) ? stars.value : 0
  }
}
</script>
