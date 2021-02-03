<template>
  <div class="discussion">
    <div class="author">{{ getUser(p.author).full_name }}</div>
    <richtext :editing="editing" :channel="channel" :object="p" @edit-done="editing = false" />
    <div v-if="hasRole('moderator')" class="btn-controls">
      <btn sm icon="edit" :class="{ active: editing }" @click="editing = !editing" />
      <btn sm icon="delete" @click="channel.delete(p.pk)" />
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

import Richtext from './Richtext.vue'

import useMeeting from '../../composables/meeting/useMeeting.js'
import useChannels from '../../composables/useChannels.js'

export default {
  name: 'DiscussionPost',
  components: {
    Richtext
  },
  setup () {
    const channel = useChannels('discussion_post')
    const editing = ref(false)

    return {
      ...useMeeting(),
      channel,
      editing
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
  .btn-controls
    text-align: right
</style>
