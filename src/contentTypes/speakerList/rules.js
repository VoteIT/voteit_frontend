function canAdd (agendaItem) {
  return false
}
function canChange (speakerList) {
  return false
}
function canStart (speakerList) {
  return false
}
function canEnter (speakerList) {
  return false
}
function canLeave (speakerList) {
  return false
}

export default {
  canAdd,
  canChange,
  canDelete: canChange,
  canEnter,
  canLeave,
  canStart
}
