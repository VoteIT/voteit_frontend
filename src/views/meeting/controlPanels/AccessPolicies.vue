<template>
  <div>
    <h2>{{ title }}</h2>
  </div>
</template>

<script>
import { computed, inject } from 'vue'
export default {
  name: 'AccessPolicies',
  path: 'access-policies',
  icon: 'vpn_key',
  setup () {
    const t = inject('t')
    return {
      title: computed(_ => t('accessPolicy.settings'))
    }
  }
}
</script>
