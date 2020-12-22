import { emitter } from '../utils'

export default function useModal () {
  function openModal (modal) {
    emitter.emit('modal-open', modal)
  }
  return {
    openModal
  }
}
