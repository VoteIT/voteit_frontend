import { Component } from 'vue'

import { ComponentModal, HTMLModal } from '@/composables/types'
import { closeModalEvent, openModalEvent } from './events'

let modalCount = 0

/**
 * Open a modal. Props given with a component are checked against that component's own.
 * Returns a function that closes this modal, whether it's showing or still queued.
 */
export function openModal<C extends Component>(
  modal: ComponentModal<C> | HTMLModal
) {
  const id = ++modalCount
  openModalEvent.emit({ ...modal, id })
  return () => closeModalEvent.emit(id)
}
