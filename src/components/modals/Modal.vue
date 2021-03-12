<template>
  <div id="modal-backdrop" :class="{ isOpen }" v-show="isOpen" @click.self="dismiss">
    <div id="modal-window" v-if="modal" ref="windowEl" @keyup.esc="dismiss">
      <header v-if="modal.title">
        <v-btn icon="mdi-close" plain @click="dismiss" v-show="modal.dismissable" />
        <h1>{{ modal.title }}</h1>
      </header>
      <component v-if="modal.component" :is="modal.component" :data="modal.data" />
      <main v-else v-html="modal.html"></main>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, markRaw, nextTick, onMounted, reactive, ref } from 'vue'

import { openModalEvent, closeModalEvent } from '@/utils'

import { Modal } from '@/composables/types'

const defaults: Modal = {
  dismissable: true
}

export default defineComponent({
  name: 'Modal',
  setup () {
    const modalQueue = reactive<Modal[]>([])
    let savedFocusEl: HTMLElement | null = null
    const windowEl = ref<HTMLElement | null>(null)
    const isOpen = computed(() => !!modalQueue.length)
    const modal = computed(() => modalQueue[0])

    function open (modal: Modal) {
      if (!modalQueue.length) {
        savedFocusEl = document.querySelector(':focus')
      }
      document.body.classList.add('no-scroll')
      modalQueue.push(markRaw({ ...defaults, ...modal }))
      nextTick(() => {
        // eslint-disable-next-line no-unused-expressions
        windowEl.value?.querySelector<HTMLElement>('input,button:not(.closer),a[href],textarea,[tabindex]')?.focus()
      })
    }

    function close () {
      modalQueue.shift()
      if (!modalQueue.length) {
        if (savedFocusEl) {
          savedFocusEl.focus()
          savedFocusEl = null
        }
        document.body.classList.remove('no-scroll')
      }
    }

    function dismiss () {
      if (modal.value.dismissable) {
        close()
      }
    }

    onMounted(() => {
      openModalEvent.on(open)
      closeModalEvent.on(close)
    })

    return {
      windowEl,
      isOpen,
      modal,
      dismiss
    }
  }
})
</script>

<style lang="sass">
#modal-backdrop
  position: fixed
  display: flex
  justify-content: center
  align-items: flex-start
  padding-top: 10px
  left: 0
  top: 0
  bottom: 0
  right: 0
  transition: background-color .2s
  background-color: rgba(#000, 0)
  &.isOpen
    background-color: var(--overlay-bg)

#modal-window
  width: calc(100vw - 20px)
  max-width: 780px
  background-color: var(--alt-bg)
  min-height: calc(50vh)
  max-height: calc(100vh - 20px)
  box-shadow: 2px 2px 8px rgba(#000, .5)
  overflow-y: auto
  border-radius: 3px

  header,
  main
    padding: 1rem
  header
    button
      float: right
      margin-top: -8px
      margin-right: -10px
    h1
      margin: 0
</style>
