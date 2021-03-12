<template>
  <v-icon :small="sm" :icon="icon" />
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'

export default defineComponent({
  name: 'Material icon',
  props: {
    name: String,
    sm: Boolean,
    active: Boolean
  },
  setup (props, { slots }) {
    const icon = computed(() => {
      const name = props.name || String(slots.default)
      if (name.startsWith('mdi-')) {
        return name
      }
      return 'mdi-' + name.replaceAll('_', '-')
    })
    return {
      icon
    }
  }
})
</script>
