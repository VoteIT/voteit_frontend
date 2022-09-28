<template>
  <v-list bg-color="background">
    <v-list-item v-for="{ proposal, choices } in results" :key="proposal?.pk">
      <v-list-item-title class="mb-1">
        <Tag :name="proposal ? proposal.prop_id : t('proposal.unknown')" />
      </v-list-item-title>
      <div>
        <v-btn v-for="{ btn, key, percentage, value } in choices" :key="key" v-bind="btn" class="mb-3">
          {{ value }}
          <small v-if="percentage" class="ml-1">
            ({{ percentage }} %)
          </small>
        </v-btn>
      </div>
    </v-list-item>
  </v-list>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { useI18n } from 'vue-i18n'

import useProposals from '@/modules/proposals/useProposals'
import { Proposal } from '@/modules/proposals/types'

import { SimpleProposalResult, simpleChoices, SimpleChoice, CombinedSimpleResult } from './types'
import { ThemeColor } from '@/utils/types'

interface ProposalResult {
  proposal?: Proposal
  choices: {
    key: string
    percentage?: number
    value: number
    btn: {
      variant: 'text' | 'elevated'
      color: ThemeColor
      prependIcon: string
    }
  }[]
}

export default defineComponent({
  props: {
    abstainCount: {
      type: Number,
      required: true
    },
    result: {
      type: Object as PropType<CombinedSimpleResult>,
      required: true
    }
  },
  setup (props) {
    const { t } = useI18n()
    const { getProposal } = useProposals()

    function getActiveChoice (pk: number): SimpleChoice | undefined {
      if (props.result.approved.includes(pk)) return SimpleChoice.Yes
      if (props.result.denied.includes(pk)) return SimpleChoice.No
    }
    function transformResult ([_pk, result]: [string, SimpleProposalResult]): ProposalResult {
      const pk = Number(_pk)
      const total = result[SimpleChoice.Yes] + result[SimpleChoice.No]
      return {
        proposal: getProposal(pk),
        choices: simpleChoices
          .map(c => {
            const activeChoice = getActiveChoice(pk)
            // Add poll abstain_count to abstains
            const value = c.value === SimpleChoice.Abstain
              ? result[c.value] + props.abstainCount
              : result[c.value]
            const percentage = c.value === SimpleChoice.Abstain
              ? undefined
              : Math.round(value / total * 100)
            return {
              key: c.value,
              percentage,
              value,
              btn: {
                variant: activeChoice === c.value
                  ? 'elevated'
                  : 'text',
                color: c.color,
                prependIcon: c.icon
              }
            }
          })
      }
    }

    const results = computed(() => {
      return Object.entries(props.result.results)
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
