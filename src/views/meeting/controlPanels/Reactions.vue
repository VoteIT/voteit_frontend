<template>
  <div>
    <h2>{{ title }}</h2>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject } from 'vue'

export default defineComponent({
  name: 'ReactionButtons',
  path: 'reactions',
  icon: 'mdi-thumb-up',
  setup () {
    const t = inject('t') as CallableFunction
    return {
      title: computed(() => t('reaction.settings'))
    }
  }
})
</script>
