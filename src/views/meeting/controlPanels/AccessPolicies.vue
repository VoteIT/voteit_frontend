<template>
  <div>
    <h2>{{ title }}</h2>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'AccessPolicies',
  path: 'access-policies',
  icon: 'mdi-key',
  setup () {
    const { t } = useI18n()
    return {
      title: computed(() => t('accessPolicy.settings'))
    }
  }
})
</script>
