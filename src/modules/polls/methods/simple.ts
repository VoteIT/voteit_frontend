import { ThemeColor } from '@/utils/types'
import { SimpleChoice, SimpleChoiceDesc } from './types'

export const simpleChoices: readonly SimpleChoiceDesc[] = [
  {
    value: SimpleChoice.Yes,
    icon: 'mdi-thumb-up',
    getTitle(t) {
      return t('poll.approve')
    },
    color: ThemeColor.Success
  },
  {
    value: SimpleChoice.No,
    icon: 'mdi-thumb-down',
    getTitle(t) {
      return t('poll.deny')
    },
    color: ThemeColor.Warning
  },
  {
    value: SimpleChoice.Abstain,
    icon: 'mdi-cancel',
    getTitle(t) {
      return t('poll.abstain')
    },
    color: ThemeColor.Secondary
  }
] as const
