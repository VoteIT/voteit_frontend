<template>
  <main>
    <h2 v-if="abstained">{{ t('poll.abstainRegistered') }}</h2>
    <h2 v-else-if="done">{{ t('poll.voteRegistered') }}</h2>
    <template v-else>
      <component ref="method" :is="methodComponent" :poll="data" :proposals="proposals" v-model="validVote" />
      <div class="buttons btn-controls">
        <btn icon="mdi-vote" :disabled="!validVote || waiting" @click="castVote()">{{ t('poll.castVote') }}</btn>
        <v-btn color="warning" :disabled="waiting" @click="abstainVote()">
          <v-icon left icon="mdi-cancel"/>{{ t('poll.abstain') }}
        </v-btn>
      </div>
    </template>
  </main>
</template>

<script lang="ts">
import { Component, computed, defineComponent, onBeforeMount, PropType, ref } from 'vue'

import useAlert from '@/composables/useAlert'
import useProposals from '@/composables/meeting/useProposals'

import { pollMethods } from '../pollmethods'

import { Poll, Proposal, Vote } from '@/contentTypes/types'
import { ChannelsMessage } from '@/utils/types'
import Channel from '@/contentTypes/Channel'

export default defineComponent({
  name: 'VotingModal',
  inject: ['t'],
  props: {
    data: {
      type: Object as PropType<Poll>,
      required: true
    }
  },
  setup (props) {
    const { getPollProposals } = useProposals()
    const { alert } = useAlert()
    const channels = new Channel('vote', { alertOnError: false })

    const method = ref(null)
    const waiting = ref(false)
    const abstained = ref(false)
    const done = ref(false)

    const proposals = computed<Proposal[]>(() => getPollProposals(props.data))

    const methodComponent = computed<Component | undefined>(() => pollMethods[props.data.method_name])

    // Valid vote value emitted from method
    const currentAbstained = ref(false)
    const validVote = ref<Object | null>(null)

    function castVote () {
      if (validVote.value) {
        waiting.value = true
        // Hopefully, some day
        // const msg = {
        //   vote,
        //   method_name: props.data.method_name
        // }
        // channels.contextAdd(props.data.pk, msg)
        const msg = {
          poll: props.data.pk,
          vote: validVote.value
        }
        channels.post(`${props.data.method_name}_vote.add`, msg)
          .then(() => {
            done.value = true
          })
          .catch(() => {
            waiting.value = false
          })
      } else {
        alert(`*not implemented (value: ${validVote.value})`)
      }
    }

    function abstainVote () {
      channels.post('vote.abstain', { poll: props.data.pk })
        .then(() => {
          abstained.value = true
        })
        .catch(() => {
          waiting.value = false
        })
    }

    onBeforeMount(() => {
      channels.get(props.data.pk)
        .then((msg: ChannelsMessage) => {
          const p = msg.p as Vote
          if (p.vote) validVote.value = p.vote
          currentAbstained.value = p.abstain
        })
        .catch(() => {}) // Should mean no previous vote, but should be sanity checked.
    })

    return {
      proposals,
      methodComponent,
      method,
      waiting,
      abstained,
      done,
      validVote,
      currentAbstained,
      castVote,
      abstainVote
    }
  }
})
</script>

<style lang="sass" scoped>
.buttons
  text-align: center
</style>
