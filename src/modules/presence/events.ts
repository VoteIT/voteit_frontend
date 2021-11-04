import TypedEvent from '@/utils/TypedEvent'
import { PresenceCheck } from '@/contentTypes/types'

export const presenceCheckClosed = new TypedEvent<PresenceCheck>()
