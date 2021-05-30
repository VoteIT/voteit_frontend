<template>
  <Widget class="poll">
    <header>
      <router-link :to="pollPath">
        <v-icon icon="mdi-chevron-right"/>
        <h3>{{ poll.title }}</h3>
        <div class="meta">
          <span v-if="isOngoing && poll.started"><Moment :prepend="t('poll.started')" :date="poll.started" /></span>
          <span v-else-if="isFinished && poll.closed"><Moment :prepend="t('poll.finished')" :date="poll.closed" /></span>
          <span v-else>{{ t(`poll.method.${poll.method_name}`) }}</span>
        </div>
      </router-link>
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

      <!-- <Btn @click="vote()" color="accent" icon="mdi-vote" v-if="canVote(poll)">{{ userVote ? t('poll.changeVote') : t('poll.vote') }}</Btn> -->

      <ProgressBar v-if="isOngoing" :value="pollStatus?.voted" :total="pollStatus?.total">
        <span v-if="pollStatus">{{ t('poll.votedProgress', {
          ...pollStatus,
          percentage: Math.round(pollStatus.voted / pollStatus.total * 100)
        }, pollStatus.voted) }}</span>
        <v-btn v-else flat size="small" @click="follow()">
          <v-icon left icon="mdi-reload" />
          {{ t('poll.showProgress') }}
        </v-btn>
        <span v-if="userVote" class="active">{{ t('poll.youHaveVoted') }} <v-icon size="x-small" icon="mdi-check"/></span>
        <span v-else-if="canVote(poll)">{{ t('poll.youHaveNotVoted') }} <v-icon size="x-small" icon="mdi-check"/></span>
      </ProgressBar>

    </div>
  </Widget>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, PropType, ref, watch } from 'vue'

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
import useMeeting from '@/composables/meeting/useMeeting'
import { slugify } from '@/utils'

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
    Proposal,
    Moment
  },
  setup (props) {
    const { t } = useI18n()
    const channels = pollType.getChannel({ leaveDelay: 0 })
    const { meetingPath } = useMeeting()
    const { openModal } = useModal()
    const { getProposal } = useProposals()
    const { getPollStatus, getUserVote } = usePolls()

    function vote () {
      openModal({
        component: Voting,
        data: props.poll
      })
    }

    const isFinished = computed(() => props.poll.state === PollState.Finished)
    const isOngoing = computed(() => props.poll.state === PollState.Ongoing)

    const resultComponent = computed(() => isFinished.value && pollResults[props.poll.method_name])

    const following = ref(false)
    watch(isOngoing, value => {
      if (value || !following.value) return
      channels.leave(props.poll.pk)
      following.value = false
    })
    onBeforeUnmount(() => {
      if (following.value) channels.leave(props.poll.pk)
    })
    function follow () {
      channels.subscribe(props.poll.pk)
      following.value = true
    }

    const pollStatus = computed(() => getPollStatus(props.poll.pk))
    const pollPath = computed(() => `${meetingPath.value}/polls/${props.poll.pk}/${slugify(props.poll.title)}`)
    const userVote = computed(() => getUserVote(props.poll))

    return {
      pollPath,
      pollType,
      ...pollType.rules,
      vote,
      t,
      resultComponent,
      getProposal,
      pollStatus,
      isFinished,
      isOngoing,
      userVote,
      follow,
      following
    }
  }
})
</script>

<style lang="sass">
div.poll
  header
    a
      text-decoration: none
      color: rgb(var(--v-theme-on-surface))
      .mdi
        float: right
        font-size: 40pt
        margin-top: 14px
    .meta
      color: rgb(var(--v-theme-secondary))
      margin-bottom: 1em
      > *
        margin-right: 1em
  .voting-info
    margin-top: 1em

  .proposals
    display: flex
    margin: -10px
    flex-flow: wrap
  .proposal
    margin: 10px
    flex: 0 1 calc(50% - 20px)

  .progress-bar
    span .mdi
      color: rgb(var(--v-border-color))
      vertical-align: initial
    span.active
      color: rgb(var(--v-theme-on-surface))
      .mdi
        color: rgb(var(--v-theme-on-surface))
        display: inline-block
        background-color: rgb(var(--v-theme-success))
        border-radius: 4px
        text-align: center
        width: 18px
        height: 18px

body.no-scroll
  overflow: hidden
</style>
