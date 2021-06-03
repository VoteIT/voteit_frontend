<template>
  <transition name="dialog">
    <div id="dialog-backdrop" v-show="active" @mousedown.self="deny()">
      <v-sheet id="dialog" rounded elevation="16" ref="window" v-if="active" @keyup.esc="deny()">
        <v-btn plain icon="mdi-close" class="closer" @click="deny()" />
        <p>{{ active.title }}</p>
        <div class="btn-controls">
          <v-btn outlined @click="deny()">{{ active.no }}</v-btn>
          <v-btn :color="active.theme ?? 'primary'" @click="accept()">{{ active.yes }}</v-btn>
        </div>
      </v-sheet>
    </div>
  </transition>
</template>

<script lang="ts">
/* eslint-disable no-unused-expressions */
import { ComponentPublicInstance, computed, defineComponent, nextTick, onBeforeMount, reactive, ref } from 'vue'

import { openDialogEvent } from '@/utils'

import { Dialog } from '@/composables/types'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  setup () {
    const { t } = useI18n()
    const window = ref<ComponentPublicInstance | null>(null)
    let savedFocusEl: HTMLElement | null
    const queue = reactive<Dialog[]>([])
    const active = computed<Dialog | undefined>(() => queue[0])

    function close () {
      queue.shift()
      if (!queue.length && savedFocusEl) {
        savedFocusEl.focus()
        savedFocusEl = null
      }
    }

    function deny () {
      active.value?.resolve(false)
      close()
    }

    function accept () {
      active.value?.resolve(true)
      close()
    }

    onBeforeMount(() => {
      openDialogEvent.on(dialog => {
        if (!dialog) return
        dialog.no = dialog.no || t('no')
        dialog.yes = dialog.yes || t('yes')
        if (!queue.length) {
          savedFocusEl = document.querySelector(':focus')
        }
        queue.push(dialog)
        nextTick(() => {
          if (!window.value) return
          const el = window.value.$el as HTMLElement
          el.querySelector<HTMLElement>('input,button:not(.closer),a[href],textarea,[tabindex]')?.focus()
        })
      })
    })

    return {
      active,
      close,
      accept,
      deny,
      window
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
  background-color: rgba(#000, .3)
  z-index: 100
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
  background-color: rgb(var(--v-theme-background))
  padding: 20px 40px
  width: 600px
  max-width: calc(100vw - 40px)
  p
    font-size: 1.2rem
    white-space: pre-line
    margin: 1em 0
  .btn-controls
    justify-content: center
  .closer
    position: absolute
    right: 10px
    top: 10px
</style>
