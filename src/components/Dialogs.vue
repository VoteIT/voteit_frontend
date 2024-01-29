<template>
  <p>{{ active }}</p>
  <v-dialog
    v-model="isActive"
    v-bind="dialogDefaults"
    :persistent="!dismissible"
  >
    <v-sheet
      id="dialog"
      elevation="16"
      ref="window"
      v-if="active"
      @keyup.esc="deny()"
      class="pa-4"
    >
      <v-btn
        v-if="dismissible"
        variant="text"
        icon="mdi-close"
        class="closer"
        @click="deny()"
      />
      <p class="ml-2 mr-10">
        {{ active.title }}
      </p>
      <div class="btn-controls justify-end">
        <v-btn v-if="active.no" variant="text" @click="deny(true)">{{
          active.no
        }}</v-btn>
        <v-btn
          v-if="active.yes"
          :color="active.theme ?? 'primary'"
          @click="accept"
          >{{ active.yes }}</v-btn
        >
      </div>
    </v-sheet>
  </v-dialog>
</template>

<script lang="ts" setup>
import {
  ComponentPublicInstance,
  computed,
  nextTick,
  onBeforeMount,
  reactive,
  ref
} from 'vue'
import { useI18n } from 'vue-i18n'

import { openDialogEvent } from '@/utils/events'
import { Dialog } from '@/composables/types'
import useDefaults from '@/composables/useDefaults'

const { t } = useI18n()
const { dialogDefaults } = useDefaults()

const window = ref<ComponentPublicInstance | null>(null)
let savedFocusEl: HTMLElement | null
const queue = reactive<Dialog[]>([])
const active = computed<Dialog | undefined>(() => queue[0])
const isActive = computed({
  get: () => !!active.value,
  set(active) {
    if (!active) deny()
  }
})
const dismissible = computed(() => active.value?.dismissible)

function close() {
  queue.shift()
  if (!queue.length && savedFocusEl) {
    savedFocusEl.focus()
    savedFocusEl = null
  }
}

function deny(override = false) {
  if (!override && !dismissible.value) return
  active.value?.resolve(false)
  close()
}

function accept() {
  active.value?.resolve(true)
  close()
}

onBeforeMount(() => {
  openDialogEvent.on((dialog) => {
    if (!dialog) return
    dialog = {
      dismissible: true,
      no: t('no'),
      yes: t('yes'),
      ...dialog
    }
    if (!queue.length) {
      savedFocusEl = document.querySelector(':focus')
    }
    queue.push(dialog)
    console.log('dialog!', dialog)
    nextTick(() => {
      if (!window.value) return
      const el = window.value.$el as HTMLElement
      el
        .querySelector<HTMLElement>(
          'input,button:not(.closer),a[href],textarea,[tabindex]'
        )
        ?.focus()
    })
  })
})
</script>

<style lang="sass" scoped>
#dialog
  p
    font-size: 1.2rem
    white-space: pre-line
    margin: 1em 0
  .closer
    position: absolute
    right: 10px
    top: 10px
</style>
