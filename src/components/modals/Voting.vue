<template>
  <main>
    <h2 v-if="abstained">You have abstained from this vote</h2>
    <h2 v-else-if="done">Your vote has been registered</h2>
    <template v-else>
      <component :is="methodComponent" :proposals="proposals" @valid="setValid" />
      <div class="buttons btn-group">
        <btn icon="how_to_vote" :disabled="!validVote || waiting" @click="castVote(validVote)">Cast vote</btn>
        <btn icon="block" :disable="waiting" @click="abstainVote()">Abstain</btn>
      </div>
    </template>
  </main>
</template>

<script>
import { computed, ref } from 'vue'

import useProposals from '@/composables/meeting/useProposals'
import pollMethods from '../pollmethods'
import useAlert from '../../composables/useAlert'
import useChannels from '../../composables/useChannels'

export default {
  name: 'VotingModal',
  props: {
    data: Object
  },
  setup (props) {
    const { getPollProposals } = useProposals()
    const { alert } = useAlert()
    const channels = useChannels('vote')

    const waiting = ref(false)
    const abstained = ref(false)
    const done = ref(false)

    const proposals = computed(_ => {
      return getPollProposals(props.data.pk)
    })

    const methodComponent = computed(_ => pollMethods[props.data.method_name])

    // Valid vote value emitted from method
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

    return {
      proposals,
      methodComponent,
      waiting,
      abstained,
      done,
      validVote,
      setValid,
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
