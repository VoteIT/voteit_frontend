<template>
  <div>
    <h3>Combined Simple result</h3>
    <ul>
      <li v-for="[proposal, voteCount] in results" :key="proposal?.pk">
        #{{ proposal ? proposal.prop_id : t('proposal.unknown') }}:
        <span class="btn-group">
          <btn v-for="[icon, value] in voteCount" :key="icon" sm :icon="icon" disabled>{{ value }}</btn>
        </span>
      </li>
    </ul>
    <slot/>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'

import useProposals from '@/modules/proposals/useProposals'
import { Proposal } from '@/contentTypes/types'
import { CombinedSimpleResult, CombinedSimpleProposalResult, simpleIcons, SimpleChoice } from './types'

export default defineComponent({
  props: {
    data: {
      type: Object as PropType<CombinedSimpleResult>,
      required: true
    }
  },
  inject: ['t'],
  setup (props) {
    const { getProposal } = useProposals()
    function transformResult ([pk, result]: [string, CombinedSimpleProposalResult]): [Proposal | undefined, [string, number][]] {
      return [
        getProposal(Number(pk)),
        Object.entries(result).map(
          ([key, value]) => [simpleIcons[key as SimpleChoice], value]
        )]
    }

    const results = computed(() => {
      return Object.entries(props.data.results)
        .map(transformResult)
    })

    return {
      getProposal,
      results
    }
  }
})
</script>
