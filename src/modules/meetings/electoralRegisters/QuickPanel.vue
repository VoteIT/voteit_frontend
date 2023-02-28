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

const policyName = computed(() => {
  if (!erMethod.value) return '-'
  return erMethod.value.title || t(`erMethods.${erMethod.value.name}.title`)
})
</script>
