import useContentApi from '../useContentApi'
import useWorkflows from '../useWorkflows'
import rules from './rules'
import workflowStates from './workflowStates'

export default {
  naturalKey: 'agenda.agendaitem',
  rules,
  workflowStates,
  useContentApi: config => useContentApi('agenda-items/', workflowStates, config),
  useWorkflows: _ => useWorkflows(workflowStates)
}
