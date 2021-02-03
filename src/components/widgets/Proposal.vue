<template>
  <div class="proposal">
    <div class="author">{{ getUser(p.author).full_name }} {{ p.pk }}</div>
    <richtext v-if="editing" v-model="body" @submit="setEditing(false)" set-focus />
    <div v-else v-html="p.body" />
    <div v-if="hasRole('moderator')" class="controls">
      <workflow-state admin :state="p.state" content-type="proposal" :pk="p.pk" />
      <btn sm icon="edit" :class="{ active: editing }" @click="setEditing(!editing)" />
      <btn sm icon="delete" @click="channels.delete(p.pk)" />
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
  setup (props) {
    const wfStates = computed(_ => proposalStates)
    const channels = useChannels('proposal')
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
      wfStates,
      channels,
      body,
      editing,
      setEditing,
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
