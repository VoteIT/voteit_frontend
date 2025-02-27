import { Component } from 'vue'

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

interface ProposalTypeProvider {
  editComponent: Component
}

export const proposalTypeRegistry = (() => {
  const proposalTypes = new Map<string, ProposalTypeProvider>()

  function register(name: string, provider: ProposalTypeProvider) {
    proposalTypes.set(name, provider)
  }

  function getProvider(name: string) {
    if (!proposalTypes.has(name))
      throw new Error(`Unknown proposal type: ${name}`)
    return proposalTypes.get(name)!
  }

  function getEditModal(name: string) {
    return getProvider(name).editComponent
  }

  return {
    register,
    getEditModal
  }
})()
