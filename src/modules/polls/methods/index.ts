import useOrganisation from '@/modules/organisations/useOrganisation'
import { PollPlugin, pollPlugins } from '../registry'

import Dutt from './Approval.vue'
import Majority from './Majority.vue'
import RankedVoting from './RankedVoting.vue'
import Simple from './Simple.vue'
import Schulze from './Schulze.vue'
import DuttResult from './ApprovalResult.vue'
import MajorityResult from './MajorityResult.vue'
import RepeatedSchulzeResult from './RepeatedSchulzeResult.vue'
import RepeatedIRVResult from './RepeatedIRVResult.vue'
import SimpleResult from './SimpleResult.vue'
import SchulzeResult from './SchulzeResult.vue'
import STVResult from './STVResult.vue'
import SchulzeSettings from './SchulzeSettings.vue'
import RepeatedSchulzeSettings from './RepeatedSchulzeSettings.vue'
import IRVSettings from './IRVSettings.vue'
import ScottishSTVSettings from './ScottishSTVSettings.vue'
import ApprovalSettings from './ApprovalSettings.vue'
import RepeatedIRVSettings from './RepeatedIRVSettings.vue'

const { getOrganisationComponent } = useOrganisation()

pollPlugins.register({
  id: 'combined_simple',
  criterion: {
    majorityWinner: true,
    majorityLoser: true
  },
  getDescription(t) {
    return t('poll.method.description.combined_simple')
  },
  getHelp(t) {
    return t('poll.method.help.combined_simple')
  },
  getName(t) {
    return t('poll.method.combined_simple')
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
  getDefaultSettings(proposals) {
    return {
      deny_proposal: proposals === 2,
      stars: 5
    }
  },
  getDescription(t) {
    return t('poll.method.description.schulze')
  },
  getHelp(t) {
    return t('poll.method.help.schulze')
  },
  getName(t) {
    return t('poll.method.schulze')
  },
  proposalsMin: 2,
  resultComponent: SchulzeResult,
  settingsComponent: SchulzeSettings,
  voteComponent: Schulze
} as PollPlugin)

pollPlugins.register({
  id: 'majority',
  criterion: {
    majorityWinner: true,
    majorityLoser: true
  },
  getDescription(t) {
    return t('poll.method.description.majority')
  },
  getHelp(t) {
    return t('poll.method.help.majority')
  },
  getName(t) {
    return t('poll.method.majority')
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
  getDefaultSettings(proposals) {
    return {
      deny_proposal: proposals === 2,
      stars: 5,
      winners: null
    }
  },
  getDescription(t) {
    return t('poll.method.description.repeated_schulze')
  },
  getHelp(t) {
    return t('poll.method.help.repeated_schulze')
  },
  getName(t) {
    return t('poll.method.repeated_schulze')
  },
  multipleWinners: true,
  proposalsMin: 2,
  resultComponent: RepeatedSchulzeResult,
  settingsComponent: RepeatedSchulzeSettings,
  voteComponent: Schulze
} as PollPlugin)

pollPlugins.register({
  id: 'scottish_stv',
  criterion: {
    proportional: true,
    condorcetLoser: false,
    condorcetWinner: false,
    majorityLoser: false,
    majorityWinner: false
  },
  getDefaultSettings() {
    return {
      allow_random: true,
      winners: 2
    }
  },
  getDescription(t) {
    return t('poll.method.description.scottish_stv')
  },
  getHelp(t) {
    return t('poll.method.help.scottish_stv')
  },
  getName(t) {
    return t('poll.method.scottish_stv')
  },
  multipleWinners: true,
  proposalsMin: 3,
  resultComponent: STVResult,
  settingsComponent: ScottishSTVSettings,
  voteComponent: RankedVoting
} as PollPlugin)

pollPlugins.register({
  id: 'irv',
  criterion: {
    cloneProof: true,
    mutualMajority: true,
    majorityLoser: false,
    majorityWinner: false,
    proportional: false
  },
  getDefaultSettings() {
    return {
      allow_random: true
    }
  },
  getDescription(t) {
    return t('poll.method.description.irv')
  },
  getHelp(t) {
    return t('poll.method.help.irv')
  },
  getName(t) {
    return t('poll.method.irv')
  },
  proposalsMin: 3,
  resultComponent: STVResult,
  settingsComponent: IRVSettings,
  voteComponent: RankedVoting
} as PollPlugin)

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
  getDefaultSettings() {
    return {
      max: 0,
      min: 1
    }
  },
  getDescription(t) {
    return t('poll.method.description.dutt')
  },
  getHelp(t) {
    return t('poll.method.help.dutt')
  },
  getName(t) {
    return t('poll.method.dutt')
  },
  proposalsMin: 3,
  resultComponent: DuttResult,
  settingsComponent: ApprovalSettings,
  voteComponent: Dutt
} as PollPlugin)

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
  getDefaultSettings() {
    return {
      allow_random: true,
      max: 0,
      min: 1,
      winners: 2
    }
  },
  getDescription(t) {
    return t('poll.method.description.repeated_irv')
  },
  getHelp(t) {
    return t('poll.method.help.repeated_irv')
  },
  getName(t) {
    return t('poll.method.repeated_irv')
  },
  proposalsMin: 3,
  resultComponent: RepeatedIRVResult,
  settingsComponent: RepeatedIRVSettings,
  voteComponent: RankedVoting
} as PollPlugin)
