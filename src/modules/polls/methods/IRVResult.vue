<template>
  <div>
    <h3>{{ t('poll.IRV.numRounds', { count: data.rounds.length }, data.rounds.length) }}</h3>
    <ol>
      <li v-for="(round, i) in data.rounds" :key="i">
        {{ round.status }} {{ round.selected.map(pk => '#' + getProposal(pk).prop_id).join(', ') }}
      </li>
    </ol>
    <slot/>
  </div>
</template>

<script lang="ts">
import useProposals from '@/modules/proposals/useProposals'
import { defineComponent, PropType } from 'vue'

import { SimpleVoteResult } from './types'

export default defineComponent({
  props: {
    data: {
      type: Object as PropType<SimpleVoteResult>,
      required: true
    }
  },
  inject: ['t'],
  setup () {
    const { getProposal } = useProposals()
    return {
      getProposal
    }
  }
})
</script>
