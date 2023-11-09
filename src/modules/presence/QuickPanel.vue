<template>
  <ComponentQuickPanel
    component-name="presence_check"
    :switch-label="t('presence.activateSystem')"
  >
    {{ t('presence.recommendActive') }}
  </ComponentQuickPanel>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import ComponentQuickPanel from '../meetings/ComponentQuickPanel.vue'

const { t } = useI18n()
</script>
