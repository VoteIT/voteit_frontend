import useContentApi from '../useContentApi'
import useWorkflows from '../useWorkflows'
import rules from './rules'
import workflowStates from './workflowStates'

export default {
  naturalKey: 'meeting.meeting',
  rules,
  workflowStates,
  useContentApi: config => useContentApi('meetings/', workflowStates, config),
  useWorkflows: _ => useWorkflows(workflowStates)
}
