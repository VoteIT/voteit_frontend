<template>
  <div>
    <h2>
      {{ t('presence.check') }}
    </h2>
    <template v-if="userPresence">
      <p class="my-2">
        {{ t('presence.presenceNoted') }}
      </p>
      <v-btn @click="togglePresence()" color="primary" prepend-icon="mdi-undo-variant" :disabled="working">
        {{ t('undo') }}
      </v-btn>
    </template>
    <template v-else>
      <p class="my-2">
        {{ t('presence.notePresent') }}
      </p>
      <v-btn @click="togglePresence()" color="primary" prepend-icon="mdi-hand-wave" :disabled="working">
        {{ t('presence.imHere') }}
      </v-btn>
    </template>
    <template v-if="canChange">
      <v-divider class="mt-4 mb-2" />
      <PresenceCheckControl :check="presenceCheck" subscribe />
    </template>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watchEffect } from 'vue'
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
    const working = ref(false)

    const canChange = computed(() => presenceCheck.value && canChangePresenceCheck(presenceCheck.value))
    async function togglePresence () {
      if (!presenceCheck.value) return
      working.value = true
      try {
        if (userPresence.value) await undoPresence(userPresence.value)
        else {
          await markPresence(presenceCheck.value)
          emit('update:open', false)
        }
      } catch {
        // TODO
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
