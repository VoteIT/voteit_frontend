<script setup lang="ts">
import { orderBy, sortBy } from 'lodash'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import ProgressBar from '@/components/ProgressBar.vue'
import WorkflowState from '@/components/WorkflowState.vue'
import useChannel from '@/composables/useChannel'

import useMeeting from '../meetings/useMeeting'
import { filterPolls, getPollStatus, getUserVote } from '../polls/usePolls'
import { Poll, PollState } from '../polls/types'
import { canVote } from '../polls/rules'
import usePoll from '../polls/usePoll'
import { pollPlugins } from '../polls/registry'
import PollBallot from '../polls/PollBallot.vue'
import { pollType } from '../polls/contentTypes'

const { t } = useI18n()

const props = defineProps<{
  openPoll?: number | null
}>()

const { getState } = pollType.useWorkflows()

const { meetingId } = useMeeting()

function annotatePoll(poll: Poll) {
  return {
    ...poll,
    hasVoted: !!getUserVote(poll),
    methodName: pollPlugins.getName(poll.method_name, t),
    stateName: getState(poll.state)?.getName(t)
  }
}

const _selectedId = ref(props.openPoll)
const availablePolls = computed(() => {
  const finished = orderBy(
    filterPolls(
      (p) => p.meeting === meetingId.value && p.state === PollState.Finished
    ),
    'closed',
    'desc'
  ).slice(0, 3)

  const open = sortBy(
    filterPolls(
      (p) =>
        p.meeting === meetingId.value &&
        !finished.some(({ pk }) => pk === p.pk) && // These will already be displayed
        (p.pk === props.openPoll || // Always show broadcasted poll
          p.pk === _selectedId.value || // ... and user currently selected poll
          (p.state === PollState.Ongoing && canVote(p))) // ... and all ongoing polls where user can vote
    ),
    ['started']
  )

  return [...open.map(annotatePoll), '---', ...finished.map(annotatePoll)]
})

function getFirstPk(): number | undefined {
  for (const p of availablePolls.value) {
    if (typeof p !== 'string') return p.pk
  }
}

const selectedPollId = computed({
  get() {
    return _selectedId.value ?? getFirstPk()
  },
  set(value) {
    _selectedId.value = value
  }
})

const {
  poll,
  pollMethodName,
  proposals,
  resultComponent,
  userVote,
  voteCount
} = usePoll(selectedPollId)
const changeVote = ref(false)

watch(selectedPollId, () => {
  changeVote.value = false
})

/**
 * Subscribe to poll channel when ongoing and user has voted.
 */
const subscribePollId = computed(() => {
  if (!userVote || poll.value?.state !== PollState.Ongoing) return
  return selectedPollId.value
})
useChannel('poll', subscribePollId)
const pollStatus = computed(() =>
  typeof selectedPollId.value === 'number'
    ? getPollStatus(selectedPollId.value)
    : undefined
)
</script>

<template>
  <v-dialog max-width="1200px">
    <template #activator="{ props }">
      <slot name="activator" :props="props"></slot>
    </template>
    <template #default="{ isActive }">
      <v-sheet rounded>
        <div class="d-flex" style="height: calc(100vh - 48px)">
          <div
            class="flex-shrink-0 pa-4"
            style="
              background-color: rgba(0, 0, 0, 0.1);
              width: 360px;
              overflow-x: auto;
            "
          >
            <v-slide-x-transition group>
              <template
                v-for="poll in availablePolls"
                :key="typeof poll === 'string' ? poll : poll.pk"
              >
                <template v-if="typeof poll === 'string'">
                  <p class="text-center text-secondary">
                    {{ t('poll.workflow.closed', 2) }}
                  </p>
                  <v-divider class="mb-3" />
                </template>
                <v-sheet
                  v-else
                  class="mb-4 cursor-pointer"
                  :color="selectedPollId === poll.pk ? 'success' : undefined"
                  rounded
                  @click="selectedPollId = poll.pk"
                >
                  <div class="pa-3 d-flex">
                    <div class="flex-grow-1">
                      <h3 class="text-truncate">
                        {{ poll.title }}
                      </h3>
                      <p style="opacity: 0.7">
                        {{ poll.methodName }}
                      </p>
                    </div>
                    <v-icon v-if="openPoll === poll.pk" icon="mdi-broadcast" />
                  </div>
                  <div
                    v-if="poll.state === PollState.Ongoing && poll.hasVoted"
                    class="px-3 py-1 rounded-b text-right"
                  >
                    {{ t('poll.youHaveVoted') }}
                    <v-icon
                      v-if="poll.hasVoted"
                      class="mt-n1"
                      size="small"
                      icon="mdi-check"
                    />
                  </div>
                  <div
                    v-else-if="poll.state !== PollState.Finished"
                    class="px-3 py-1 rounded-b text-right"
                  >
                    {{ poll.stateName }}
                  </div>
                </v-sheet>
              </template>
            </v-slide-x-transition>
          </div>
          <div class="flex-grow-1 pa-4" style="overflow-x: auto">
            <div class="d-flex">
              <h2 class="flex-grow-1">
                {{ poll?.title ?? t('poll.vote') }}
              </h2>
              <v-btn
                class="mt-n2 mr-n2"
                icon="mdi-close"
                size="small"
                variant="text"
                @click="isActive.value = false"
              />
            </div>
            <p class="text-secondary mb-6">
              {{
                t('poll.pollDescription', {
                  method: pollMethodName,
                  count: proposals.length
                })
              }}
            </p>
            <div v-if="!poll" class="my-8 text-center">
              <v-progress-circular indeterminate color="primary" size="large" />
            </div>
            <template v-else-if="poll.state === PollState.Finished">
              <ProgressBar
                class="my-4"
                :text="voteCount.text"
                :value="voteCount.voted"
                :total="voteCount.total"
              />
              <h3>
                {{ t('poll.result.method', { method: pollMethodName }) }}
              </h3>
              <component
                :is="resultComponent"
                :result="poll.result"
                :abstainCount="poll.abstain_count"
                :proposals="poll.proposals"
              />
            </template>
            <template v-else-if="poll.state === PollState.Ongoing">
              <PollBallot
                v-if="!userVote || changeVote"
                :key="poll.pk"
                :poll="poll"
                :proposals="proposals"
                :model-value="userVote?.vote"
                @voting-complete="changeVote = false"
              />
              <template v-else-if="userVote">
                <ProgressBar
                  class="my-4"
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
                </ProgressBar>
                <v-alert
                  :text="t('poll.voteAddedInfo')"
                  icon="mdi-check-circle"
                  class="mb-4"
                  color="success"
                />
                <v-btn
                  prepend-icon="mdi-vote"
                  :text="t('poll.viewAndChangeVote')"
                  @click="changeVote = true"
                  color="secondary"
                />
              </template>
            </template>
            <WorkflowState v-else :content-type="pollType" :object="poll" />
          </div>
        </div>
      </v-sheet>
    </template>
  </v-dialog>
</template>
