import { Component } from 'vue'

import { SchemaGenerator } from '@/components/inputs/types'
import PluginHandler, { MeetingPlugin } from '../meetings/PluginHandler'
import { PollMethodCriterion, PollMethodSettings } from './methods/types'

export interface PollPlugin extends MeetingPlugin {
  // checkAvailable (proposalCaount: number): boolean
  criterion: PollMethodCriterion
  discouraged?: boolean
  // losersMin?: number
  getSchema?: SchemaGenerator
  initialSettings?: PollMethodSettings
  multipleWinners?: boolean
  proposalsMax?: number
  proposalsMin: number
  resultComponent: Component
  voteComponent: Component
  // winnersMin?: number
}

class PollPluginHandler extends PluginHandler<PollPlugin> {
  public getAvailableMethods (proposalCount: number) {
    // Get poll methods available for number of proposals
    return [...this.iterPlugins(({ proposalsMax, proposalsMin }) => proposalCount >= proposalsMin && (!proposalsMax || proposalCount <= proposalsMax))]
  }
}

export const pollPlugins = new PollPluginHandler()
