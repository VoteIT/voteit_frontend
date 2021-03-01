<template>
  <transition name="dialog">
    <div id="dialog-backdrop" v-show="active" @click.self="close()">
      <div id="dialog" ref="windowEl" v-if="active" @keyup.esc="close()">
        <btn icon="close" class="closer" @click="close()" />
        <p>{{ active.title }}</p>
        <div class="btn-controls">
          <btn @click="close()">{{ active.no }}</btn>
          <btn primary @click="resolve()">{{ active.yes }}</btn>
        </div>
      </div>
    </div>
  </transition>
</template>

<script lang="ts">
import { computed, defineComponent, inject, nextTick, onBeforeMount, reactive, ref } from 'vue'

import { openDialogEvent } from '@/utils'

import { Dialog } from '@/composables/types'

export default defineComponent({
  setup () {
    const t = inject('t') as CallableFunction
    const windowEl = ref<HTMLElement | null>(null)
    let savedFocusEl: HTMLElement | null
    const queue = reactive<Dialog[]>([])
    const active = computed(() => queue[0])

    function close () {
      queue.shift()
      if (!queue.length && savedFocusEl) {
        savedFocusEl.focus()
        savedFocusEl = null
      }
    }

    function resolve () {
      if (active.value) {
        active.value.resolve()
        close()
      }
    }

    onBeforeMount(() => {
      openDialogEvent.on(dialog => {
        if (dialog) {
          dialog.no = dialog.no || t('no')
          dialog.yes = dialog.yes || t('yes')
          if (!queue.length) {
            savedFocusEl = document.querySelector(':focus')
          }
          queue.push(dialog as Dialog)
          nextTick(() => {
            const focusEl = windowEl.value && windowEl.value.querySelector('input,button:not(.closer),a[href],textarea,[tabindex]') as HTMLElement | null
            focusEl && focusEl.focus()
          })
        }
      })
    })

    return {
      active,
      close,
      resolve,
      windowEl
    }
  }
})
</script>

<style lang="sass">
.dialog-enter-active,
.dialog-leave-active
  opacity: 1
  transition: opacity 0.5s ease

.dialog-enter-from,
.dialog-leave-to
  opacity: 0

#dialog-backdrop
  background-color: var(--overlay-bg)
  position: fixed
  left: 0
  right: 0
  top: 0
  bottom: 0
  display: flex
  justify-content: center
  align-items: center

#dialog
  position: relative
  background-color: var(--alt-bg)
  box-shadow: 4px 4px 14px rgba(#000, .4)
  padding: 20px 40px
  width: 600px
  max-width: calc(100vw - 40px)
  font-size: 1.2rem
  border-radius: 3px
  p
    white-space: pre-line
  .btn-controls
    text-align: right
    margin: 0 -20px
  .closer
    position: absolute
    padding: 0
    right: 10px
    top: 10px
    background-color: transparent
    .material-icons
      font-size: 2rem
      color: #ccc
      transition: color .2s
    &:hover .material-icons
      color: #999
</style>
