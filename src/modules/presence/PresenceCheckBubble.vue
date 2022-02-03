<template>
  <div>
    <h2>
      {{ t('presence.check') }}
    </h2>
    <template v-if="userPresence">
      <p class="my-2">
        {{ t('presence.presenceNoted') }}
      </p>
      <btn @click="togglePresence()" icon="mdi-undo-variant">
        {{ t('undo') }}
      </btn>
    </template>
    <template v-else>
      <p class="my-2">
        {{ t('presence.notePresent') }}
      </p>
      <btn @click="togglePresence()" icon="mdi-hand-wave">
        {{ t('presence.imHere') }}
      </btn>
    </template>
    <template v-if="canChange">
      <v-divider class="mt-4 mb-2" />
      <PresenceCheckControl :check="presenceCheck" subscribe />
    </template>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'

import useMeeting from '../meetings/useMeeting'
import usePresence from './usePresence'
import { canChangePresenceCheck } from './rules'

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
    const { meetingId } = useMeeting()
    const { presenceCheck, userPresence, isPresent, markPresence, undoPresence } = usePresence(meetingId)

    const canChange = computed(() => presenceCheck.value && canChangePresenceCheck(presenceCheck.value))
    function togglePresence () {
      if (userPresence.value) return undoPresence(userPresence.value)
      if (!presenceCheck.value) return
      markPresence(presenceCheck.value)
      emit('update:open', false)
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
      togglePresence
    }
  }
})
</script>
