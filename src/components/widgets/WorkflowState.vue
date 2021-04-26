<template>
  <span ref="root" class="dropdown">
    <v-btn size="small" color="secondary" :border="!admin || currentState.isFinal" :title="state" @click="toggle()">
      <v-icon :icon="currentState.icon"/>
    </v-btn>
    <div ref="opts" v-if="isOpen && statesAvailable" class="btn-group vertical">
      <v-btn size="small" v-for="t in transitionsAvailable" :title="t.title" :key="t.name" @click="makeTransition(t)">
        <v-icon :icon="s.icon"/>
      </v-btn>
    </div>
  </span>
</template>

<script lang="ts">
/* eslint-disable no-unused-expressions */
import { computed, defineComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import useAlert from '@/composables/useAlert'
import { Transition, WorkflowState } from '@/contentTypes/types'
import ContentType from '@/contentTypes/ContentType'

export default defineComponent({
  name: 'WorkflowState',
  props: {
    admin: Boolean,
    pk: {
      type: Number,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    contentType: {
      type: ContentType,
      required: true
    }
  },
  setup (props) {
    const contentApi = props.contentType.getContentApi()
    const { getState } = props.contentType.useWorkflows()
    const transitionsAvailable = ref<Transition[] | null>(null)
    const isOpen = ref(false)
    const { alert } = useAlert()

    const currentState = computed(
      () => getState(props.state) as WorkflowState // Coersion might not work?
    )

    function focusButton (where: HTMLElement | null) {
      nextTick(() => {
        where?.querySelector<HTMLElement>('button')?.focus()
      })
    }

    const root = ref<HTMLElement | null>(null)
    const opts = ref<HTMLElement | null>(null)
    async function toggle (focus = true) {
      if (!props.admin) return
      if (!isOpen.value && currentState.value.isFinal) {
        alert(`*State "${currentState.value.state}" is final and can't be changed`)
        return
      }
      isOpen.value = !isOpen.value
      if (isOpen.value) {
        if (!transitionsAvailable.value) {
          transitionsAvailable.value = await contentApi.getTransitions(props.pk)
          nextTick(() => focusButton(opts.value))
        } else {
          nextTick(() => focusButton(opts.value))
        }
      } else if (focus) { // If clicked out, don't shift that focus
        focusButton(root.value)
      }
    }

    async function makeTransition (t: Transition) {
      await contentApi.transition(props.pk, t.name)
      nextTick(toggle)
    }

    watch(() => props.state, () => { transitionsAvailable.value = null })

    function clickWatch (event: MouseEvent) {
      if (isOpen.value && root.value && !event.composedPath().includes(root.value)) {
        toggle(false)
      }
    }
    function keyWatch ({ key }: { key: string }) {
      if (isOpen.value) {
        const focusedEl = opts.value?.querySelector(':focus')
        if (focusedEl) {
          switch (key) {
            case 'Escape':
              toggle()
              break
            case 'ArrowUp':
              (focusedEl.previousElementSibling as HTMLElement)?.focus()
              break
            case 'ArrowDown':
              (focusedEl.nextElementSibling as HTMLElement)?.focus()
              break
          }
        }
      }
    }
    onMounted(() => {
      document.addEventListener('mousedown', clickWatch)
      root.value?.addEventListener('keyup', keyWatch)
    })
    onBeforeUnmount(() => {
      document.removeEventListener('mousedown', clickWatch)
      root.value?.removeEventListener('keyup', keyWatch)
    })

    return {
      root,
      opts,
      currentState,
      transitionsAvailable,
      isOpen,
      toggle,
      makeTransition
    }
  }
})
</script>

<style lang="sass">
.dropdown
  position: relative
  display: inline-block
  > .btn
    background-color: #bbc
.btn-group
  .v-btn
    border-radius: 0
  .v-btn:first-child
    border-top-left-radius: 6px
    border-bottom-left-radius: 6px
  .v-btn:last-child
    border-top-right-radius: 6px
    border-bottom-right-radius: 6px

  &.vertical
    z-index: 100
    position: absolute
    display: flex
    flex-flow: column
    margin-top: .25rem
    .v-btn
      background-color: #000
      color: #fff
      border-radius: 0
      &:hover,
      &:focus
        background-color: #668
    .v-btn:first-child
      border-top-left-radius: 6px
      border-top-right-radius: 6px
    .v-btn:last-child
      border-bottom-left-radius: 6px
      border-bottom-right-radius: 6px
</style>
