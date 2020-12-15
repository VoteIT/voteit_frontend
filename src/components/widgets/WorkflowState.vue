<template>
  <span v-if="admin" class="btn-group">
    <btn v-for="s in allStates" :title="s.transition" :key="s.state" :icon="s.icon"
      :active="s.state === state" sm
      @click="$api.post(endpoint, { name: s.transition }).catch(restError)" />
  </span>
  <btn v-else :title="state" :icon="currentState.icon" sm disabled />
</template>

<script>
import useRestApi from '../../composables/useRestApi'

export default {
  name: 'WorkflowState',
  setup () {
    return {
      ...useRestApi()
    }
  },
  props: {
    admin: Boolean,
    allStates: Object,
    state: String,
    endpoint: String
  },
  computed: {
    currentState () {
      return this.allStates.find(s => s.state === this.state)
    }
  }
}
</script>

<style lang="sass">
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

  margin-right: .2rem
</style>
