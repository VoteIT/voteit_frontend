<template>
  <main>
    <h2 v-if="abstained">{{ t('poll.abstainRegistered') }}</h2>
    <h2 v-else-if="done">{{ t('poll.voteRegistered') }}</h2>
    <template v-else>
      <component ref="method" :is="methodComponent" :proposals="proposals" @valid="setValid" />
      <div class="buttons btn-group">
        <btn icon="how_to_vote" :disabled="!validVote || waiting" @click="castVote(validVote)">{{ t('poll.castVote') }}</btn>
        <btn icon="block" :class="{ active: currentAbstained && !validVote }" :disable="waiting" @click="abstainVote()">{{ t('poll.abstain') }}</btn>
      </div>
    </template>
  </main>
</template>

<script>
import { computed, onBeforeMount, ref } from 'vue'

import useProposals from '@/composables/meeting/useProposals'
import pollMethods from '../pollmethods'
import useAlert from '../../composables/useAlert'
import useChannels from '../../composables/useChannels'

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
    function setValid (vote) {
      validVote.value = vote
    }

    function castVote (vote) {
      if (vote) {
        waiting.value = true
        // Hopefully
        // const msg = {
        //   vote,
        //   method_name: props.data.method_name
        // }
        // channels.add(props.data.pk, msg)
        const msg = {
          pk: props.data.pk,
          vote
        }
        channels.post(`${props.data.method_name}_vote.add`, msg)
          .then(_ => {
            done.value = true
          })
          .catch(_ => {
            waiting.value = false
          })
      } else {
        alert(`*not implemented (value: ${vote})`)
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
          if (p.vote) method.value.setCurrent(p.vote)
          currentAbstained.value = p.abstain
        })
    })

    return {
      proposals,
      methodComponent,
      waiting,
      abstained,
      done,
      validVote,
      setValid,
      castVote,
      method,
      currentAbstained,
      abstainVote
    }
  }
}
</script>

<style lang="sass" scoped>
.buttons
  text-align: center
</style>
