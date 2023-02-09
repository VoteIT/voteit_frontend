<template>
  <v-card-text>
    {{ t('electoralRegister.activeMethod', { method: policyName }) }}
  </v-card-text>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import useMeeting from '../useMeeting'
import useElectoralRegisters from './useElectoralRegisters'

const { t } = useI18n()
const { meetingId } = useMeeting()
const { erMethod } = useElectoralRegisters(meetingId)

const policyName = computed(() => {
  if (!erMethod.value) return '-'
  return erMethod.value.title || t(`erMethods.${erMethod.value.name}.title`)
})
</script>
