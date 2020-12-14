<template>
  <div v-if="admin" class="btn-group">
    <icon v-for="s in allStates" :title="s.transition" :key="s.state" :name="s.icon"
      :active="s.state === state" button sm
      @click="restApi.post(endpoint, { name: s.transition })" />
  </div>
  <icon v-else :title="state" :name="currentState.icon" button sm />
</template>

<script>
import useRestApi from '@/composables/useRestApi.js'

export default {
  name: 'WorkflowState',
  setup () {
    const { restApi } = useRestApi()
    return {
      restApi
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
</style>
