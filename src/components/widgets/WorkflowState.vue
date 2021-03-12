<template>
  <span ref="root" class="dropdown">
    <btn sm :title="state" :icon="currentState.icon" :disabled="!admin || currentState.isFinal" @click="toggle" />
    <div ref="opts" v-if="isOpen && statesAvailable" class="btn-group vertical">
      <btn sm v-for="s in statesAvailable" :title="s.transition" :key="s.state" :icon="s.icon"
        @click="makeTransition(s)" />
    </div>
  </span>
</template>

<script lang="ts">
/* eslint-disable no-unused-expressions */
import { computed, defineComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import useAlert from '@/composables/useAlert'
import { WorkflowState } from '@/contentTypes/types'
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
    const statesAvailable = ref<WorkflowState[] | null>(null)
    const isOpen = ref(false)
    const { alert } = useAlert()

    const currentState = computed(
      () => getState(props.state) as WorkflowState // Coersion might not work?
    )

    function focusButton (where: HTMLElement | null) {
      nextTick(() => {
        where?.querySelector<HTMLElement>('.btn')?.focus()
      })
    }

    const root = ref<HTMLElement | null>(null)
    const opts = ref<HTMLElement | null>(null)
    function toggle (noFocus: boolean = false) {
      if (props.admin) {
        if (!isOpen.value && currentState.value.isFinal) {
          alert(`*State "${currentState.value.state}" is final and can't be changed`)
          return
        }
        isOpen.value = !isOpen.value
        if (isOpen.value) {
          if (!statesAvailable.value) {
            contentApi.getTransitions(props.pk)
              .then((states: WorkflowState[]) => {
                statesAvailable.value = states.filter(s => s.state !== props.state) // Filter out current state
                nextTick(() => focusButton(opts.value))
              })
          } else {
            nextTick(() => focusButton(opts.value))
          }
        } else if (!noFocus) { // If clicked out, don't shift that focus
          focusButton(root.value)
        }
      }
    }

    function makeTransition (state: WorkflowState) {
      if (state.transition) {
        contentApi.transition(props.pk, state.transition)
          .then(() => nextTick(toggle))
      } else {
        throw new Error(`Transition not found to state ${state.state}`)
      }
    }

    watch(() => props.state, () => { statesAvailable.value = null })

    function clickWatch (event: MouseEvent) {
      if (isOpen.value && root.value && !event.composedPath().includes(root.value)) {
        toggle(true)
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
      document.addEventListener('click', clickWatch)
      root.value?.addEventListener('keyup', keyWatch)
    })
    onBeforeUnmount(() => {
      document.removeEventListener('click', clickWatch)
      root.value?.removeEventListener('keyup', keyWatch)
    })

    return {
      root,
      opts,
      currentState,
      statesAvailable,
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
  margin-right: .25rem
  display: inline-block
  > .btn
    background-color: #bbc
    .material-icons
      color: #000
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
      .material-icons
        color: #fff
      &:hover,
      &:focus
        background-color: #668
    .v-btn:first-child
      border-top-left-radius: 6px
      border-top-right-radius: 6px
    .v-btn:last-child
      border-bottom-left-radius: 6px
      border-bottom-right-radius: 6px

  margin-right: .2rem
</style>
