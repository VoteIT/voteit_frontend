<template>
  <div>
    <h2>Presence check</h2>
    <template v-if="!isPresent">
      <p>
        U there, bruh?
      </p>
      <btn @click="presence.channel.add(data.presenceCheck.pk)" icon="pets">Represent!</btn>
    </template>
    <p v-else>You have stated your presence</p>
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

    const isPresent = computed(_ => {
      console.log('presence', presence.getUserPresence(props.data.presenceCheck.pk))
      return presence.getUserPresence(props.data.presenceCheck.pk)
    })

    return {
      presence,
      isPresent
    }
  }
}
</script>
