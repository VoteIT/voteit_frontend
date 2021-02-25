<template>
  <div class="poll">
    <div class="head">
      <h2>{{ poll.title }}</h2>
      <workflow-state :state="poll.state" :admin="canChange(poll)" content-type="poll" :pk="poll.pk" />
    </div>
    <div class="body">
      <btn @click="vote" icon="ballot" v-if="canVote(poll)">{{ t('poll.vote') }}</btn>
      <template v-if="poll.state === 'finished'">
        <component v-if="resultComponent" :is="resultComponent" :data="poll.result_data">
          <template v-if="poll.result_data.approved.length">
            <h3>{{ t('poll.numApproved', poll.result_data.approved.length )}}</h3>
            <div class="proposals approved">
              <proposal v-for="pk in poll.result_data.approved" :key="pk" :p="getProposal(pk)" read-only selected />
            </div>
          </template>
          <btn-dropdown v-if="poll.result_data.denied.length" :title="t('poll.numDenied', poll.result_data.denied.length )" :style="{ marginTop: '1em' }">
            <div class="proposals denied">
              <proposal v-for="pk in poll.result_data.denied" :key="pk" :p="getProposal(pk)" read-only />
            </div>
          </btn-dropdown>
        </component>
      </template>
      <p v-else>
        {{ poll }}
      </p>
      <btn-dropdown dark class="voting-info" v-if="poll.state === 'ongoing'" :title="t('poll.watchVoting')" @open="active=true" @close="active=false">
        <progress-bar v-if="pollStatus" absolute :value="pollStatus.voted" :total="pollStatus.total" />
        <p v-else>{{ t('loader.loading') }}...</p>
      </btn-dropdown>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject, onBeforeUnmount, PropType, ref, watch } from 'vue'

import useModal from '@/composables/useModal'

import usePolls from '@/composables/meeting/usePolls'
import useProposals from '@/composables/meeting/useProposals'

import WorkflowState from '@/components/widgets/WorkflowState.vue'
import BtnDropdown from '@/components/BtnDropdown.vue'
import Voting from '@/components/modals/Voting.vue'
import Proposal from './Proposal.vue'

import { pollResults } from '../pollmethods'
import pollType from '@/contentTypes/poll'
import { Poll } from '@/contentTypes/types'

export default defineComponent({
  name: 'Poll',
  props: {
    poll: {
      type: Object as PropType<Poll>,
      required: true
    }
  },
  components: {
    WorkflowState,
    BtnDropdown,
    Proposal
  },
  setup (props) {
    const channels = pollType.useChannels()
    const { openModal } = useModal()
    const { getProposal } = useProposals()
    const { getPollStatus } = usePolls()

    const t = inject('t') as CallableFunction

    function vote () {
      openModal({
        title: t('poll.votingTitle', props.poll),
        component: Voting,
        data: props.poll
      })
    }

    const resultComponent = computed(() => props.poll.state === 'finished' && pollResults[props.poll.method_name])

    // Toggle active listens to ongoing poll statuses
    const active = ref(false)
    watch(active, value => {
      if (value) {
        channels.subscribe(props.poll.pk)
      } else {
        channels.leave(props.poll.pk)
      }
    })

    onBeforeUnmount(() => {
      if (active.value) {
        channels.leave(props.poll.pk)
      }
    })

    const pollStatus = computed(() => {
      return getPollStatus(props.poll.pk)
    })

    return {
      ...pollType.rules,
      active,
      vote,
      t,
      resultComponent,
      getProposal,
      pollStatus
    }
  }
})
</script>

<style lang="sass">
div.poll
  background-color: #eee
  padding: 1rem
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

  .proposals
    display: flex
    margin: -10px
    flex-flow: wrap
  .proposal
    margin: 10px
    flex: 0 1 calc(50% - 20px)

body.no-scroll
  overflow: hidden
</style>
