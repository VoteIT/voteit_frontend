<template>
  <Widget class="poll">
    <header>
      <Menu float :show-transitions="canChange(poll)" :content-type="pollType" :content-pk="poll.pk" />
      <h2>{{ poll.title }}</h2>
      <p v-if="isOngoing && poll.started"><Moment :prepend="t('started')" :date="poll.started" /></p>
      <p v-else-if="isFinished && poll.closed"><Moment :prepend="t('finished')" :date="poll.closed" /></p>
      <p v-else>{{ t(`poll.method.${poll.method_name}`) }}</p>
    </header>
    <div class="body">
      <template v-if="isFinished">
        <component v-if="resultComponent" :is="resultComponent" :data="poll.result">
          <template v-if="poll.result.approved.length">
            <h3>{{ t('poll.numApproved', poll.result.approved.length )}}</h3>
            <div class="proposals approved">
              <Proposal v-for="pk in poll.result.approved" :key="pk" :p="getProposal(pk)" read-only selected />
            </div>
          </template>
          <BtnDropdown dark v-if="poll.result.denied.length" :title="t('poll.numDenied', poll.result.denied.length )" :style="{ marginTop: '1em' }">
            <div class="proposals denied">
              <Proposal v-for="pk in poll.result.denied" :key="pk" :p="getProposal(pk)" read-only />
            </div>
          </BtnDropdown>
        </component>
      </template>
      <btn @click="vote" color="accent" icon="mdi-vote" v-if="canVote(poll)">{{ t('poll.vote') }}</btn>
      <progress-bar v-if="pollStatus" absolute :value="pollStatus.voted" :total="pollStatus.total" />
    </div>
  </Widget>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, onBeforeUnmount, PropType, watch } from 'vue'

import useModal from '@/composables/useModal'

import usePolls from '@/composables/meeting/usePolls'
import useProposals from '@/composables/meeting/useProposals'

import Moment from '@/components/widgets/Moment.vue'
import WorkflowState from '@/components/widgets/WorkflowState.vue'
import BtnDropdown from '@/components/BtnDropdown.vue'
import Voting from '@/components/modals/Voting.vue'
import Proposal from './Proposal.vue'

import { pollResults } from '../pollmethods'
import pollType from '@/contentTypes/poll'
import { Poll } from '@/contentTypes/types'
import { PollState } from '@/contentTypes/poll/workflowStates'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  name: 'Poll',
  props: {
    poll: {
      type: Object as PropType<Poll>,
      required: true
    },
    detail: Boolean
  },
  components: {
    WorkflowState,
    BtnDropdown,
    Proposal,
    Moment
  },
  setup (props) {
    const channels = pollType.getChannel()
    const { openModal } = useModal()
    const { getProposal } = useProposals()
    const { getPollStatus } = usePolls()

    const { t } = useI18n()

    function vote () {
      openModal({
        title: t('poll.votingTitle', props.poll as Record<string, any>),
        component: Voting,
        data: props.poll
      })
    }

    const isFinished = computed(() => props.poll.state === PollState.Finished)
    const isOngoing = computed(() => props.poll.state === PollState.Ongoing)

    const resultComponent = computed(() => isFinished.value && pollResults[props.poll.method_name])

    if (props.detail) {
      watch(isOngoing, value => {
        if (value) return channels.subscribe(props.poll.pk)
        channels.leave(props.poll.pk)
      })
      onBeforeMount(() => {
        if (isOngoing.value) channels.subscribe(props.poll.pk)
      })
      onBeforeUnmount(() => {
        if (isOngoing.value) channels.leave(props.poll.pk)
      })
    }

    const pollStatus = computed(() => {
      return getPollStatus(props.poll.pk)
    })

    return {
      pollType,
      ...pollType.rules,
      vote,
      t,
      resultComponent,
      getProposal,
      pollStatus,
      isFinished,
      isOngoing
    }
  }
})
</script>

<style lang="sass">
div.poll
  header
    .dropdown
      float: right

  .voting-info
    margin-top: 1em

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
