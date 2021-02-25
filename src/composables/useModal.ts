import { openModalEvent, closeModalEvent } from '@/utils'
import { Modal } from './types'

export default function useModal () {
  function openModal (modal: Modal) {
    openModalEvent.emit(modal)
  }

  function closeModal () {
    closeModalEvent.emit(undefined)
  }

  return {
    openModal,
    closeModal
  }
}
