<template>
  <Widget class="poll">
    <header class="mb-1">
      <div class="d-flex">
        <router-link :to="pollRoute" class="flex-grow-1">
          <h3>
            {{ poll.title }}
            <small class="text-secondary ml-4">{{ pollMethodName }}</small>
          </h3>
          <div class="text-secondary">
            <Moment
              v-if="isOngoing && poll.started"
              :prepend="$t('poll.started')"
              :date="poll.started"
            />
            <Moment
              v-else-if="isFinished && poll.closed"
              :prepend="$t('poll.finished')"
              :date="poll.closed"
            />
          </div>
        </router-link>
        <div class="text-right d-flex flex-column">
          <WorkflowState
            v-if="isModerator"
            admin
            :object="poll"
            :contentType="pollType"
            right
          />
          <router-link :to="pollRoute">
            <v-icon size="xxx-large">mdi-chevron-right</v-icon>
          </router-link>
        </div>
      </div>
    </header>
    <div class="body">
      <template v-if="isFinished">
        <Dropdown
          v-if="approved.length"
          :title="$t('poll.numApproved', approved.length)"
          class="mb-2"
        >
          <div class="proposals approved">
            <Proposal v-for="p in approved" :key="p.pk" :p="p" read-only />
          </div>
        </Dropdown>
        <Dropdown
          v-if="denied.length"
          :title="$t('poll.numDenied', denied.length)"
          class="mb-2"
        >
          <div class="proposals denied">
            <Proposal v-for="p in denied" :key="p.pk" :p="p" read-only />
          </div>
        </Dropdown>
        <ProgressBar
          class="my-4"
          :text="voteCount.text"
          :value="voteCount.voted"
          :total="voteCount.total"
        />
      </template>

      <ProgressBar
        v-if="isOngoing"
        :value="pollStatus?.voted"
        :total="pollStatus?.total"
      >
        <span v-if="pollStatus">{{
          t(
            'poll.votedProgress',
            {
              ...pollStatus,
              percentage: Math.round(
                (pollStatus.voted / pollStatus.total) * 100
              )
            },
            pollStatus.voted
          )
        }}</span>
        <template #right>
          <span v-if="userVote" class="active"
            >{{ $t('poll.youHaveVoted') }}
            <v-icon size="x-small" icon="mdi-check"
          /></span>
          <span v-else-if="canVote"
            >{{ $t('poll.youHaveNotVoted') }}
            <v-icon size="x-small" icon="mdi-check"
          /></span>
        </template>
      </ProgressBar>
    </div>
  </Widget>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { slugify } from '@/utils'
import Dropdown from '@/components/Dropdown.vue'
import Moment from '@/components/Moment.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import Widget from '@/components/Widget.vue'
import WorkflowState from '@/components/WorkflowState.vue'

import usePolls from '../polls/usePolls'
import useMeeting from '../meetings/useMeeting'

import { pollType } from './contentTypes'
import usePoll from './usePoll'
import { Poll } from './types'

const props = defineProps<{ poll: Poll }>()

const { t } = useI18n()
const { isModerator, getMeetingRoute } = useMeeting()
const { getPollStatus, getUserVote } = usePolls()
const {
  canVote,
  approved,
  denied,
  isOngoing,
  isFinished,
  pollMethodName,
  voteCount
} = usePoll(computed(() => props.poll.pk))

const pollStatus = computed(() => getPollStatus(props.poll.pk))
const pollRoute = computed(() =>
  getMeetingRoute('poll', {
    pid: props.poll.pk,
    pslug: slugify(props.poll.title)
  })
)
const userVote = computed(() => getUserVote(props.poll))
</script>

<style lang="sass">
div.poll
  header
    a
      text-decoration: none
      color: rgb(var(--v-theme-on-surface))
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
