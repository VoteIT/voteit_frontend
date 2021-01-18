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
import { computed, markRaw, nextTick, onMounted, ref } from 'vue'

import { emitter } from '../../utils'

const defaults = {
  dismissable: true
}

export default {
  name: 'Modal',
  setup () {
    const modalQueue = ref([])
    const windowEl = ref(null)
    const isOpen = computed(_ => !!modalQueue.value.length)
    const modal = computed(_ => modalQueue.value[0])

    function open (modal) {
      document.body.classList.add('no-scroll')
      modalQueue.value.push(markRaw(Object.assign({}, defaults, modal)))
      nextTick(_ => {
        const focusEl = windowEl.value.querySelector('input,button:not(.closer),a[href],textarea,[tabindex]')
        focusEl && focusEl.focus()
      })
    }
    function close (modal) {
      modalQueue.value.shift()
      if (!modalQueue.value.length) {
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
  left: 0
  top: 0
  bottom: 0
  right: 0
  transition: background-color .2s
  background-color: rgba(#000, 0)
  &.isOpen
    background-color: rgba(#000, .45)

#modal-window
  position: relative
  top: 10px
  width: calc(100vw - 20px)
  max-width: 780px
  margin: 0 auto
  background-color: #fff
  height: calc(100vh - 20px)
  box-shadow: 2px 2px 8px rgba(#000, .5)

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
