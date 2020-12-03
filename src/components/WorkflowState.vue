<template>
  <div v-if="admin" class="btn-group">
    <icon v-for="s in allStates" :title="s.transition" :key="s.state" :name="s.icon"
      :active="s.state === state" button sm
      @click="$api.post(endpoint, { name: s.transition })" />
  </div>
  <icon v-else :title="state" :name="currentState.icon" button sm />
</template>

<script>
export default {
  name: 'WorkflowState',
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
    border-radius: 6px 0 0 6px
  .btn:last-child
    border-radius: 0 6px 6px 0
</style>
