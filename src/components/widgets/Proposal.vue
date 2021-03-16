<template>
  <Widget v-if="p" class="proposal" :selected="selected">
    <slot name="top"/>
    <div class="author"><user :pk="p.author" /> <a :href="'#' + p.prop_id" class="tag">#{{ p.prop_id }}</a></div>
    <div><Moment :date="p.created" /></div>
    <Richtext :editing="editing" :channel="channel" :object="p" @edit-done="editing = false" />
    <div class="btn-controls" v-if="!readOnly">
      <slot name="buttons"/>
      <WorkflowState :admin="canChange(p) || canRetract(p)" :state="p.state" :content-type="proposalType" :pk="p.pk" />
      <Btn v-if="canChange(p)" sm color="secondary" icon="mdi-pencil" :active="editing" @click="editing = !editing" />
      <Btn v-if="canDelete(p)" sm color="warning" icon="mdi-delete" @click="queryDelete" />
    </div>
    <slot name="bottom"/>
  </Widget>
  <Widget v-else class="proposal">
    <em>{{ t('proposal.notFound') }}</em>
  </Widget>
</template>

<script lang="ts">
import { defineComponent, inject, PropType, ref } from 'vue'
import { dialogQuery } from '@/utils'

import Moment from './Moment.vue'
import Richtext from './Richtext.vue'
import WorkflowState from './WorkflowState.vue'

import proposalType from '@/contentTypes/proposal'
import { Proposal } from '@/contentTypes/types'

export default defineComponent({
  name: 'Proposal',
  inject: ['t'],
  props: {
    p: {
      type: Object as PropType<Proposal>,
      required: true
    },
    readOnly: Boolean,
    selected: Boolean
  },
  components: {
    WorkflowState,
    Richtext,
    Moment
  },
  setup (props) {
    const channel = proposalType.getChannel()
    const editing = ref(false)
    const t = inject('t') as CallableFunction

    async function queryDelete () {
      if (!await dialogQuery(t('proposal.deletePrompt'))) return
      channel.delete(props.p.pk)
    }

    return {
      proposalType,
      editing,
      queryDelete,
      channel,
      ...proposalType.rules
    }
  }
})
</script>

<style lang="sass" scoped>
.proposal
  border-left: 6px solid var(--proposal)
  .author
    font-weight: bold
  p
    padding-left: .5rem
    margin: .5rem 0
    white-space: pre-wrap
  .btn-controls
    text-align: right

a.tag
  font-size: 10pt
  text-decoration: none
  font-weight: 500
  margin-left: .5em
</style>
