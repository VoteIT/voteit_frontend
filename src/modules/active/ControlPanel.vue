<template>
  <ComponentQuickPanel component-name="active_users" :switch-label="t('activeUsers.enable')">
    {{ t('activeUsers.description') }}
  </ComponentQuickPanel>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

import ComponentQuickPanel from '../meetings/ComponentQuickPanel.vue'

const { t } = useI18n()
</script>
