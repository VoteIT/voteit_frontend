<template>
  <div class="proposal" :class="{ selected }">
    <slot name="top"/>
    <div class="author"><user :pk="p.author" /> <a :href="'#' + p.prop_id" class="tag">#{{ p.prop_id }}</a></div>
    <div><moment :date="p.created" /></div>
    <richtext :editing="editing" :channel="channel" :object="p" @edit-done="editing = false" />
    <div class="btn-controls" v-if="!readOnly">
      <workflow-state :admin="canChange(p) || canRetract(p)" :state="p.state" content-type="proposal" :pk="p.pk" />
      <btn v-if="canChange(p)" sm icon="edit" :class="{ active: editing }" @click="editing = !editing" />
      <btn v-if="canChange(p)" :disabled="!canDelete(p)" sm icon="delete" @click="queryDelete" />
    </div>
    <slot name="bottom"/>
  </div>
</template>

<script>
import { inject, ref } from 'vue'
import { dialogQuery } from '@/utils'

import Moment from './Moment.vue'
import Richtext from './Richtext.vue'
import WorkflowState from './WorkflowState.vue'

import useChannels from '@/composables/useChannels'
import rules from '@/contentTypes/proposal/rules'

export default {
  name: 'Proposal',
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
      editing,
      queryDelete,
      channel,
      ...rules
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
