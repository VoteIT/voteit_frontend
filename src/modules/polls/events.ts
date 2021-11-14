import TypedEvent from '@/utils/TypedEvent'

import { Poll } from './methods/types'

export const pollStartedEvent = new TypedEvent<Poll>()
