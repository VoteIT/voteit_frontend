export default function useWorkflows (states) {
  function getState (state) {
    return states.find(s => s.state === state)
  }

  return {
    getState
  }
}
