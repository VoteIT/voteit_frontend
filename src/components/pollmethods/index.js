/* eslint-disable camelcase */
import simple from './Simple'
import schulze from './Schulze'
import scottish_stv from './ScottishSTV'

// Use lowercase component names, to match method_name from api

export default {
  simple,
  combined_simple: simple,
  schulze,
  repeated_schulze: schulze,
  scottish_stv
}
