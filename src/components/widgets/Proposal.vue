<template>
  <div class="proposal">
    <div class="author">{{ getUser(meetingId, p.author).full_name }} {{ p.pk }}</div>
    <p>
      {{ p.title }}
    </p>
    <div v-if="hasRole('moderator')" class="controls">
      <workflow-state admin :state="p.state" content-type="proposal" :pk="p.pk" />
      <btn sm icon="delete" @click="channels.delete(p.pk)" />
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

import WorkflowState from './WorkflowState.vue'

import useMeeting from '../../composables/meeting/useMeeting.js'
import useChannels from '../../composables/useChannels'

import proposalStates from '../../schemas/proposalStates.json'

export default {
  name: 'Proposal',
  setup () {
    const wfStates = computed(_ => proposalStates)
    const channels = useChannels('proposal')
    return {
      wfStates,
      channels,
      ...useMeeting()
    }
  },
  props: {
    p: Object
  },
  components: {
    WorkflowState
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
</style>
