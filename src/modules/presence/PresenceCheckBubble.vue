<template>
  <div>
    <h2>
      {{ t('presence.check') }}
    </h2>
    <p class="my-2">
      {{ userPresence ? t('presence.presenceNoted') : t('presence.notePresent') }}
    </p>
    <v-btn
      @click="togglePresence"
      color="primary"
      :prepend-icon="userPresence ? 'mdi-undo-variant' : 'mdi-hand-wave'"
      :disabled="working"
      :loading="working"
    >
      {{ userPresence ? t('undo') : t('presence.imHere') }}
    </v-btn>
    <template v-if="canChange">
      <v-divider class="mt-4 mb-2" />
      <PresenceCheckControl />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import usePresence from './usePresence'
import { canChangePresenceCheck } from './rules'
import useAlert from '@/composables/useAlert'
import useMeeting from '../meetings/useMeeting'

defineProps({
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const { alert } = useAlert()
const { meetingId } = useMeeting()
const { presenceCheck, userPresence, isPresent, changePresence } = usePresence(meetingId)
const working = ref(false)

const canChange = computed(() => presenceCheck.value && canChangePresenceCheck(presenceCheck.value))

async function togglePresence () {
  if (!presenceCheck.value) return
  working.value = true
  // Save in case isPresent is not updated after await
  const wasPresent = isPresent.value
  try {
    await changePresence(presenceCheck.value.pk, !isPresent.value)
    if (!wasPresent) emit('update:modelValue', false)
  } catch {
    alert(`*Could not set presence to ${isPresent.value}`)
  }
  working.value = false
}
</script>
