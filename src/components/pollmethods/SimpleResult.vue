<template>
  <div>
    <h3>Simple result</h3>
    <div class="btn-group">
      <btn v-for="[icon, count] in votes" :key="icon" disabled :icon="icon">{{ count }}</btn>
    </div>
    <slot/>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'
import { SimpleChoice, simpleIcons, SimpleVoteResult } from './types'
export default defineComponent({
  props: {
    data: {
      type: Object as PropType<SimpleVoteResult>,
      required: true
    }
  },
  inject: ['t'],
  setup (props) {
    const votes = computed(() => {
      return [
        [simpleIcons[SimpleChoice.Yes], props.data.yes],
        [simpleIcons[SimpleChoice.No], props.data.no]
      ]
    })
    return {
      votes
    }
  }
})
</script>
