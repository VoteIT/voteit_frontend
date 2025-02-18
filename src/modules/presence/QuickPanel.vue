<template>
  <ComponentQuickPanel
    component-name="presence_check"
    :switch-label="$t('presence.activateSystem')"
  >
    {{ $t('presence.recommendActive') }}
  </ComponentQuickPanel>
</template>

<script setup lang="ts">
import ComponentQuickPanel from '../meetings/ComponentQuickPanel.vue'
</script>
