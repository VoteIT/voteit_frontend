<template>
  <div>
    <h2>Presence check</h2>
    <template v-if="!userPresence">
      <p>
        U there, bruh?
      </p>
      <btn @click="presence.channel.add(data.presenceCheck.pk)" icon="pets">Represent!</btn>
    </template>
    <template v-else>
      <p>Your presence has been noted.</p>
      <btn @click="presence.channel.delete(userPresence.pk)" icon="undo">Undo</btn>
    </template>
  </div>
</template>

<script>
import usePresence from '@/composables/meeting/usePresence'
import { computed } from 'vue'

export default {
  name: 'PresenceCheck',
  icon: 'pan_tool',
  props: {
    data: Object
  },
  setup (props) {
    const presence = usePresence()

    const userPresence = computed(_ => {
      return presence.getUserPresence(props.data.presenceCheck.pk)
    })

    return {
      presence,
      userPresence
    }
  }
}
</script>
