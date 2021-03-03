<template>
  <div>
    <Proposal read-only :p="p" v-for="p in proposals" :key="p.pk">
      <template v-slot:bottom>
        <div class="grade">
          <Icon @click="setGrade(p, 0)" :class="{ active: !proposalGrades.get(p.pk) }">close</Icon>
          <Icon :name="n <= proposalGrades.get(p.pk) ? 'star' : 'star_outline'" v-for="n in grades" :key="n" @click="setGrade(p, n)"
                :class="{ active: n <= proposalGrades.get(p.pk) }" />
        </div>
      </template>
    </Proposal>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, reactive, watch } from 'vue'

import ProposalComponent from '@/components/widgets/Proposal.vue'

import { Poll, Proposal } from '@/contentTypes/types'
import { SchulzeVote } from './types'

const GRADES: number[] = [1, 2, 3, 4, 5]

export default defineComponent({
  name: 'SchulzePoll',
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

    // Watch existing vote value from Vote modal
    watch(() => props.modelValue, (vote?: SchulzeVote) => {
      for (const [key, value] of vote?.ranking || []) {
        proposalGrades.set(key, value)
      }
    })

    function setGrade (proposal: Proposal, grade: number) {
      proposalGrades.set(proposal.pk, grade)
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
  .active
    color: red
  .material-icons
    cursor: pointer
</style>
