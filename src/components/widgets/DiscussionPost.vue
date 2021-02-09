<template>
  <div class="discussion">
    <div class="author"><user :pk="p.author" /></div>
    <div><moment :date="p.created" /></div>
    <richtext :editing="editing" :channel="channel" :object="p" @edit-done="editing = false" />
    <div v-if="hasRole('moderator')" class="btn-controls">
      <btn sm icon="edit" :class="{ active: editing }" @click="editing = !editing" />
      <btn sm icon="delete" @click="queryDelete()" />
    </div>
  </div>
</template>

<script>
import { inject, ref } from 'vue'

import Moment from './Moment.vue'
import Richtext from './Richtext.vue'

import useMeeting from '../../composables/meeting/useMeeting.js'
import useChannels from '../../composables/useChannels.js'
import { dialogQuery } from '@/utils'

export default {
  name: 'DiscussionPost',
  props: {
    p: Object
  },
  components: {
    Richtext,
    Moment
  },
  setup (props) {
    const channel = useChannels('discussion_post')
    const editing = ref(false)
    const t = inject('t')

    function queryDelete () {
      dialogQuery(t('discussion.deletePrompt'))
        .then(_ => {
          channel.delete(props.p.pk)
        })
    }

    return {
      ...useMeeting(),
      channel,
      editing,
      queryDelete
    }
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
