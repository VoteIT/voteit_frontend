<template>
  <div>
    <v-list>
      <v-list-item disabled v-for="{ proposal, choices } in results" :key="proposal?.pk">
        <div>
          <v-list-item-title class="mb-1">
            <Tag :name="proposal ? proposal.prop_id : t('proposal.unknown')" />
          </v-list-item-title>
          <span class="btn-group">
            <v-btn v-for="{ key, value, btn } in choices" :key="key" size="small" v-bind="btn">{{ value }}</v-btn>
          </span>
        </div>
      </v-list-item>
    </v-list>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { useI18n } from 'vue-i18n'

import useProposals from '@/modules/proposals/useProposals'
import { Proposal } from '@/modules/proposals/types'

import { CombinedSimpleResult, SimpleProposalResult, simpleChoices, SimpleChoice } from './types'
import { ThemeColor } from '@/utils/types'

interface ProposalResult {
  proposal?: Proposal
  choices: {
    key: string
    value: number
    btn: {
      variant: 'contained' | 'text'
      color: ThemeColor
      prependIcon: string
    }
  }[]
}

export default defineComponent({
  props: {
    data: {
      type: Object as PropType<CombinedSimpleResult>,
      required: true
    }
  },
  setup (props) {
    const { t } = useI18n()
    const { getProposal } = useProposals()
    function getActiveChoice (pk: number): SimpleChoice | undefined {
      if (props.data.approved.includes(pk)) return SimpleChoice.Yes
      if (props.data.denied.includes(pk)) return SimpleChoice.No
    }
    function transformResult ([_pk, result]: [string, SimpleProposalResult]): ProposalResult {
      const pk = Number(_pk)
      return {
        proposal: getProposal(pk),
        choices: simpleChoices.map(c => {
          const activeChoice = getActiveChoice(pk)
          return {
            key: c.value,
            value: result[c.value],
            btn: {
              variant: activeChoice === c.value ? 'contained' : 'text',
              color: c.color,
              prependIcon: c.icon
            }
          }
        })
      }
    }

    const results = computed(() => {
      return Object.entries(props.data.results)
        .map(transformResult)
    })

    return {
      t,
      results,
      getProposal
    }
  }
})
</script>
