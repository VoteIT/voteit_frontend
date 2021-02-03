<template>
  <div class="discussion">
    <div class="author">{{ getUser(p.author).full_name }} {{ p.pk }}</div>
    <richtext v-if="editing" v-model="body" @submit="setEditing(false)" set-focus />
    <div v-else v-html="p.body" />
    <div v-if="hasRole('moderator')" class="controls">
      <btn sm icon="edit" :class="{ active: editing }" @click="setEditing(!editing)" />
      <btn sm icon="delete" @click="channels.delete(p.pk)" />
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
  setup (props) {
    const channels = useChannels('discussion_post')
    const body = ref(props.p.body)
    const editing = ref(false)

    function submit () {
      channels.change(props.p.pk, { body: body.value })
        .then(_ => {
          editing.value = false
        })
    }

    function setEditing (value) {
      if (!value && body.value !== props.p.body) {
        return submit()
      }
      editing.value = value
    }

    return {
      ...useMeeting(),
      channels,
      body,
      editing,
      setEditing
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
    .btn
      margin-right: .2rem
      &:last-child
        margin-right: 0
</style>
