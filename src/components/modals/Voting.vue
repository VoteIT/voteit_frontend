<template>
  <main>
    <h2 v-if="abstained">{{ t('poll.abstainRegistered') }}</h2>
    <h2 v-else-if="done">{{ t('poll.voteRegistered') }}</h2>
    <template v-else>
      <component ref="method" :is="methodComponent" :poll="data" :proposals="proposals" v-model="validVote" />
      <div class="buttons btn-group">
        <btn icon="how_to_vote" :disabled="!validVote || waiting" @click="castVote()">{{ t('poll.castVote') }}</btn>
        <btn icon="block" :class="{ active: currentAbstained && !validVote }" :disable="waiting" @click="abstainVote()">{{ t('poll.abstain') }}</btn>
      </div>
    </template>
  </main>
</template>

<script>
import { computed, onBeforeMount, ref } from 'vue'

import useAlert from '@/composables/useAlert'
import useChannels from '@/composables/useChannels'
import useProposals from '@/composables/meeting/useProposals'

import pollMethods from '../pollmethods'

export default {
  name: 'VotingModal',
  inject: ['t'],
  props: {
    data: Object
  },
  setup (props) {
    const { getPollProposals } = useProposals()
    const { alert } = useAlert()
    const channels = useChannels('vote', { alertOnError: false })

    const method = ref(null)
    const waiting = ref(false)
    const abstained = ref(false)
    const done = ref(false)

    const proposals = computed(_ => {
      return getPollProposals(props.data.pk)
    })

    const methodComponent = computed(_ => pollMethods[props.data.method_name])

    // Valid vote value emitted from method
    const currentAbstained = ref(false)
    const validVote = ref(null)

    function castVote () {
      if (validVote.value) {
        waiting.value = true
        // Hopefully, some day
        // const msg = {
        //   vote,
        //   method_name: props.data.method_name
        // }
        // channels.add(props.data.pk, msg)
        const msg = {
          pk: props.data.pk,
          vote: validVote.value
        }
        channels.post(`${props.data.method_name}_vote.add`, msg)
          .then(_ => {
            done.value = true
          })
          .catch(_ => {
            waiting.value = false
          })
      } else {
        alert(`*not implemented (value: ${validVote.value})`)
      }
    }

    function abstainVote () {
      channels.post('vote.abstain', { pk: props.data.pk })
        .then(_ => {
          abstained.value = true
        })
        .catch(_ => {
          waiting.value = false
        })
    }

    onBeforeMount(_ => {
      channels.get(props.data.pk)
        .then(({ p }) => {
          if (p.vote) validVote.value = p.vote
          currentAbstained.value = p.abstain
        })
        .catch(_ => {}) // Should mean no previous vote
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
}
</script>

<style lang="sass" scoped>
.buttons
  text-align: center
</style>
