<template>
  <div class="poll">
    <div class="head">
      <h2>{{ poll.title }}</h2>
      <workflow-state :state="poll.state" :admin="hasRole('moderator')" content-type="poll" :pk="poll.pk" />
    </div>
    <div class="body">
      <btn @click="vote" icon="ballot" v-if="isOngoing && hasRole('potential_voter')">{{ t('poll.vote') }}</btn>
      <p v-if="poll.state === 'finished'">
        {{ poll.result_data }}
      </p>
      <p v-else>
        Other poll info ...
      </p>
      <btn-dropdown dark class="voting-info" v-if="isOngoing" title="Watch voting" @open="active=true" @close="active=false">
        <progress-bar v-if="poll" absolute :value="poll.voted" :total="poll.total" />
        <p v-else>{{ t('loader.loading') }}...</p>
      </btn-dropdown>
    </div>
  </div>
</template>

<script>
import { computed, inject, onBeforeUnmount, ref, watch } from 'vue'

import useChannels from '../../composables/useChannels'
import useModal from '../../composables/useModal'

import WorkflowState from '../../components/widgets/WorkflowState'
import BtnDropdown from '../../components/BtnDropdown'
import Voting from '../../components/modals/Voting'

import pollStates from '../../schemas/pollStates'

export default {
  name: 'Poll',
  inject: ['hasRole'],
  props: {
    poll: Object
  },
  components: {
    WorkflowState,
    BtnDropdown
  },
  setup (props) {
    const channels = useChannels('poll')
    const { openModal } = useModal()
    const isOngoing = computed(_ => props.poll.state === 'ongoing')

    const t = inject('t')

    function vote () {
      openModal({
        title: t('poll.votingTitle', props.poll),
        component: Voting,
        data: props.poll
      })
    }

    // Toggle active listens to ongoing poll statuses
    const active = ref(false)
    watch(active, value => {
      if (value) {
        channels.subscribe(props.poll.pk)
      } else {
        channels.leave(props.poll.pk)
      }
    })

    onBeforeUnmount(_ => {
      if (active.value) {
        channels.leave(props.poll.pk)
      }
    })

    return {
      isOngoing,
      active,
      pollStates,
      vote,
      t
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
