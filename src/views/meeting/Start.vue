<template>
  <main>
    <h1>{{ meeting.title }}</h1>
  </main>
</template>

<script>
import MeetingBase from './MeetingBase.js'

export default {
  name: 'MeetingIndex',
  extends: MeetingBase
}
</script>
