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
import { computed, defineComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import useAlert from '@/composables/useAlert'
import contentTypes from '@/contentTypes'
import { WorkflowState } from '@/contentTypes/types'

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
      type: String,
      required: true
    }
  },
  setup (props) {
    const contentType = contentTypes[props.contentType]
    if (!contentType) {
      throw new Error(`${props.contentType} has no registered Content Type`)
    }
    const contentApi = contentType.useContentApi()
    const { getState } = contentType.useWorkflows()
    const statesAvailable = ref<WorkflowState[] | null>(null)
    const isOpen = ref(false)
    const { alert } = useAlert()

    const currentState = computed(
      () => getState(props.state)
    )

    function focusButton (where: HTMLElement | null) {
      nextTick(() => {
        const btn = where && where.querySelector('.btn') as HTMLElement
        btn && btn.focus()
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
                statesAvailable.value = states
                focusButton(opts.value)
              })
          } else {
            focusButton(opts.value)
          }
        } else if (!noFocus) { // If clicked out, don't shift that focus
          focusButton(root.value)
        }
      }
    }

    function makeTransition (state: WorkflowState) {
      contentApi.transition(props.pk, state.transition)
        .then(() => nextTick(toggle))
    }

    watch(() => props.state, () => { statesAvailable.value = null })

    function clickWatch (event: MouseEvent) {
      if (isOpen.value && root.value && !event.composedPath().includes(root.value)) {
        toggle(true)
      }
    }
    function keyWatch ({ key }: { key: string }) {
      if (isOpen.value) {
        const focusedEl = opts.value && opts.value.querySelector(':focus')
        if (focusedEl) {
          const prev = focusedEl.previousElementSibling as HTMLElement
          const next = focusedEl.nextElementSibling as HTMLElement
          switch (key) {
            case 'Escape':
              toggle()
              break
            case 'ArrowUp':
              prev && prev.focus()
              break
            case 'ArrowDown':
              next && next.focus()
              break
          }
        }
      }
    }
    onMounted(() => {
      document.addEventListener('click', clickWatch)
      root.value && root.value.addEventListener('keyup', keyWatch)
    })
    onBeforeUnmount(() => {
      document.removeEventListener('click', clickWatch)
      root.value && root.value.removeEventListener('keyup', keyWatch)
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
  .btn,
  .btn.btn-sm
    border-radius: 0
  .btn:first-child
    border-top-left-radius: 6px
    border-bottom-left-radius: 6px
  .btn:last-child
    border-top-right-radius: 6px
    border-bottom-right-radius: 6px

  &.vertical
    z-index: 100
    position: absolute
    display: flex
    flex-flow: column
    margin-top: .25rem
    .btn
      background-color: #000
      color: #fff
      border-radius: 0
      .material-icons
        color: #fff
      &:hover,
      &:focus
        background-color: #668
    .btn:first-child
      border-top-left-radius: 6px
      border-top-right-radius: 6px
    .btn:last-child
      border-bottom-left-radius: 6px
      border-bottom-right-radius: 6px

  margin-right: .2rem
</style>
