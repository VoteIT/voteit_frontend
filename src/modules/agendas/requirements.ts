import channelFromParam from '@/loader/channelRequirement'

import { agendaItemChannel } from './contentTypes'

/**
 * The channel carrying an agenda item's proposals, discussions and polls,
 * for any route naming one in its `:aid` param.
 */
export const agendaItemRequirement = channelFromParam(agendaItemChannel, 'aid')
