<template>
  <div class="discussion">
    <div class="author"><user :pk="p.author" /></div>
    <div><moment :date="p.created" /></div>
    <richtext :editing="editing" :channel="channel" :object="p" @edit-done="editing = false" />
    <div v-if="!readOnly" class="btn-controls">
      <btn v-if="canChange(p)" sm icon="edit" :class="{ active: editing }" @click="editing = !editing" />
      <btn v-if="canDelete(p)" sm icon="delete" @click="queryDelete()" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, PropType, ref } from 'vue'

import Moment from './Moment.vue'
import Richtext from './Richtext.vue'

import { dialogQuery } from '@/utils'
import discussionPostType from '@/contentTypes/discussionPost'
import { DiscussionPost } from '@/contentTypes/types'

export default defineComponent({
  name: 'DiscussionPost',
  props: {
    p: {
      type: Object as PropType<DiscussionPost>,
      required: true
    },
    readOnly: Boolean
  },
  components: {
    Richtext,
    Moment
  },
  setup (props) {
    const channel = discussionPostType.useChannels()
    const editing = ref(false)
    const t = inject('t') as CallableFunction

    function queryDelete () {
      dialogQuery(t('discussion.deletePrompt'))
        .then(() => {
          channel.delete(props.p.pk)
        })
    }

    return {
      channel,
      editing,
      queryDelete,
      ...discussionPostType.rules
    }
  }
})
</script>

<style lang="sass" scoped>
.discussion
  margin-bottom: 1rem
  background-color: var(--widget-bg)
  border: var(--widget-border)
  border-left: 6px solid var(--discussion)
  border-radius: 6px
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
