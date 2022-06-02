<template>
  <div>
    <Proposal v-for="proposal, i in orderedProposals" :key="proposal.pk" :selected="proposal && result.approved.includes(proposal.pk)" :p="proposal" read-only class="my-4">
      <template #top>
        <span class="ordinal">{{ i+1 }}</span>
      </template>
    </Proposal>
    <v-expansion-panels>
      <v-expansion-panel v-for="(round, i) in result.rounds" :key="i" :title="t('poll.result.roundNum', i+1)">
        <v-expansion-panel-text>
          <SchulzeResult :result="round" :abstainCount="abstainCount" />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { useI18n } from 'vue-i18n'

import useProposals from '@/modules/proposals/useProposals'

import { RepeatedSchulzeResult } from './types'
import SchulzeResultVue from './SchulzeResult.vue'

export default defineComponent({
  props: {
    abstainCount: {
      type: Number,
      required: true
    },
    result: {
      type: Object as PropType<RepeatedSchulzeResult>,
      required: true
    }
  },
  components: {
    SchulzeResult: SchulzeResultVue
  },
  setup (props) {
    const { t } = useI18n()
    const { getProposal } = useProposals()

    const orderedProposals = computed(() => {
      return props.result.rounds
        .map(round => getProposal(round.winner))
        .filter(p => p)
    })
    return {
      t,
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
