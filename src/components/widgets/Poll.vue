<template>
  <div class="poll">
    <div class="head">
      <h2>{{ poll.title }}</h2>
      <workflow-state :state="poll.state" :admin="hasRole('moderator')" content-type="poll" :pk="poll.pk" />
    </div>
    <div class="body">
      <btn @click="vote" icon="ballot" v-if="ongoing && hasRole('potential_voter')">Vote</btn>
      <p>
        Other poll info
      </p>
      <btn-dropdown dark class="voting-info" v-if="ongoing" title="Watch voting" @open="active=true" @close="active=false">
        <progress-bar v-if="pollStatus" absolute :value="pollStatus.voted" :total="pollStatus.total" />
        <p v-else>Loading...</p>
      </btn-dropdown>
    </div>
  </div>
</template>

<script>
import { computed, onBeforeUnmount, ref, watch } from 'vue'

import useMeeting from '../../composables/meeting/useMeeting'
import useChannels from '../../composables/useChannels'
import usePolls from '../../composables/meeting/usePolls'
import useModal from '../../composables/useModal'

import WorkflowState from '../../components/widgets/WorkflowState'
import BtnDropdown from '../../components/BtnDropdown'
import Voting from '../../components/modals/Voting'

import pollStates from '../../schemas/pollStates'

export default {
  name: 'Poll',
  props: {
    poll: Object
  },
  components: {
    WorkflowState,
    BtnDropdown
  },
  setup (props) {
    const { getPollStatus } = usePolls()
    const channels = useChannels('poll')
    const { openModal } = useModal()
    const ongoing = computed(_ => props.poll.state === 'ongoing')

    function vote () {
      openModal({
        title: 'Voting ' + props.poll.title,
        component: Voting,
        data: props.poll
      })
    }

    // Toggle active listens to ongoing poll statuses
    const active = ref(false)
    watch(active, value => {
      if (value) {
        // fetchPollStatus(props.poll.pk)
        channels.subscribe(props.poll.pk)
      } else {
        channels.leave(props.poll.pk)
      }
    })

    const pollStatus = computed(_ => {
      return getPollStatus(props.poll.pk)
    })

    onBeforeUnmount(_ => {
      if (active.value) {
        channels.leave(props.poll.pk)
      }
    })

    return {
      ongoing,
      active,
      pollStates,
      pollStatus,
      vote,
      ...useMeeting()
    }
  }
}
</script>

<style lang="sass">
div.poll
  background-color: #eee
  padding: .5rem
  border-radius: 6px
  margin: 1rem 0

  .head
    display: flex
    h2
      margin: 0
      flex: 1 0 auto
      text-decoration: none

  .body
    padding-top: 1rem

body.no-scroll
  overflow: hidden
</style>
