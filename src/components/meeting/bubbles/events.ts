import TypedEvent from '@/utils/TypedEvent'

import { BubbleActivation, BubbleComponent } from './types'

export const activateBubbleEvent = new TypedEvent<BubbleActivation>()
export const openBubbleEvent = new TypedEvent<BubbleComponent>()
export const closeBubbleEvent = new TypedEvent<BubbleComponent>()
export const removeBubbleEvent = new TypedEvent<BubbleComponent>()
