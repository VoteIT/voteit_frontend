<template>
  <div>
    <proposal read-only :p="p" v-for="p in proposals" :key="p.pk">
      <template v-slot:bottom>
        <div class="grade">
          <icon name="close" @click="setGrade(p, 0)" :class="{ active: !proposalGrades.get(p.pk) }" />
          <icon :name="n <= proposalGrades.get(p.pk) ? 'star' : 'star_outline'" v-for="n in grades" :key="n" @click="setGrade(p, n)"
                :class="{ active: n <= proposalGrades.get(p.pk) }" />
        </div>
      </template>
    </proposal>
  </div>
</template>

<script>
import Proposal from '@/components/widgets/Proposal'
import { reactive, watch } from 'vue'

const GRADES = [1, 2, 3, 4, 5]

export default {
  name: 'SchulzePoll',
  props: {
    proposals: Array,
    modelValue: Object
  },
  components: {
    Proposal
  },
  setup (props, { emit }) {
    const proposalGrades = reactive(new Map())

    // Watch existing vote value from Vote modal
    watch(_ => props.modelValue, vote => {
      if (vote && vote.ranking) {
        vote.ranking.forEach(([key, value]) => {
          proposalGrades.set(key, value)
        })
      }
    })

    function setGrade (proposal, grade) {
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
}
</script>

<style lang="sass" scoped>
.grade
  text-align: center
  .active
    color: red
  .material-icons
    cursor: pointer
</style>
