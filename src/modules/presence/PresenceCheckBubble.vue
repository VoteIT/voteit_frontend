<template>
  <div>
    <h2>
      {{ t('presence.check') }}
    </h2>
    <template v-if="!userPresence">
      <p class="my-2">
        {{ t('presence.notePresent') }}
      </p>
      <btn @click="presence.channel.add({ presence_check: data.presenceCheck.pk })" icon="mdi-hand-wave">
        {{ t('presence.imHere') }}
      </btn>
    </template>
    <template v-else>
      <p class="my-2">
        {{ t('presence.presenceNoted') }}
      </p>
      <btn @click="presence.channel.delete(userPresence.pk)" icon="mdi-undo-variant">
        {{ t('undo') }}
      </btn>
    </template>
    <template v-if="canChangePresenceCheck(data.presenceCheck)">
      <v-divider class="mt-4 mb-2" />
      <PresenceCheckControl :check="data.presenceCheck" subscribe />
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
  components: { PresenceCheckControl },
  name: 'PresenceCheck',
  icon: 'mdi-hand-wave',
  props: {
    data: {
      type: Object,
      required: true
    }
  },
  setup (props) {
    const { t } = useI18n()
    const presence = usePresence()

    const userPresence = computed(() => {
      return presence.getUserPresence(props.data.presenceCheck.pk)
    })

    return {
      t,
      presence,
      userPresence,
      canChangePresenceCheck
    }
  }
})
</script>
