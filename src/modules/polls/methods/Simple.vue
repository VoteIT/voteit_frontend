<template>
  <div>
    <FlagVoteSelector
      v-if="!disabled"
      class="mb-4"
      :proposals="proposals"
      :warn="!!validVote"
      @selected="selectIds"
    />
    <form @submit.prevent class="my-4">
      <VoteProposal
        v-for="p in proposals" :key="p.pk"
        :proposal="p"
        class="mb-4"
      >
        <template #vote>
          <div class="simple-options">
            <v-btn :disabled="disabled" v-for="opt in options" :key="opt.value" :color="opt.color" :variant="opt.value === votes.get(p.pk) ? 'elevated' : 'outlined'" :prepend-icon="opt.icon" @click="change(p, opt)">
              {{ opt.getTitle(t) }}
            </v-btn>
          </div>
        </template>
      </VoteProposal>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import DefaultMap from '@/utils/DefaultMap'
import type { Proposal } from '@/modules/proposals/types'

import { SimpleVote, SimpleChoice, SimpleChoiceDesc, SimplePoll } from './types'
import { simpleChoices } from './simple'
import VoteProposal from '@/modules/proposals/VoteProposal.vue'
import FlagVoteSelector from '@/modules/reactions/FlagVoteSelector.vue'

const props = defineProps<{
  disabled?: boolean
  modelValue?: SimpleVote
  poll: SimplePoll
  proposals: Proposal[]
}>()

// eslint-disable-next-line func-call-spacing
const emit = defineEmits<{
  (e: 'update:modelValue', vote?: SimpleVote): void
}>()

const { t } = useI18n()
const votes = reactive<Map<number, SimpleChoice>>(new Map())

if (props.modelValue) {
  for (const [choice, pks] of Object.entries(props.modelValue)) {
    for (const pk of pks) {
      votes.set(pk, choice as SimpleChoice)
    }
  }
}

const options = props.proposals.length > 1 ? simpleChoices : simpleChoices.filter(c => c.value !== SimpleChoice.Abstain)

const validVote = computed(() => {
  // Return a valid vote, or undefined if not valid
  const map = new DefaultMap<SimpleChoice, number[]>(() => [])
  for (const prop of props.proposals) {
    const vote = votes.get(prop.pk)
    if (!vote) return
    map.get(vote).push(prop.pk)
  }
  return Object.fromEntries(map) as SimpleVote
})

function change (proposal: Proposal, opt: SimpleChoiceDesc) {
  if (props.disabled) return
  votes.set(proposal.pk, opt.value)
}

watch(validVote, value => {
  emit('update:modelValue', value)
})

function selectIds (proposals: number[]) {
  for (const { pk } of props.proposals) {
    votes.set(pk, proposals.includes(pk)
      ? SimpleChoice.Yes
      : SimpleChoice.No
    )
  }
}
</script>

<style lang="sass">
.simple-options
  text-align: center
  button
    margin-right: .4rem
    &:last-child
      margin-right: 0
</style>
