<template>
  <div>
    <h2>
      {{ t('presence.check') }}
    </h2>
    <template v-if="userPresence">
      <p class="my-2">
        {{ t('presence.presenceNoted') }}
      </p>
      <v-btn @click="togglePresence()" color="primary" prepend-icon="mdi-undo-variant" :disabled="working" :loading="working">
        {{ t('undo') }}
      </v-btn>
    </template>
    <template v-else>
      <p class="my-2">
        {{ t('presence.notePresent') }}
      </p>
      <v-btn @click="togglePresence()" color="primary" prepend-icon="mdi-hand-wave" :disabled="working" :loading="working">
        {{ t('presence.imHere') }}
      </v-btn>
    </template>
    <template v-if="canChange">
      <v-divider class="mt-4 mb-2" />
      <PresenceCheckControl />
    </template>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

import usePresence from './usePresence'
import { canChangePresenceCheck } from './rules'
import useAlert from '@/composables/useAlert'
import useMeeting from '../meetings/useMeeting'

export default defineComponent({
  id: 'presence-check',
  icon: 'mdi-hand-wave',
  order: 10,
  props: {
    modelValue: Boolean
  },
  emits: ['close', 'update:modelValue', 'update:open', 'update:attention'],
  setup (props, { emit }) {
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
        if (!wasPresent) emit('update:open', false)
      } catch {
        alert(`*Could not set presence to ${isPresent.value}`)
      }
      working.value = false
    }

    watchEffect(() => {
      switch (isPresent.value) {
        case false:
          emit('update:modelValue', true)
          emit('update:attention', true)
          break
        case true:
          emit('update:modelValue', true)
          emit('update:attention', false)
          break
        case undefined:
          emit('update:modelValue', false)
          break
      }
    })

    return {
      t,
      canChange,
      presenceCheck,
      userPresence,
      working,
      togglePresence
    }
  }
})
</script>
