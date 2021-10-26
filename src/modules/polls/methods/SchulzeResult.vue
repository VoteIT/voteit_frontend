<template>
  <div>
    <p>
      {{ t('poll.schulze.numTiedWinners', tiedWinners.length, { count: tiedWinners.length }) }}
    </p>
    <p v-if="tiedWinners.length">
      {{ tiedWinners.join(', ') }}
    </p>
    <slot/>
  </div>
</template>

<script lang="ts">
import useProposals from '@/modules/proposals/useProposals'
import { computed, defineComponent, inject, PropType } from 'vue'

import { SchulzeResult } from './types'

export default defineComponent({
  props: {
    data: {
      type: Object as PropType<SchulzeResult>,
      required: true
    }
  },
  setup (props) {
    const t = inject('t') as CallableFunction
    const { getProposal } = useProposals()
    const tiedWinners = computed(() => {
      if (!props.data.tied_winners) return []
      return props.data.tied_winners.map(pk => {
        const prop = getProposal(pk)
        return prop ? '#' + prop.prop_id : t('proposal.unknown')
      })
    })

    return {
      getProposal,
      tiedWinners,
      t
    }
  }
})
</script>
