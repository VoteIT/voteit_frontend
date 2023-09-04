import { ComposerTranslation } from 'vue-i18n'

import createFormSchema from '@/utils/createFormSchema'
import useOrganisation from '@/modules/organisations/useOrganisation'
import { pollPlugins } from '../registry'

import Dutt from './Dutt.vue'
import Majority from './Majority.vue'
import RankedVoting from './RankedVoting.vue'
import Simple from './Simple.vue'
import Schulze from './Schulze.vue'

import DuttResult from './DuttResult.vue'
import MajorityResult from './MajorityResult.vue'
import RepeatedSchulzeResult from './RepeatedSchulzeResult.vue'
import RepeatedIRVResult from './RepeatedIRVResult.vue'
import SimpleResult from './SimpleResult.vue'
import SchulzeResult from './SchulzeResult.vue'
import STVResult from './STVResult.vue'

const { getOrganisationComponent } = useOrganisation()

function getSchulzeSchema (t: ComposerTranslation, proposals: number) {
  return {
    properties: {
      stars: {
        type: 'number',
        label: t('poll.schulze.numberOfStars'),
        maximum: 20,
        minimum: 3
      },
      deny_proposal: {
        type: 'boolean',
        label: t('poll.schulze.addDenyProposal')
      }
    },
    required: proposals < 3
      ? ['deny_proposal', 'stars']
      : ['stars']
  } as const
}

pollPlugins.register({
  id: 'combined_simple',
  criterion: {
    majorityWinner: true,
    majorityLoser: true
  },
  proposalsMin: 1,
  resultComponent: SimpleResult,
  voteComponent: Simple
})

pollPlugins.register({
  id: 'schulze',
  criterion: {
    cloneProof: true,
    condorcetLoser: true,
    condorcetWinner: true,
    majorityLoser: true,
    majorityWinner: true,
    mutualMajority: true
  },
  getSchema (t, proposals) {
    return createFormSchema(t, getSchulzeSchema(t, proposals))
  },
  initialSettings: {
    stars: 5
  },
  proposalsMin: 2,
  resultComponent: SchulzeResult,
  voteComponent: Schulze
})

pollPlugins.register({
  id: 'majority',
  criterion: {
    majorityWinner: true,
    majorityLoser: true
  },
  proposalsMin: 2,
  proposalsMax: 2,
  resultComponent: MajorityResult,
  voteComponent: Majority
})

pollPlugins.register({
  id: 'repeated_schulze',
  criterion: {
    cloneProof: true,
    condorcetLoser: true,
    condorcetWinner: true,
    majorityLoser: true,
    majorityWinner: true,
    proportional: false
  },
  getSchema (t, proposals) {
    const { properties, required } = getSchulzeSchema(t, proposals)
    return createFormSchema(t, {
      properties: {
        winners: {
          type: 'number',
          label: t('winners'),
          hint: t('poll.repeated_schulze.winnersHint'),
          minimum: 1,
          maximum: proposals - 1
        },
        ...properties
      },
      required
    })
  },
  initialSettings: {
    winners: 2,
    stars: 5
  },
  multipleWinners: true,
  proposalsMin: 3,
  resultComponent: RepeatedSchulzeResult,
  voteComponent: Schulze
})

pollPlugins.register({
  id: 'scottish_stv',
  criterion: {
    proportional: true,
    condorcetLoser: false,
    condorcetWinner: false,
    majorityLoser: false,
    majorityWinner: false
  },
  getSchema (t, proposals) {
    return createFormSchema(t, {
      properties: {
        winners: {
          type: 'number',
          label: t('winners'),
          minimum: 1,
          maximum: proposals - 1
        },
        allow_random: {
          type: 'boolean',
          label: t('poll.allowRandomTiebreaker')
        }
      },
      required: ['winners']
    })
  },
  initialSettings: {
    winners: 2,
    allow_random: true
  },
  multipleWinners: true,
  proposalsMin: 3,
  resultComponent: STVResult,
  voteComponent: RankedVoting
})

pollPlugins.register({
  id: 'irv',
  criterion: {
    cloneProof: true,
    mutualMajority: true,
    majorityLoser: false,
    majorityWinner: false,
    proportional: false
  },
  getSchema (t) {
    return createFormSchema(t, {
      properties: {
        allow_random: {
          type: 'boolean',
          label: t('poll.allowRandomTiebreaker')
        }
      }
    })
  },
  initialSettings: {
    allow_random: true
  },
  proposalsMin: 3,
  resultComponent: STVResult,
  voteComponent: RankedVoting
})

pollPlugins.register({
  id: 'dutt',
  criterion: {
    cloneProof: false,
    condorcetLoser: false,
    condorcetWinner: false,
    majorityLoser: false,
    majorityWinner: false,
    mutualMajority: false,
    proportional: false
  },
  discouraged: true,
  getSchema (t, proposals) {
    return createFormSchema(t, {
      properties: {
        min: {
          type: 'number',
          label: t('poll.dutt.min'),
          minimum: 0,
          // Don't allow requiring to select all proposals
          maximum: proposals - 1,
          hint: t('poll.dutt.minMaxHint')
        },
        max: {
          type: 'number',
          label: t('poll.dutt.max'),
          minimum: 0,
          maximum: proposals,
          hint: t('poll.dutt.minMaxHint')
        }
      }
    })
  },
  initialSettings: {
    min: 0,
    max: 0
  },
  proposalsMin: 3,
  resultComponent: DuttResult,
  voteComponent: Dutt
})

pollPlugins.register({
  id: 'repeated_irv',
  criterion: {
    cloneProof: true,
    mutualMajority: true,
    majorityLoser: false,
    majorityWinner: false,
    proportional: false
  },
  discouraged: true,
  checkActive: () => !!getOrganisationComponent('repeated_irv'),
  getSchema (t, proposals) {
    return createFormSchema(t, {
      properties: {
        winners: {
          type: 'number',
          label: t('winners'),
          minimum: 2,
          maximum: proposals
        },
        allow_random: {
          type: 'boolean',
          label: t('poll.allowRandomTiebreaker')
        }
      },
      required: ['winners']
    })
  },
  initialSettings: {
    allow_random: true,
    winners: 2
  },
  proposalsMin: 3,
  resultComponent: RepeatedIRVResult,
  voteComponent: RankedVoting
})
