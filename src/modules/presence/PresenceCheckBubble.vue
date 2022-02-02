<template>
  <div>
    <h2>
      {{ t('presence.check') }}
    </h2>
    <template v-if="userPresence">
      <p class="my-2">
        {{ t('presence.presenceNoted') }}
      </p>
      <btn @click="presence.undoPresence(userPresence)" icon="mdi-undo-variant">
        {{ t('undo') }}
      </btn>
    </template>
    <template v-else>
      <p class="my-2">
        {{ t('presence.notePresent') }}
      </p>
      <btn @click="presence.markPresence(data.presenceCheck)" icon="mdi-hand-wave">
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
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'

import usePresence from '@/modules/presence/usePresence'
import PresenceCheckControl from './PresenceCheckControl.vue'
import { canChangePresenceCheck } from '@/modules/presence/rules'

export default defineComponent({
  id: 'presence-check',
  icon: 'mdi-hand-wave',
  components: { PresenceCheckControl },
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  setup (props) {
    const { t } = useI18n()
    const presence = usePresence()

    const presenceCheck = computed(() => props.data.presenceCheck)
    const userPresence = computed(() => presence.getUserPresence(props.data.presenceCheck.pk))
    const canChange = computed(() => canChangePresenceCheck(presenceCheck.value))

    return {
      t,
      canChange,
      presence,
      presenceCheck,
      userPresence
    }
  }
})
</script>
