import PluginHandler from '@/utils/PluginHandler'
import { Meeting } from '../meetings/types'
import { ProposalButtonMode, ProposalButtonPlugin } from './types'

class PBPluginHandler<
  T extends ProposalButtonPlugin = ProposalButtonPlugin
> extends PluginHandler<T> {
  public getActivePlugins(meeting: Meeting, mode?: ProposalButtonMode): T[] {
    return this.getPlugins(
      (p) => !p.checkActive || p.checkActive(meeting, mode)
    )
  }
}

export const proposalButtonPlugins = new PBPluginHandler()
