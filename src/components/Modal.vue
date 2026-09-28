<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  shallowReactive,
  toValue
} from 'vue'

import { openModalEvent, closeModalEvent } from '@/utils/events'
import { Disposable } from '@/utils/TypedEvent'

import { Modal, isComponentModal, isHTMLModal } from '@/composables/types'
import DefaultDialog from './DefaultDialog.vue'

const defaults: Partial<Modal> = {
  dismissible: true
}

const modalQueue = shallowReactive<(Modal & { id: number })[]>([])
const isOpen = computed(() => !!modalQueue.length)
const modal = computed(() => modalQueue[0])

function open(modal: Modal & { id: number }) {
  modalQueue.push({ ...defaults, ...modal })
}

function close(id?: number | void) {
  const index = id ? modalQueue.findIndex((m) => m.id === id) : 0
  if (index === -1) return // Already closed
  modalQueue.splice(index, 1)[0]?.onClose?.()
}

const listeners: Disposable[] = []
onMounted(() => {
  listeners.push(openModalEvent.on(open), closeModalEvent.on(close))
})
onBeforeUnmount(() => {
  for (const listener of listeners) listener.dispose()
})
</script>

<template>
  <DefaultDialog
    :model-value="isOpen"
    :title="toValue(modal?.title)"
    :persistent="!modal?.dismissible"
    @close="close()"
  >
    <template v-if="modal">
      <component
        v-if="isComponentModal(modal)"
        :key="modal.id"
        :is="modal.component"
        v-bind="modal.props"
      />
      <main v-else-if="isHTMLModal(modal)" v-html="modal.html"></main>
    </template>
  </DefaultDialog>
</template>
