<template>
  <main>
    <h1>{{ meeting.title }}</h1>
  </main>
</template>

<script>
import useMeeting from '@/composables/meeting/useMeeting.js'

export default {
  name: 'MeetingIndex',
  setup () {
    return useMeeting()
  }
}
</script>
