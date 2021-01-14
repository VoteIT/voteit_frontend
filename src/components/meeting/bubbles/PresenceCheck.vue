<template>
  <div>
    <h2>Presence check</h2>
    <p>
      U there, bruh?
    </p>
    <btn @click="presence.channel.add(data.presenceCheck.pk)" icon="pets">Represent!</btn>
  </div>
</template>

<script>
import usePresence from '@/composables/meeting/usePresence'

export default {
  name: 'PresenceCheck',
  props: {
    data: Object
  },
  setup () {
    const presence = usePresence()

    return {
      presence
    }
  }
}
</script>
