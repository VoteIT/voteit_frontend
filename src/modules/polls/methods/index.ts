/* eslint-disable camelcase */
import { Component } from 'vue'

import Simple from './Simple.vue'
import Schulze from './Schulze.vue'
import RankedVoting from './RankedVoting.vue'

import SimpleResult from './SimpleResult.vue'
import RepeatedSchulzeResult from './RepeatedSchulzeResult.vue'
import SchulzeResult from './SchulzeResult.vue'
import STVResult from './STVResult.vue'

import ScottishSTVSettings from './ScottishSTVSettings.vue'
import RepeatedSchulzeSettings from './RepeatedSchulzeSettings.vue'

import { PollMethodName } from './types'

// Use lowercase component names, to match method_name from api

export const pollMethods: Record<PollMethodName, Component> = {
  combined_simple: Simple,
  irv: RankedVoting,
  repeated_schulze: Schulze,
  // simple: Simple,
  schulze: Schulze,
  scottish_stv: RankedVoting
}

export const pollResults: Record<PollMethodName, Component> = {
  irv: STVResult,
  // simple: SimpleResult,
  scottish_stv: STVResult,
  combined_simple: SimpleResult,
  schulze: SchulzeResult,
  repeated_schulze: RepeatedSchulzeResult
}

export const pollSettings: Partial<Record<PollMethodName, Component>> = {
  repeated_schulze: RepeatedSchulzeSettings,
  scottish_stv: ScottishSTVSettings
}
