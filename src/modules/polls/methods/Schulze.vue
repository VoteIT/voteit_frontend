<template>
  <div>
    <Proposal readOnly :p="p" v-for="p in proposals" :key="p.pk">
      <template v-slot:vote>
        <div class="grade">
          <div/>
          <v-rating length="5" v-model="grades[p.pk]" active-color="success-darken-2" size="small" :disabled="disabled" />
          <div>
            <v-btn size="small" border v-show="!!grades[p.pk]" @click="grades[p.pk] = 0">{{ t('clear') }}</v-btn>
          </div>
        </div>
      </template>
    </Proposal>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, reactive, watch } from 'vue'

import useProposals from '@/modules/proposals/useProposals'
import ProposalVue from '@/modules/proposals/Proposal.vue'

import { Proposal } from '@/contentTypes/types'
import { SchulzeVote } from './types'
import { Poll } from '../types'

export default defineComponent({
  name: 'SchulzePoll',
  inject: ['t'],
  props: {
    poll: {
      type: Object as PropType<Poll>,
      required: true
    },
    modelValue: Object as PropType<SchulzeVote>,
    disabled: Boolean
  },
  components: {
    Proposal: ProposalVue
  },
  setup (props, { emit }) {
    const { getProposal } = useProposals()
    const grades = reactive<Record<number, number>>({})
    if (props.modelValue) {
      for (const [key, value] of props.modelValue.ranking) {
        grades[key] = value
      }
    }

    const proposals = computed(() => props.poll.proposals.map(getProposal) as Proposal[])

    watch(grades, value => {
      const valid = Object.values(value).some(n => n) // Any grade set to non-zero?
      if (!valid) return emit('update:modelValue') // Clear vote on invalid
      emit('update:modelValue', {
        ranking: proposals.value.map(p => [p.pk, grades[p.pk] ?? 0])
      })
    })

    return {
      grades,
      proposals
    }
  }
})
</script>

<style lang="sass" scoped>
.grade
  text-align: center
  display: flex
  > div
    flex: 0 1 100px
  :last-child
    text-align: right
  .v-rating
    flex: 1 0 auto
    justify-content: center
</style>
