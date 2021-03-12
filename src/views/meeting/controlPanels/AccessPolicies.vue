<template>
  <div>
    <h2>{{ title }}</h2>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject } from 'vue'
export default defineComponent({
  name: 'AccessPolicies',
  path: 'access-policies',
  icon: 'mdi-key',
  setup () {
    const t = inject('t') as CallableFunction
    return {
      title: computed(() => t('accessPolicy.settings'))
    }
  }
})
</script>
