import useOrganisation from '@/modules/organisations/useOrganisation'
import { PollPlugin, pollPlugins } from '../registry'

import ApprovalVoting from './ApprovalVoting.vue'
import Majority from './Majority.vue'
import RankedVoting from './RankedVoting.vue'
import Simple from './Simple.vue'
import Schulze from './Schulze.vue'
import ApprovalResult from './ApprovalResult.vue'
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
import {
  ApprovalPoll,
  ApprovalVote,
  InstantRunoffPoll,
  MajorityPoll,
  MajorityVote,
  RankedVote,
  RepeatedIRVPoll,
  RepeatedSchulzePoll,
  SchulzePoll,
  SchulzeVote,
  ScottishSTVPoll,
  SimplePoll,
  SimpleVote
} from './types'

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
} as PollPlugin<SimplePoll, SimpleVote>)

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
} as PollPlugin<SchulzePoll, SchulzeVote>)

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
} as PollPlugin<MajorityPoll, MajorityVote>)

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
} as PollPlugin<RepeatedSchulzePoll, SchulzeVote>)

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
  getSelectionRange() {
    return {
      min: 1,
      max: null
    }
  },
  multipleWinners: true,
  proposalsMin: 3,
  resultComponent: STVResult,
  settingsComponent: ScottishSTVSettings,
  voteComponent: RankedVoting
} as PollPlugin<ScottishSTVPoll, RankedVote>)

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
  getSelectionRange() {
    return { min: 1, max: null }
  },
  proposalsMin: 3,
  resultComponent: STVResult,
  settingsComponent: IRVSettings,
  voteComponent: RankedVoting
} as PollPlugin<InstantRunoffPoll, RankedVote>)

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
  resultComponent: ApprovalResult,
  settingsComponent: ApprovalSettings,
  voteComponent: ApprovalVoting
} as PollPlugin<ApprovalPoll, ApprovalVote>)

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
  getSelectionRange({ max, min }) {
    return { max, min }
  },
  proposalsMin: 3,
  resultComponent: RepeatedIRVResult,
  settingsComponent: RepeatedIRVSettings,
  voteComponent: RankedVoting
} as PollPlugin<RepeatedIRVPoll, RankedVote>)
