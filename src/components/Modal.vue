<script setup lang="ts">
import { computed, markRaw, onMounted, reactive } from 'vue'

import { openModalEvent, closeModalEvent } from '@/utils/events'

import { Modal, isComponentModal, isHTMLModal } from '@/composables/types'
import DefaultDialog from './DefaultDialog.vue'

const defaults: Partial<Modal> = {
  dismissible: true
}

const modalQueue = reactive<Modal[]>([])
const isOpen = computed(() => !!modalQueue.length)
const modal = computed(() => modalQueue[0])

function open(modal: Modal) {
  modalQueue.push(markRaw({ ...defaults, ...modal }))
}

function close() {
  modalQueue.shift()
}

onMounted(() => {
  openModalEvent.on(open)
  closeModalEvent.on(close)
})
</script>

<template>
  <DefaultDialog
    :model-value="isOpen"
    :title="modal?.title"
    :persistent="!modal?.dismissible"
    @close="close()"
  >
    <template v-if="modal">
      <component
        v-if="isComponentModal(modal)"
        :is="modal.component"
        :data="modal.data"
      />
      <main v-else-if="isHTMLModal(modal)" v-html="modal.html"></main>
    </template>
  </DefaultDialog>
</template>
