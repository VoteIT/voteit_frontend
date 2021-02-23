import { emitter } from '../utils'

import { Modal } from './types'

export default function useModal () {
  function openModal (modal: Modal) {
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
