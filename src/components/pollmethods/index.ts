/* eslint-disable camelcase */
import { Component } from 'vue'

import Simple from './Simple.vue'
import Schulze from './Schulze.vue'
import RankedVoting from './RankedVoting.vue'

import CombinedSimpleResult from './CombinedSimpleResult.vue'
import IRVResult from './IRVResult.vue'
import RepeatedSchulzeResult from './RepeatedSchulzeResult.vue'
import SchulzeResult from './SchulzeResult.vue'
import ScottishSTVResult from './ScottishSTVResult.vue'
import SimpleResult from './SimpleResult.vue'

import ScottishSTVSettings from './ScottishSTVSettings.vue'
import RepeatedSchulzeSettings from './RepeatedSchulzeSettings.vue'

import { PollMethodName } from './types'

// Use lowercase component names, to match method_name from api

type ComponentMapping = {
  [ key in PollMethodName ]: Component
}
type RelaxedComponentMapping = {
  [ key in PollMethodName ]?: Component
}

export const pollMethods: ComponentMapping = {
  combined_simple: Simple,
  irv: RankedVoting,
  repeated_schulze: Schulze,
  simple: Simple,
  schulze: Schulze,
  scottish_stv: RankedVoting
}

export const pollResults: ComponentMapping = {
  irv: IRVResult,
  simple: SimpleResult,
  scottish_stv: ScottishSTVResult,
  combined_simple: CombinedSimpleResult,
  schulze: SchulzeResult,
  repeated_schulze: RepeatedSchulzeResult
}

export const pollSettings: RelaxedComponentMapping = {
  repeated_schulze: RepeatedSchulzeSettings,
  scottish_stv: ScottishSTVSettings
}
