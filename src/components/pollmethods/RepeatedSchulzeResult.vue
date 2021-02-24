<template>
  <div>
    <h3>Repeated Schulze result</h3>
    <div class="proposals">
      <Proposal v-for="(proposal, i) in orderedProposals" :key="i" :selected="proposal && data.approved.includes(proposal.pk)" :p="proposal" read-only>
        <template v-slot:top>
          <span class="ordinal">{{ i+1 }}</span>
        </template>
      </Proposal>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'

import useProposals from '@/composables/meeting/useProposals'

import Proposal from '@/components/widgets/Proposal.vue'

import { RepeatedSchulzeResult } from './types'

export default defineComponent({
  props: {
    data: {
      type: Object as PropType<RepeatedSchulzeResult>,
      required: true
    }
  },
  inject: ['t'],
  components: {
    Proposal
  },
  setup (props) {
    const { getProposal } = useProposals()

    const orderedProposals = computed(() => {
      return props.data.rounds.map(round => {
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
.proposal
  position: relative
  .ordinal
    position: absolute
    right: 8px
    top: 5px
    font-weight: bold
    font-size: 20pt
</style>
