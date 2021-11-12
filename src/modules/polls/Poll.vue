<template>
  <Widget class="poll">
    <header>
      <router-link :to="pollPath">
        <v-icon>mdi-chevron-right</v-icon>
        <h3>{{ poll.title }} <small class="text-secondary ml-4">{{ methodName }}</small></h3>
        <div class="meta">
          <span v-if="isOngoing && poll.started"><Moment :prepend="t('poll.started')" :date="poll.started" /></span>
          <span v-else-if="isFinished && poll.closed"><Moment :prepend="t('poll.finished')" :date="poll.closed" /></span>
          <span v-else></span>
        </div>
      </router-link>
    </header>
    <div class="body">
      <template v-if="isFinished">
        <Dropdown v-if="approved.length" :title="t('poll.numApproved', approved.length )" class="mb-2">
          <div class="proposals approved">
            <Proposal v-for="p in approved" :key="p.pk" :p="p" read-only />
          </div>
        </Dropdown>
        <Dropdown v-if="denied.length" :title="t('poll.numDenied', denied.length )" class="mb-2">
          <div class="proposals denied">
            <Proposal v-for="p in denied" :key="p.pk" :p="p" read-only />
          </div>
        </Dropdown>
      </template>

      <!-- <Btn @click="vote()" color="accent" icon="mdi-vote" v-if="canVote(poll)">{{ userVote ? t('poll.changeVote') : t('poll.vote') }}</Btn> -->

      <ProgressBar v-if="isOngoing" :value="pollStatus?.voted" :total="pollStatus?.total">
        <span v-if="pollStatus">{{ t('poll.votedProgress', {
          ...pollStatus,
          percentage: Math.round(pollStatus.voted / pollStatus.total * 100)
        }, pollStatus.voted) }}</span>
        <v-btn prepend-icon="mdi-reload" v-else variant="text" size="small" @click="follow()">
          {{ t('poll.showProgress') }}
        </v-btn>
        <span v-if="userVote" class="active">{{ t('poll.youHaveVoted') }} <v-icon size="x-small" icon="mdi-check"/></span>
        <span v-else-if="canVote">{{ t('poll.youHaveNotVoted') }} <v-icon size="x-small" icon="mdi-check"/></span>
      </ProgressBar>

    </div>
  </Widget>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeUnmount, PropType, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import useModal from '@/composables/useModal'
import Moment from '@/components/Moment.vue'

import usePolls from '../polls/usePolls'
import ProposalVue from '../proposals/Proposal.vue'
import useMeeting from '../meetings/useMeeting'

import Voting from './Voting.vue'
import { slugify } from '@/utils'
import { pollType } from './contentTypes'
import { Poll } from './methods/types'
import usePoll from './usePoll'

export default defineComponent({
  name: 'Poll',
  props: {
    poll: {
      type: Object as PropType<Poll>,
      required: true
    }
  },
  components: {
    Proposal: ProposalVue,
    Moment
  },
  setup (props) {
    const { t } = useI18n()
    const channels = pollType.getChannel({ leaveDelay: 0 })
    const { meetingPath } = useMeeting()
    const { openModal } = useModal()
    const { getPollStatus, getUserVote } = usePolls()
    const { canVote, approved, denied, isOngoing, isFinished } = usePoll(computed(() => props.poll.pk))

    function vote () {
      openModal({
        component: Voting,
        data: props.poll
      })
    }

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
    const methodName = computed(() => t(`poll.method.${props.poll.method_name}`))

    return {
      t,
      approved,
      denied,
      pollPath,
      pollType,
      pollStatus,
      isFinished,
      isOngoing,
      userVote,
      following,
      methodName,
      canVote,
      follow,
      vote
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
        margin-right: -14px
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
    > *
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
