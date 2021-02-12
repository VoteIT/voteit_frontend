import Meeting from './meetingStates'

const workflowStates = {
  Meeting
}

export default function useWorkflows (contentType) {
  if (!(contentType in workflowStates)) {
    throw new Error(`Content type ${contentType} has no registered workflow states.`)
  }
  const states = workflowStates[contentType]

  function getState (state) {
    return states.find(s => s.state === state)
  }

  return {
    getState
  }
}
