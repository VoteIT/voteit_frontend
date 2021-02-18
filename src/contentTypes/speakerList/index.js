import workflowStates from './workflowStates.js'
import rules from './rules'
import useWorkflows from '../useWorkflows.js'

export default {
  workflowStates,
  rules,
  useWorkflows: _ => useWorkflows(workflowStates)
}
