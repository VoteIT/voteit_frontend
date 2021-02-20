<template>
  <div id="modal-backdrop" :class="{ isOpen }" v-show="isOpen" @click.self="dismiss">
    <div id="modal-window" v-if="modal" ref="windowEl" @keyup.esc="dismiss">
      <header v-if="modal.title">
        <btn icon="close" class="closer" @click="dismiss" v-show="modal.dismissable" :data="modal.data" />
        <h1>{{ modal.title }}</h1>
      </header>
      <component v-if="modal.component" :is="modal.component" :data="modal.data" />
      <main v-else v-html="modal.html"></main>
    </div>
  </div>
</template>

<script>
import { computed, markRaw, nextTick, onMounted, reactive, ref } from 'vue'

import { emitter } from '../../utils'

const defaults = {
  dismissable: true
}

export default {
  name: 'Modal',
  setup () {
    const modalQueue = reactive([])
    let savedFocusEl
    const windowEl = ref(null)
    const isOpen = computed(_ => !!modalQueue.length)
    const modal = computed(_ => modalQueue[0])

    function open (modal) {
      if (!modalQueue.length) {
        savedFocusEl = document.querySelector(':focus')
      }
      document.body.classList.add('no-scroll')
      modalQueue.push(markRaw(Object.assign({}, defaults, modal)))
      nextTick(_ => {
        const focusEl = windowEl.value.querySelector('input,button:not(.closer),a[href],textarea,[tabindex]')
        focusEl && focusEl.focus()
      })
    }
    function close (modal) {
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

    onMounted(_ => {
      emitter.on('modal-open', open)
      emitter.on('modal-close', close)
    })

    return {
      windowEl,
      isOpen,
      modal,
      dismiss
    }
  }
}

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
    background-color: rgba(#000, .45)

#modal-window
  width: calc(100vw - 20px)
  max-width: 780px
  background-color: #fff
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
      background-color: transparent
      padding: 0
      float: right
    h1
      margin: 0
</style>
