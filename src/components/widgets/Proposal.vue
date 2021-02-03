<template>
  <div class="proposal">
    <div class="author">{{ getUser(p.author).full_name }} {{ p.pk }}</div>
    <richtext :editing="editing" :channel="channel" :object="p" @edit-done="editing = false" />
    <div v-if="hasRole('moderator')" class="controls">
      <workflow-state admin :state="p.state" content-type="proposal" :pk="p.pk" />
      <btn sm icon="edit" :class="{ active: editing }" @click="editing = !editing" />
      <btn sm icon="delete" @click="channel.delete(p.pk)" />
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue'

import WorkflowState from './WorkflowState.vue'
import Richtext from './Richtext.vue'

import useMeeting from '../../composables/meeting/useMeeting.js'
import useChannels from '../../composables/useChannels'

import proposalStates from '../../schemas/proposalStates.json'

export default {
  name: 'Proposal',
  setup () {
    const wfStates = computed(_ => proposalStates)
    const channel = useChannels('proposal')
    const editing = ref(false)

    return {
      wfStates,
      channel,
      editing,
      ...useMeeting()
    }
  },
  props: {
    p: Object
  },
  components: {
    WorkflowState,
    Richtext
  }
}
</script>

<style lang="sass" scoped>
.proposal
  margin-bottom: 1rem
  border: 1px solid #ddd
  border-left: 6px solid #dde
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
