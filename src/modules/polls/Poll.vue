<script setup lang="ts">
import { computed, ref } from 'vue'
import { useElementSize } from '@vueuse/core'

import { slugify } from '@/utils'
import Dropdown from '@/components/Dropdown.vue'
import Moment from '@/components/Moment.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import Widget from '@/components/Widget.vue'
import WorkflowState from '@/components/WorkflowState.vue'

import useMeeting from '../meetings/useMeeting'
import usePollStore from '../polls/usePollStore'
import ProposalSheet from '../proposals/ProposalSheet.vue'

import { pollType } from './contentTypes'
import usePoll from './usePoll'
import { Poll } from './types'

const props = defineProps<{ poll: Poll }>()

const { isModerator } = useMeeting()
const { getPollStatus, getUserVote } = usePollStore()
const {
  canVote,
  approved,
  denied,
  isOngoing,
  isFinished,
  pollMethodName,
  voteCount
} = usePoll(computed(() => props.poll.pk))

const rootEl = ref<HTMLDivElement>()
const { width } = useElementSize(rootEl)
const proposalColumns = computed(() => (width.value < 640 ? 1 : 2))

const pollStatus = computed(() => getPollStatus(props.poll.pk))
const pollRoute = computed(() => ({
  name: 'poll',
  params: { pid: props.poll.pk, pslug: slugify(props.poll.title) }
}))
const userVote = computed(() => getUserVote(props.poll))
</script>

<template>
  <Widget class="poll" ref="rootEl" :style="{ '--columns': proposalColumns }">
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
          <div
            class="proposals ga-2"
            :class="{ 'full-width': approved.length === 1 }"
          >
            <ProposalSheet
              v-for="p in approved"
              :key="p.pk"
              elevation="2"
              :proposal="p"
            />
          </div>
        </Dropdown>
        <Dropdown
          v-if="denied.length"
          :title="$t('poll.numDenied', denied.length)"
          class="mb-2"
        >
          <div
            class="proposals ga-2"
            :class="{ 'full-width': denied.length === 1 }"
          >
            <ProposalSheet
              v-for="p in denied"
              :key="p.pk"
              elevation="2"
              :proposal="p"
            />
          </div>
        </Dropdown>
        <ProgressBar
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
        <span v-if="pollStatus">
          {{
            $t(
              'poll.votedProgress',
              {
                ...pollStatus,
                percentage: Math.round(
                  (pollStatus.voted / pollStatus.total) * 100
                )
              },
              pollStatus.voted
            )
          }}
        </span>
        <template #right>
          <span v-if="userVote" class="active">
            {{ $t('poll.youHaveVoted') }}
            <v-icon size="x-small" icon="mdi-check" />
          </span>
          <span v-else-if="canVote">
            {{ $t('poll.youHaveNotVoted') }}
            <v-icon size="x-small" icon="mdi-check" />
          </span>
        </template>
      </ProgressBar>
    </div>
  </Widget>
</template>

<style lang="sass" scoped>
header
  a
    text-decoration: none
    color: rgb(var(--v-theme-on-surface))

.voting-info
  margin-top: 1em

.proposals
  display: grid
  grid-template-columns: repeat(var(--columns, 1), 1fr)
  &.full-width
    --columns: 1
</style>
