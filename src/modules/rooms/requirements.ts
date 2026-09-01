import channelFromParam from '@/loader/channelRequirement'

import { roomChannel } from './contentTypes'

/**
 * The channel carrying a meeting room - what it's showing, who's broadcasting,
 * the speaker system - for any route naming one in its `:roomId` param.
 */
export const roomRequirement = channelFromParam(roomChannel, 'roomId')
