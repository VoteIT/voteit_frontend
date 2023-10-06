import { ComposerTranslation } from 'vue-i18n'
import { PollCriteria } from './types'

export function translateCriteria (criteria: PollCriteria, t: ComposerTranslation): { description: string, title: string } {
  switch (criteria) {
    case PollCriteria.CloneProof:
      return {
        description: t('poll.criterion.cloneProof.description'),
        title: t('poll.criterion.cloneProof.title')
      }
    case PollCriteria.CondorcetLoser:
      return {
        description: t('poll.criterion.condorcetLoser.description'),
        title: t('poll.criterion.condorcetLoser.title')
      }
    case PollCriteria.CondorcetWinner:
      return {
        description: t('poll.criterion.condorcetWinner.description'),
        title: t('poll.criterion.condorcetWinner.title')
      }
    case PollCriteria.MajorityLoser:
      return {
        description: t('poll.criterion.majorityLoser.description'),
        title: t('poll.criterion.majorityLoser.title')
      }
    case PollCriteria.MajorityWinner:
      return {
        description: t('poll.criterion.majorityWinner.description'),
        title: t('poll.criterion.majorityWinner.title')
      }
    case PollCriteria.MutualMajority:
      return {
        description: t('poll.criterion.mutualMajority.description'),
        title: t('poll.criterion.mutualMajority.title')
      }
    case PollCriteria.Proportional:
      return {
        description: t('poll.criterion.proportional.description'),
        title: t('poll.criterion.proportional.title')
      }
  }
}
