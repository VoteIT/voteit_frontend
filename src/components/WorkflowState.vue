<template>
  <span v-if="currentState" ref="root" class="dropdown" :class="{ isOpen, right }">
    <v-btn :prepend-icon="currentState.icon" :append-icon="isUserModifiable ? 'mdi-chevron-down' : undefined" size="x-small" elevation="0" :border="isUserModifiable" @click="toggle()" class="text-no-wrap">
      {{ t(`workflowState.${currentState.state}`) }}
    </v-btn>
    <v-sheet rounded elevation="4" ref="menu" v-if="isOpen && transitionsAvailable">
      <v-list density="comfortable">
        <v-list-item
          v-for="t in transitionsAvailable"
          :key="t.name"
          :prepend-icon="t.icon"
          :title="t.title"
          :disabled="!t.allowed"
          :subtitle="unmetConditions(t)"
          @click="makeTransition(t)"
          link
        />
      </v-list>
    </v-sheet>
  </span>
</template>

<script lang="ts">
import { ComponentPublicInstance, computed, defineComponent, nextTick, onBeforeUnmount, onMounted, PropType, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import useAlert from '@/composables/useAlert'
import { StateContent, Transition, WorkflowState } from '@/contentTypes/types'
import ContentType from '@/contentTypes/ContentType'

export default defineComponent({
  name: 'WorkflowState',
  props: {
    admin: Boolean,
    object: {
      type: Object as PropType<StateContent>,
      required: true
    },
    contentType: {
      type: ContentType,
      required: true
    },
    right: Boolean
  },
  setup (props) {
    const { t } = useI18n()
    const contentApi = props.contentType.getContentApi()
    const { getState } = props.contentType.useWorkflows()
    const transitionsAvailable = ref<Transition[] | null>(null)
    const isOpen = ref(false)
    const { alert } = useAlert()

    const currentState = computed<WorkflowState | undefined>(
      () => getState(props.object.state)
    )
    const isUserModifiable = computed<boolean>(() => {
      return props.admin && !currentState.value?.isFinal
    })

    function focusFirst (where: HTMLElement | null, query = 'button') {
      nextTick(() => {
        where?.querySelector<HTMLElement>(query)?.focus()
      })
    }

    const root = ref<HTMLElement | null>(null)
    const menu = ref<ComponentPublicInstance | null>(null)
    async function toggle (focus = true) {
      if (!isUserModifiable.value) return
      if (!isOpen.value && currentState.value?.isFinal) {
        return alert(`*State "${currentState.value.state}" is final and can't be changed`)
      }
      isOpen.value = !isOpen.value
      if (isOpen.value) {
        if (!transitionsAvailable.value) transitionsAvailable.value = await contentApi.getTransitions(props.object.pk)
        nextTick(() => focusFirst(menu.value?.$el, '.v-list-item'))
      } else if (focus) { // If clicked out, don't shift that focus
        focusFirst(root.value)
      }
    }

    async function makeTransition (t: Transition) {
      await contentApi.transition(props.object.pk, t.name)
      nextTick(toggle)
    }

    function unmetConditions (t: Transition) {
      if (t.allowed) return
      return t.conditions
        .filter(c => !c.allowed)
        .map(c => c.title)
        .join(', ')
    }

    watch(() => props.object.state, () => { transitionsAvailable.value = null })

    function clickWatch (event: MouseEvent) {
      if (isOpen.value && root.value && !event.composedPath().includes(root.value)) {
        toggle(false)
      }
    }
    function keyWatch (evt: KeyboardEvent) {
      if (isOpen.value) {
        const focusedEl = menu.value?.$el.querySelector(':focus')
        if (focusedEl) {
          switch (evt.key) {
            case 'Escape':
              toggle()
              break
            case 'ArrowUp':
              (focusedEl.previousElementSibling as HTMLElement)?.focus()
              evt.preventDefault()
              break
            case 'ArrowDown':
              (focusedEl.nextElementSibling as HTMLElement)?.focus()
              evt.preventDefault()
              break
          }
        }
      }
    }
    onMounted(() => {
      document.addEventListener('mousedown', clickWatch)
      root.value?.addEventListener('keydown', keyWatch)
    })
    onBeforeUnmount(() => {
      document.removeEventListener('mousedown', clickWatch)
      root.value?.removeEventListener('keydown', keyWatch)
    })

    return {
      t,
      root,
      menu,
      currentState,
      transitionsAvailable,
      isOpen,
      isUserModifiable,
      toggle,
      makeTransition,
      unmetConditions
    }
  }
})
</script>

<style lang="sass">
.dropdown
  position: relative
  display: inline-block
  > .v-btn
    background-color: rgba(var(--v-theme-secondary), .3)
    color: rgb(var(--v-theme-on-background))
  &.isOpen > .v-btn
    background-color: rgba(var(--v-theme-primary), .2)

  .v-sheet
    z-index: 100
    position: absolute
    margin-top: .1em
    width: max-content
    .v-list-item
      white-space: nowrap
      .v-icon
        font-size: 16pt

  &.right .v-sheet
    right: 0
</style>
