<template>
  <span ref="root" class="dropdown">
    <btn sm :title="state" :icon="currentState.icon" :disabled="!admin" @click="toggle" />
    <div ref="opts" v-if="isOpen && statesAvailable" class="btn-group vertical">
      <btn sm v-for="s in statesAvailable" :title="s.transition" :key="s.state" :icon="s.icon"
        @click="makeTransition(s)" />
    </div>
  </span>
</template>

<script>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import useAlert from '../../composables/useAlert'
import useContentApi from '../../composables/useContentApi'

export default {
  name: 'WorkflowState',
  props: {
    admin: Boolean,
    pk: Number,
    state: String,
    contentType: String
  },
  setup (props) {
    const contentApi = useContentApi(props.contentType)
    const statesAvailable = ref(null)
    const isOpen = ref(false)
    const { alert } = useAlert()

    const currentState = computed(
      _ => contentApi.states.find(s => s.state === props.state)
    )

    function focusButton (where) {
      nextTick(_ => {
        where.value.querySelector('.btn').focus()
      })
    }

    const opts = ref(null)
    function toggle (noFocus) {
      if (props.admin) {
        if (!isOpen.value && currentState.value.isFinal) {
          alert(`*State "${currentState.value.state}" is final and can't be changed`)
          return
        }
        isOpen.value = !isOpen.value
        if (isOpen.value) {
          if (!statesAvailable.value) {
            contentApi.getTransitions(props.pk)
              .then(states => {
                statesAvailable.value = states
                focusButton(opts)
              })
          } else {
            focusButton(opts)
          }
        } else if (!noFocus) { // If clicked out, don't shift that focus
          focusButton(root)
        }
      }
    }

    function makeTransition ({ transition }) {
      contentApi.transition(props.pk, transition)
        .then(_ => nextTick(toggle))
    }

    watch(_ => props.state, _ => { statesAvailable.value = null })

    const root = ref(null)
    function clickWatch (event) {
      if (isOpen.value && !event.path.includes(root.value)) {
        toggle(true)
      }
    }
    function keyWatch ({ key }) {
      if (isOpen.value) {
        const focusedEl = opts.value.querySelector(':focus')
        switch (key) {
          case 'Escape':
            toggle()
            break
          case 'ArrowUp':
            focusedEl.previousElementSibling && focusedEl.previousElementSibling.focus()
            break
          case 'ArrowDown':
            focusedEl.nextElementSibling && focusedEl.nextElementSibling.focus()
            break
        }
      }
    }
    onMounted(_ => {
      document.addEventListener('click', clickWatch)
      root.value.addEventListener('keyup', keyWatch)
    })
    onBeforeUnmount(_ => {
      document.removeEventListener('click', clickWatch)
      root.value.removeEventListener('keyup', keyWatch)
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
}
</script>

<style lang="sass">
.dropdown
  position: relative
  margin-right: .25rem
  display: inline-block
  > .btn
    background-color: #bbc
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
