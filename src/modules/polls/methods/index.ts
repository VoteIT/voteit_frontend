import { FieldType } from '@/components/types'
import { SchemaGenerator } from '@/components/inputs/types'
import { required } from '@/utils/rules'
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

const getSchulzeSchema: SchemaGenerator = (t, proposals) => {
  return [
    {
      name: 'stars',
      type: FieldType.Number,
      label: t('poll.schulze.numberOfStars'),
      rules: [required],
      min: 3,
      max: 20
    },
    {
      name: 'deny_proposal',
      type: FieldType.Checkbox,
      rules: proposals < 3
        ? [required]
        : [],
      label: t('poll.schulze.addDenyProposal')
    }
  ]
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
  getSchema: getSchulzeSchema,
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
    return [
      {
        name: 'winners',
        type: FieldType.Number,
        label: t('winners'),
        min: 1,
        max: proposals,
        rules: [required]
      },
      ...getSchulzeSchema(t, proposals)
    ]
  },
  initialSettings: {
    winners: 2,
    stars: 5
  },
  multipleWinners: true,
  proposalsMin: 3,
  resultComponent: RepeatedSchulzeResult,
  voteComponent: Schulze
  // winnersMin: 2,
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
    return [{
      name: 'winners',
      type: FieldType.Number,
      label: t('winners'),
      min: 1,
      max: proposals - 1,
      rules: [required]
    },
    {
      name: 'allow_random',
      type: FieldType.Checkbox,
      label: t('poll.allowRandomTiebreaker')
    }]
  },
  initialSettings: {
    winners: 2,
    allow_random: true
  },
  // losersMin: 1,
  multipleWinners: true,
  proposalsMin: 3,
  resultComponent: STVResult,
  voteComponent: RankedVoting
  // winnersMin: 2
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
    return [{
      name: 'allow_random',
      type: FieldType.Checkbox,
      label: t('poll.allowRandomTiebreaker')
    }]
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
    return ['min', 'max'].map(name => {
      // Don't allow requiring to select all proposals
      const max = name === 'min'
        ? proposals - 1
        : proposals
      return {
        name,
        type: FieldType.Number,
        label: t(`poll.dutt.${name}`),
        hint: t('poll.dutt.minMaxHint'),
        min: 0,
        max
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
    return [
      {
        name: 'winners',
        type: FieldType.Number,
        label: t('winners'),
        min: 2,
        max: proposals,
        rules: [required]
      },
      {
        name: 'allow_random',
        type: FieldType.Checkbox,
        label: t('poll.allowRandomTiebreaker')
      }
    ]
  },
  initialSettings: {
    allow_random: true,
    winners: 2
  },
  proposalsMin: 3,
  resultComponent: RepeatedIRVResult,
  voteComponent: RankedVoting
})
