<template>
  <v-expansion-panels class="my-4" multiple>
    <v-expansion-panel v-for="{ proposal, votes } in results" :key="proposal.pk">
      <v-expansion-panel-title>
        <div class="d-flex flex-grow-1">
          <Tag :name="proposal.prop_id" />
          <div class="text-center flex-grow-1">
            {{ t('poll.result.voteCount', votes) }}
          </div>
        </div>
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <Proposal :p="proposal" readOnly />
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { useI18n } from 'vue-i18n'

import Tag from '@/components/Tag.vue'
import useProposals from '../../proposals/useProposals'
import Proposal from '../../proposals/Proposal.vue'
import { DuttResult } from './types'

const { getProposal } = useProposals()

export default defineComponent({
  components: {
    Proposal,
    Tag
  },
  props: {
    result: {
      type: Object as PropType<DuttResult>,
      required: true
    }
  },
  setup (props) {
    const { t } = useI18n()

    return {
      t,
      results: computed(() => {
        return props.result.results.map(({ proposal, votes }) => {
          return {
            proposal: getProposal(proposal),
            votes
          }
        })
      })
    }
  }
})
</script>
