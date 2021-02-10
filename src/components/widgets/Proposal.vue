<template>
  <div class="proposal" :class="{ selected }">
    <div class="author"><user :pk="p.author" /> <a :href="'#' + p.prop_id" class="tag">#{{ p.prop_id }}</a></div>
    <div><moment :date="p.created" /></div>
    <richtext :editing="editing" :channel="channel" :object="p" @edit-done="editing = false" />
    <div v-if="!readOnly && hasRole('moderator')" class="btn-controls">
      <workflow-state admin :state="p.state" content-type="proposal" :pk="p.pk" />
      <btn sm icon="edit" :class="{ active: editing }" @click="editing = !editing" />
      <btn sm icon="delete" @click="queryDelete" />
    </div>
  </div>
</template>

<script>
import { computed, inject, ref } from 'vue'
import { dialogQuery } from '@/utils'

import Moment from './Moment.vue'
import Richtext from './Richtext.vue'
import WorkflowState from './WorkflowState.vue'

import useChannels from '../../composables/useChannels'

import proposalStates from '../../schemas/proposalStates.json'

export default {
  name: 'Proposal',
  inject: ['hasRole'],
  props: {
    p: Object,
    readOnly: Boolean,
    selected: Boolean
  },
  components: {
    WorkflowState,
    Richtext,
    Moment
  },
  setup (props) {
    const wfStates = computed(_ => proposalStates)
    const channel = useChannels('proposal')
    const editing = ref(false)
    const t = inject('t')

    function queryDelete () {
      dialogQuery(t('proposal.deletePrompt'))
        .then(_ => {
          channel.delete(props.p.pk)
        })
    }

    return {
      wfStates,
      editing,
      queryDelete,
      channel
    }
  }
}
</script>

<style lang="sass">
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
  .btn-controls
    text-align: right

  &.selected
    background-color: #ded

a.tag
  color: #333
  font-size: 10pt
  text-decoration: none
  font-weight: 500
  margin-left: .5em
</style>
