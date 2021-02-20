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

<script>
import { emitter } from '@/utils'
import { computed, defineComponent, inject, nextTick, onBeforeMount, reactive, ref } from 'vue'

export default defineComponent({
  setup () {
    const t = inject('t')
    const windowEl = ref(null)
    let savedFocusEl
    const queue = reactive([])
    const active = computed(_ => queue[0])

    function close () {
      queue.shift()
      if (!queue.length && savedFocusEl) {
        savedFocusEl.focus()
        savedFocusEl = null
      }
    }

    function resolve () {
      if (active.value.resolve) {
        active.value.resolve()
      }
      close()
    }

    onBeforeMount(() => {
      emitter.on('dialog-open', dialog => {
        dialog.no = dialog.no || t('no')
        dialog.yes = dialog.yes || t('yes')
        if (!queue.length) {
          savedFocusEl = document.querySelector(':focus')
        }
        queue.push(dialog)
        nextTick(_ => {
          const focusEl = windowEl.value.querySelector('input,button:not(.closer),a[href],textarea,[tabindex]')
          focusEl && focusEl.focus()
        })
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
  background-color: rgba(#013, .333333)
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
  background-color: #f5f4ef
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
