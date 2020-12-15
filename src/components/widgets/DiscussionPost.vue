<template>
  <div class="discussion">
    <div class="author">{{ getUser(p.author, meetingId).full_name }} {{ p.pk }}</div>
    <p>
      {{ p.title }}
    </p>
    <div v-if="hasRole('moderator')" class="controls">
      <btn icon="delete" sm @click="$api.delete(`discussion-posts/${p.pk}/`)" />
    </div>
  </div>
</template>

<script>
import useMeeting from '../../composables/meeting/useMeeting.js'
import useMeetingRoles from '../../composables/meeting/useMeetingRoles.js'

export default {
  name: 'DiscussionPost',
  setup () {
    return {
      ...useMeeting(),
      ...useMeetingRoles()
    }
  },
  props: {
    p: Object
  }
}
</script>

<style lang="sass" scoped>
.discussion
  margin-bottom: 1rem
  border: 1px solid #ddd
  border-left: 6px solid #edd
  border-radius: 6px
  background-color: #eee
  padding: 10px
  .author
    font-weight: bold
  p
    padding-left: .5rem
    margin: .5rem 0
    white-space: pre
  .controls
    text-align: right
</style>
