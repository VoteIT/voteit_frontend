<template>
  <div>
    <h2>Presence check</h2>
    <template v-if="!userPresence">
      <p>
        U there, bruh?
      </p>
      <btn @click="presence.channel.add({ presence_check: data.presenceCheck.pk })" icon="mdi-hand">Represent!</btn>
    </template>
    <template v-else>
      <p>Your presence has been noted.</p>
      <btn @click="presence.channel.delete(userPresence.pk)" icon="mdi-undo-variant">Undo</btn>
    </template>
  </div>
</template>

<script lang="ts">
import usePresence from '@/composables/meeting/usePresence'
import { computed, defineComponent } from 'vue'

export default defineComponent({
  name: 'PresenceCheck',
  icon: 'mdi-hand',
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
      presence,
      userPresence
    }
  }
})
</script>
