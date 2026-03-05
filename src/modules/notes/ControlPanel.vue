<script lang="ts" setup>
import ComponentQuickPanel from '../meetings/ComponentQuickPanel.vue'

// TODO: Confirm dialog when deactivating, warning of consequences if used...
</script>

<template>
  <ComponentQuickPanel
    component-name="notes"
    :switch-label="$t('notes.enable')"
  >
    {{ $t('notes.description') }}
  </ComponentQuickPanel>
</template>
