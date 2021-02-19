<template>
  <div>
    <h2>{{ title }}</h2>
  </div>
</template>

<script>
import { computed, inject } from 'vue'
export default {
  name: 'ReactionButtons',
  path: 'reactions',
  icon: 'thumb_up',
  setup () {
    const t = inject('t')
    return {
      title: computed(_ => t('reaction.settings'))
    }
  }
}
</script>
