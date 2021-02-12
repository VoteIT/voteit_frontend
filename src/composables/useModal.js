import { emitter } from '../utils'

export default function useModal () {
  function openModal (modal) {
    emitter.emit('modal-open', modal)
  }

  function closeModal () {
    emitter.emit('modal-close')
  }

  return {
    openModal,
    closeModal
  }
}
