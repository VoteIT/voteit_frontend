<template>
  <div>
    <h2>Presence check</h2>
    <template v-if="!userPresence">
      <p>
        U there, bruh?
      </p>
      <btn @click="presence.channel.add({ presence_check: data.presenceCheck.pk })" icon="mdi-hand-wave">Represent!</btn>
    </template>
    <template v-else>
      <p>Your presence has been noted.</p>
      <btn @click="presence.channel.delete(userPresence.pk)" icon="mdi-undo-variant">Undo</btn>
    </template>
    <template v-if="canChange(data.presenceCheck)">
      <v-divider class="mt-2" />
      <PresenceCheckControl :check="data.presenceCheck" subscribe />
    </template>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'

import presenceCheckType from '@/contentTypes/presenceCheck'
import usePresence from '@/composables/meeting/usePresence'
import PresenceCheckControl from '../PresenceCheckControl.vue'

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
    const presence = usePresence()

    const userPresence = computed(() => {
      return presence.getUserPresence(props.data.presenceCheck.pk)
    })

    return {
      ...presenceCheckType.rules,
      presence,
      userPresence
    }
  }
})
</script>
