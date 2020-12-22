<template>
  <main>
    <component :is="methodComponent" :proposals="proposals" :authors="authors" @valid="setValid" />
    <div class="buttons">
      <btn icon="how_to_vote" :disabled="!validVote" @click="$alert(`*not implemented (value: ${validVote})`)">Cast vote</btn>
    </div>
  </main>
</template>

<script>
import { computed, onMounted, ref, watch } from 'vue'

import useProposals from '../../composables/meeting/useProposals'
import pollMethods from '../pollmethods'
import useMeeting from '../../composables/meeting/useMeeting'

export default {
  name: 'VotingModal',
  props: {
    data: Object
  },
  setup (props) {
    const { getPollProposals } = useProposals()
    const { meetingId, getParticipants, fetchParticipants } = useMeeting()

    const proposals = computed(_ => {
      return getPollProposals(props.data.pk)
    })

    const methodComponent = computed(_ => {
      return pollMethods[props.data.method]
    })

    const authors = computed(_ => {
      return new Map(getParticipants(meetingId.value).map(p => [p.user.pk, p.user]))
    })

    onMounted(_ => {
      fetchParticipants(meetingId.value, proposals.value.map(p => p.author))
    })
    watch(proposals, _ => {
      fetchParticipants(meetingId.value, proposals.value.map(p => p.author))
    })

    // Valid vote value emitted from method
    const validVote = ref(null)
    function setValid (vote) {
      validVote.value = vote
    }

    return {
      proposals,
      authors,
      methodComponent,
      validVote,
      setValid
    }
  }
}
</script>

<style lang="sass" scoped>
.buttons
  text-align: center
</style>
