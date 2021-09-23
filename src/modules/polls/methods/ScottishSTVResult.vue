<template>
  <div>
    <h3>{{ t('poll.STV.numRounds', { count: data.rounds.length }, data.rounds.length) }}</h3>
    <ol>
      <li v-for="(round, i) in data.rounds" :key="i">
        {{ round.status }} {{ round.selected.map(pk => '#' + (getProposal(pk)?.prop_id ?? t('proposal.notFound'))).join(', ') }} ({{ round.method }})
      </li>
    </ol>
    <template v-for="([key, value], i) in metadata" :key="i">
      {{ key }}: {{ value }}<br />
    </template>
    <slot/>
  </div>
</template>

<script lang="ts">
import useProposals from '@/modules/proposals/useProposals'
import { computed, defineComponent, inject, PropType } from 'vue'

import { ScottishSTVResult } from './types'

export default defineComponent({
  inject: ['t'],
  props: {
    data: {
      type: Object as PropType<ScottishSTVResult>,
      required: true
    }
  },
  setup (props) {
    const { getProposal } = useProposals()
    const t = inject('t') as CallableFunction

    const metadata = computed(() => [
      [t('poll.result.quota'), props.data.quota],
      [t('poll.result.complete'), props.data.complete ? t('yes') : t('no')],
      [t('poll.result.randomized'), props.data.randomized ? t('yes') : t('no')],
      [t('poll.result.runtime'), props.data.runtime.toFixed(3) + ' seconds']
    ])

    return {
      getProposal,
      metadata,
      t
    }
  }
})
</script>
