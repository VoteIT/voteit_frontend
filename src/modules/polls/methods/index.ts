/* eslint-disable camelcase */
import { Component } from 'vue'

import Majority from './Majority.vue'
import RankedVoting from './RankedVoting.vue'
import Simple from './Simple.vue'
import Schulze from './Schulze.vue'

import MajorityResult from './MajorityResult.vue'
import RepeatedSchulzeResult from './RepeatedSchulzeResult.vue'
import SimpleResult from './SimpleResult.vue'
import SchulzeResult from './SchulzeResult.vue'
import STVResult from './STVResult.vue'

import { PollMethodName } from './types'

export const pollMethods: Record<PollMethodName, Component> = {
  combined_simple: Simple,
  irv: RankedVoting,
  majority: Majority,
  repeated_schulze: Schulze,
  schulze: Schulze,
  scottish_stv: RankedVoting
}

export const pollResults: Record<PollMethodName, Component> = {
  irv: STVResult,
  combined_simple: SimpleResult,
  majority: MajorityResult,
  repeated_schulze: RepeatedSchulzeResult,
  schulze: SchulzeResult,
  scottish_stv: STVResult
}
