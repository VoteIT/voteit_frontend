<template>
  <div class="discussion">
    <div class="author">{{ getUser(p.author).full_name }} {{ p.pk }}</div>
    <p>
      {{ p.title }}
    </p>
    <div v-if="hasRole('moderator')" class="controls">
      <btn sm icon="delete" @click="channels.delete(p.pk)" />
    </div>
  </div>
</template>

<script>
import useMeeting from '../../composables/meeting/useMeeting.js'
import useChannels from '../../composables/useChannels.js'

export default {
  name: 'DiscussionPost',
  setup () {
    const channels = useChannels('discussion_post')
    return {
      ...useMeeting(),
      channels
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
    white-space: pre-wrap
  .controls
    text-align: right
</style>
