<template>
  <div>
    <h2>{{ title }}</h2>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject } from 'vue'

export default defineComponent({
  name: 'SpeakerSystems',
  path: 'speakers',
  icon: 'volume_up',
  setup () {
    const t = inject('t') as CallableFunction
    return {
      title: computed(() => t('speaker.settings'))
    }
  }
})
</script>
