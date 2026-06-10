import ContentType from '@/contentTypes/ContentType'
import { Vote } from '@/contentTypes/types'
import { Poll, PollState } from './types'

export const pollType = new ContentType<
  Poll,
  | 'cancel'
  | 'close'
  | 'make_ongoing'
  | 'make_upcoming'
  | 'publish_result'
  | 'unpublish'
  | 'withhold_result'
>({
  states: {
    name: 'PollStateMachine',
    meta: {
      [PollState.Private]: {
        icon: 'mdi-eye-off',
        priority: 6,
        translate: (t, count = 1) => t('poll.workflow.private', count)
      },
      [PollState.Upcoming]: {
        icon: 'mdi-progress-clock',
        priority: 2,
        translate: (t, count = 1) => t('poll.workflow.upcoming', count)
      },
      [PollState.Ongoing]: {
        icon: 'mdi-play-circle',
        priority: 1,
        translate: (t, count = 1) => t('poll.workflow.ongoing', count)
      },
      [PollState.Closed]: {
        icon: 'mdi-gavel',
        priority: 3,
        translate: (t, count = 1) => t('poll.workflow.closed', count)
      },
      [PollState.Finished]: {
        icon: 'mdi-check',
        priority: 4,
        translate: (t, count = 1) => t('poll.workflow.finished', count)
      },
      [PollState.Canceled]: {
        icon: 'mdi-cancel',
        priority: 7,
        translate: (t, count = 1) => t('poll.workflow.canceled', count)
      },
      [PollState.Failed]: {
        icon: 'mdi-alert',
        priority: 8,
        translate: (t, count = 1) => t('poll.workflow.failed', count)
      },
      [PollState.NoResult]: {
        icon: 'mdi-cancel',
        priority: 9,
        translate: (t, count = 1) => t('poll.workflow.no_result', count)
      },
      [PollState.Withheld]: {
        icon: 'mdi-eye-off',
        priority: 5,
        translate: (t, count = 1) => t('poll.workflow.withheld', count)
      }
    }
  },
  name: 'poll',
  restEndpoint: 'polls/'
})

export const voteType = new ContentType<Vote>({
  name: 'vote'
})
