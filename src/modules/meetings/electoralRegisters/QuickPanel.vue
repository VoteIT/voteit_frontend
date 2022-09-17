<template>
  <v-card-text>
    {{ t('electoralRegister.activeMethod', { method: policyName }) }}
  </v-card-text>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import useMeeting from '../useMeeting'

const { t } = useI18n()
const { meeting } = useMeeting()
const policy = computed(() => meeting.value?.er_policy_name)
const policyName = computed(() => {
  return policy.value
    ? t(`erMethods.${policy.value}.title`)
    : '-'
})
</script>
