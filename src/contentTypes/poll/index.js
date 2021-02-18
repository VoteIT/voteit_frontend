import workflowStates from './workflowStates.js'
import rules from './rules'
import useContentApi from '../useContentApi.js'
import useWorkflows from '../useWorkflows.js'

export default {
  workflowStates,
  rules,
  useContentApi: config => useContentApi('polls/', workflowStates, config),
  useWorkflows: _ => useWorkflows(workflowStates)
}
