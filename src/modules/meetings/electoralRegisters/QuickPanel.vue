<template>
  <v-card-text>
    {{ t('electoralRegister.activeMethod', { method: policyName }) }}
  </v-card-text>
  <v-card-text v-if="erMethodLocked">
    <v-chip>
      <v-icon icon="mdi-lock" color="secondary" class="mr-1" />
      {{ t('electoralRegister.locked') }}
    </v-chip>
  </v-card-text>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import useMeeting from '../useMeeting'
import useElectoralRegisters from './useElectoralRegisters'

const { t } = useI18n()
const { meetingId } = useMeeting()
const { erMethod, erMethodLocked } = useElectoralRegisters(meetingId)

/**
 * This might not be needed any more. Backend should provide these values.
 */
function translatePolicyName (name: string): string {
  switch (name) {
    case 'auto_always':
      return t('erMethods.auto_always.title')
    case 'auto_before_poll':
      return t('erMethods.auto_before_poll.title')
    case 'manual':
      return t('erMethods.manual.title')
    case 'presence_check':
      return t('erMethods.presence_check.title')
  }
  throw new Error(`Unknown Electoral Register method: ${name}`)
}

const policyName = computed(() => {
  if (!erMethod.value) return '-'
  return erMethod.value.title || translatePolicyName(erMethod.value.name)
})
</script>
