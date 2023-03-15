<template>
  <ComponentQuickPanel component-name="proposal_print" :switch-label="t('printing.enable')"/>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

import ComponentQuickPanel from '../meetings/ComponentQuickPanel.vue'

const { t } = useI18n()
</script>
