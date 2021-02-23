/* eslint-disable camelcase */
import { Component } from 'vue'

import Simple from './Simple.vue'
import Schulze from './Schulze.vue'
import RankedVoting from './RankedVoting.vue'

// Use lowercase component names, to match method_name from api

type ComponentMapping = {
  [ index: string ]: Component
}

export const pollMethods: ComponentMapping = {
  simple: Simple,
  combined_simple: Simple,
  schulze: Schulze,
  repeated_schulze: Schulze,
  scottish_stv: RankedVoting,
  irv: RankedVoting
}
