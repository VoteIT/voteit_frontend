import { ComposerTranslation } from 'vue-i18n'

import { ElectoralRegister, ErMethod } from './types'

export function hasWeightedVotes({ weights }: ElectoralRegister) {
  return weights.some(({ weight }) => weight !== 1)
}

export function* iterErAttributes(method: ErMethod, t: ComposerTranslation) {
  if (method.handles_active_check)
    yield {
      icon: 'mdi-account-network',
      text: t('electoralRegister.handlesActiveCheck')
    }
  if (method.handles_vote_weight)
    yield {
      icon: 'mdi-account-plus',
      text: t('electoralRegister.handlesVoteWeight')
    }
  if (method.group_votes_active)
    yield {
      icon: 'mdi-account-group',
      text: t('electoralRegister.groupVotesActive')
    }
  if (method.allow_manual)
    yield {
      icon: 'mdi-book-open-variant',
      text: t('electoralRegister.createManual')
    }
  if (method.allow_trigger)
    yield {
      icon: 'mdi-star-check',
      text: t('electoralRegister.triggerWhenever')
    }
}
