<template>
  <div>
    <Proposal read-only :p="p" v-for="p in proposals" :key="p.pk">
      <template v-slot:vote>
        <div class="grade">
          <div/>
          <div class="rating">
            <Icon :name="n <= proposalGrades.get(p.pk) ? 'mdi-star' : 'mdi-star-outline'" v-for="n in grades" :key="n" @click="setGrade(p, n)"
                  :class="{ active: n <= proposalGrades.get(p.pk) }" />
          </div>
          <div>
            <v-btn size="small" border v-show="proposalGrades.get(p.pk)" @click="setGrade(p, 0)">{{ t('clear') }}</v-btn>
          </div>
        </div>
      </template>
    </Proposal>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, reactive } from 'vue'

import ProposalComponent from '@/components/widgets/Proposal.vue'

import { Poll, Proposal } from '@/contentTypes/types'
import { SchulzeVote } from './types'

const GRADES: number[] = [1, 2, 3, 4, 5]

export default defineComponent({
  name: 'SchulzePoll',
  inject: ['t'],
  props: {
    poll: {
      type: Object as PropType<Poll>,
      required: true
    },
    proposals: {
      type: Array as PropType<Proposal[]>,
      required: true
    },
    modelValue: Object as PropType<SchulzeVote>
  },
  components: {
    Proposal: ProposalComponent
  },
  setup (props, { emit }) {
    const proposalGrades = reactive<Map<number, number>>(new Map())
    if (props.modelValue) {
      for (const [key, value] of props.modelValue.ranking) {
        proposalGrades.set(key, value)
      }
    }

    // Watch existing vote value from Vote modal
    // watch(() => props.modelValue, (vote?: SchulzeVote) => {
    //   for (const [key, value] of vote?.ranking || []) {
    //     proposalGrades.set(key, value)
    //   }
    // })

    function setGrade (proposal: Proposal, grade: number) {
      proposalGrades.set(proposal.pk, grade)
      const valid = [...proposalGrades.values()].some(n => n) // Any grade set?
      if (!valid) return emit('update:modelValue') // Clear vote on unvalid
      emit('update:modelValue', {
        ranking: props.proposals.map(p => [p.pk, proposalGrades.get(p.pk) || 0])
      })
    }

    return {
      grades: GRADES,
      setGrade,
      proposalGrades
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
  .rating
    flex: 1 0 auto
    .mdi
      cursor: pointer
      margin-right: .4em
      &:last-child
        margin-right: 0
    .active
      color: rgb(var(--v-theme-success-darken-2))
</style>
