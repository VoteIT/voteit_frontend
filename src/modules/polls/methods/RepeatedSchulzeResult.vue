<template>
  <Proposal v-for="proposal, i in orderedProposals" :key="proposal.pk" :selected="proposal && result.approved.includes(proposal.pk)" :p="proposal" read-only class="my-4">
    <template #top>
      <span class="ordinal">{{ i+1 }}</span>
    </template>
  </Proposal>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'

import useProposals from '@/modules/proposals/useProposals'
import ProposalVue from '@/modules/proposals/Proposal.vue'

import { RepeatedSchulzeResult } from './types'

export default defineComponent({
  props: {
    result: {
      type: Object as PropType<RepeatedSchulzeResult>,
      required: true
    }
  },
  components: {
    Proposal: ProposalVue
  },
  setup (props) {
    const { getProposal } = useProposals()

    const orderedProposals = computed(() => {
      return props.result.rounds.map(round => {
        return getProposal(round.winner)
      })
    })
    return {
      orderedProposals
    }
  }
})
</script>

<style lang="sass" scoped>
.ordinal
  float: right
  position: relative
  top: -10px
  font-weight: 700
  font-size: 20pt
</style>
