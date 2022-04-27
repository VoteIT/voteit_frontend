<template>
  <v-list>
    <v-list-item disabled v-for="{ icon, proposal, votes } in proposalResults" :key="proposal?.pk">
      <v-icon size="x-large" v-bind="icon" class="mr-4" />
      <div>
        <v-list-item-title>
          <Tag :name="proposal ? proposal.prop_id : t('proposal.unknown')" />
        </v-list-item-title>
        <v-list-item-subtitle>
          {{ t('poll.result.voteCount', votes) }}
        </v-list-item-subtitle>
      </div>
    </v-list-item>
  </v-list>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { useI18n } from 'vue-i18n'

import { ThemeColor } from '@/utils/types'
import useProposals from '@/modules/proposals/useProposals'
import { MajorityResult } from './types'

export default defineComponent({
  props: {
    abstainCount: {
      type: Number,
      required: true
    },
    result: {
      type: Object as PropType<MajorityResult>,
      required: true
    }
  },
  setup (props) {
    const { t } = useI18n()
    const { getProposal } = useProposals()

    function getIcon (proposal: number): { icon: string, color: string } {
      if (props.result.approved.includes(proposal)) return { icon: 'mdi-thumb-up', color: 'success-darken-2' }
      if (props.result.denied.includes(proposal)) return { icon: 'mdi-thumb-down', color: ThemeColor.Warning }
      return { icon: 'mdi-question', color: ThemeColor.Secondary }
    }

    const proposalResults = computed(() => {
      return props.result.results
        .map(res => ({
          ...res,
          proposal: getProposal(res.proposal),
          icon: getIcon(res.proposal)
        }))
    })
    return {
      t,
      proposalResults
    }
  }
})
</script>
