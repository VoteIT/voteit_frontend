<template>
  <div>
    <h2>{{ title }}</h2>
  </div>
</template>

<script>
import { computed, inject } from 'vue'
export default {
  name: 'SpeakerSystems',
  path: 'speakers',
  icon: 'volume_up',
  setup () {
    const t = inject('t')
    return {
      title: computed(_ => t('speaker.settings'))
    }
  }
}
</script>
