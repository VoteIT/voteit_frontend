<script setup lang="ts">
import { orderBy, sortBy } from 'lodash'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import ProgressBar from '@/components/ProgressBar.vue'
import WorkflowState from '@/components/WorkflowState.vue'
import Dropdown from '@/components/Dropdown.vue'

import useMeetingId from '../meetings/useMeetingId'
import { filterPolls, getUserVote } from '../polls/usePolls'
import { Poll, PollState } from '../polls/types'
import usePoll from '../polls/usePoll'
import { pollPlugins } from '../polls/registry'
import PollBallot from '../polls/PollBallot.vue'
import { pollType } from '../polls/contentTypes'
import PollProgress from '../polls/PollProgress.vue'

const { t } = useI18n()

const props = defineProps<{
  openPoll?: number | null
}>()

const meetingId = useMeetingId()
const { getState } = pollType.useWorkflows()

function annotatePoll(poll: Poll) {
  return {
    ...poll,
    hasVoted: !!getUserVote(poll),
    methodName: pollPlugins.getName(poll.method_name, t),
    stateName: getState(poll.state)?.getName(t)
  }
}

const _selectedId = ref(props.openPoll)

function isPoll(poll?: Poll | false): poll is Poll {
  return !!poll
}

const allFinishedPolls = computed(() =>
  orderBy(
    filterPolls(
      (p) => p.meeting === meetingId.value && p.state === PollState.Finished
    ),
    'closed',
    'desc'
  )
)
const latestFinishedPolls = computed(() => allFinishedPolls.value.slice(0, 3))
const finishedPollsExpanded = ref(false)
const finishedPolls = computed(() => {
  if (finishedPollsExpanded.value) return allFinishedPolls.value
  const extra = [...new Set([props.openPoll, _selectedId.value])]
    .map(
      (pk) =>
        !latestFinishedPolls.value.some((p) => p.pk === pk) &&
        allFinishedPolls.value.find((p) => p.pk === pk)
    )
    .filter(isPoll)
  return [...latestFinishedPolls.value, ...extra]
})

const availablePolls = computed(() => {
  const ongoingAndOpen = sortBy(
    filterPolls(
      (p) =>
        p.meeting === meetingId.value &&
        p.state !== PollState.Finished && // These will already be displayed
        (p.pk === props.openPoll || // Always show broadcasted poll
          p.pk === _selectedId.value || // ... and user currently selected poll
          p.state === PollState.Ongoing) // ... and all ongoing polls
    ),
    'started'
  )

  return [
    ...ongoingAndOpen.map(annotatePoll),
    '---',
    ...finishedPolls.value.map(annotatePoll)
  ]
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
    selectionMenuExpanded.value = false
  }
})

const {
  canVote,
  isOngoing,
  nextUnvoted,
  poll,
  pollStatus,
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
 * Open voting modal if broadcast says so. Let user close by themselves, though.
 */
const isOpen = ref(!!props.openPoll)
watch(
  () => props.openPoll,
  (value) => {
    if (!value) return
    if (!isOpen.value) selectedPollId.value = value
    isOpen.value = true
  }
)
/**
 * TODO Guard this modal from closing when started voting!
 */

/**
 * Mobile stuff
 */
const selectionMenuExpanded = ref(false)

watch(isOpen, (value) => {
  if (value) return
  finishedPollsExpanded.value = false
  selectionMenuExpanded.value = false
})
</script>

<template>
  <v-dialog max-width="1200px" v-model="isOpen">
    <template #activator="{ props }">
      <slot name="activator" :props="props"></slot>
    </template>
    <template #default="{ isActive }">
      <v-sheet
        class="d-flex"
        :class="{ 'menu-expanded': selectionMenuExpanded }"
        id="voting-container"
        rounded
        style="height: calc(100vh - 48px)"
      >
        <div class="flex-shrink-0 pa-4" id="selection">
          <v-slide-x-transition group>
            <template
              v-for="poll in availablePolls"
              :key="typeof poll === 'string' ? poll : poll.pk"
            >
              <template v-if="typeof poll === 'string'">
                <p class="text-center text-secondary mt-8">
                  {{ t('poll.workflow.closed', latestFinishedPolls.length) }}
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
                    <h3>
                      {{ poll.title }}
                    </h3>
                    <p style="opacity: 0.7">
                      {{ poll.methodName }}
                    </p>
                  </div>
                  <v-icon v-if="openPoll === poll.pk" icon="mdi-broadcast" />
                </div>
                <div
                  v-if="canVote && poll.state === PollState.Ongoing"
                  class="px-3 py-1 text-right"
                >
                  {{
                    poll.hasVoted
                      ? t('poll.youHaveVoted')
                      : t('poll.youHaveNotVoted')
                  }}
                  <v-icon
                    class="mt-n1"
                    size="small"
                    :icon="poll.hasVoted ? 'mdi-check' : 'mdi-vote'"
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
          <v-btn
            v-if="
              !finishedPollsExpanded &&
              allFinishedPolls.length > latestFinishedPolls.length
            "
            block
            class="mt-n2"
            :text="t('poll.showAll')"
            size="small"
            prepend-icon="mdi-chevron-down"
            variant="text"
            @click="finishedPollsExpanded = true"
          />
        </div>
        <div class="flex-grow-1 pa-4" id="poll">
          <header class="d-flex mb-6">
            <v-btn
              class="d-md-none mr-2"
              icon="mdi-menu"
              size="small"
              variant="tonal"
              @click="selectionMenuExpanded = !selectionMenuExpanded"
            />
            <div class="flex-grow-1">
              <h2>
                {{ poll?.title ?? t('poll.vote') }}
              </h2>
              <p class="text-secondary">
                {{
                  t('poll.pollDescription', {
                    method: pollMethodName,
                    count: proposals.length
                  })
                }}
              </p>
              <p v-if="isOngoing && !canVote" class="mt-3">
                <span class="header-tag">{{ t('poll.cantVote') }}</span>
              </p>
            </div>
            <v-btn
              class="mt-n2 mr-n2"
              icon="mdi-close"
              size="small"
              variant="text"
              @click="isActive.value = false"
            />
          </header>
          <div v-if="!poll" class="my-8 text-center">
            <v-progress-circular indeterminate color="primary" size="large" />
          </div>
          <template v-else-if="poll.state === PollState.Finished">
            <ProgressBar
              class="mt-4 mb-8"
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
            <template v-if="canVote">
              <PollBallot
                v-if="!userVote || changeVote"
                :disabled="!canVote"
                :key="poll.pk"
                :poll="poll"
                :proposals="proposals"
                :model-value="canVote ? userVote?.vote : undefined"
                @voting-complete="changeVote = false"
              />
              <template v-else-if="userVote">
                <PollProgress class="mb-8" :poll-status="pollStatus" />
                <v-alert
                  :text="t('poll.voteAddedInfo')"
                  icon="mdi-check-circle"
                  class="mb-4"
                  color="success"
                />
              </template>
              <div v-if="canVote" class="mt-4">
                <v-btn
                  v-if="userVote && !changeVote"
                  class="mr-1"
                  color="secondary"
                  prepend-icon="mdi-vote"
                  :text="t('poll.viewAndChangeVote')"
                  @click="changeVote = true"
                />
                <v-btn
                  v-if="nextUnvoted"
                  color="primary"
                  prepend-icon="mdi-star"
                  :text="t('poll.nextUnvoted', { ...nextUnvoted })"
                  @click="selectedPollId = nextUnvoted.pk"
                />
              </div>
            </template>
            <template v-else>
              <PollProgress class="mb-8" :poll-status="pollStatus" />
              <Dropdown :title="t('poll.showBallot')">
                <PollBallot
                  disabled
                  :key="poll.pk"
                  :poll="poll"
                  :proposals="proposals"
                />
              </Dropdown>
            </template>
          </template>
          <WorkflowState v-else :content-type="pollType" :object="poll" />
        </div>
      </v-sheet>
    </template>
  </v-dialog>
</template>

<style lang="sass" scoped>
#voting-container
  > div
    overflow-x: auto

#selection
  background-color: rgba(0, 0, 0, 0.1)
  width: 327px

@media (max-width: 959px)
  #poll
    margin-right: 0
    transition: margin-right 250ms

  #selection
    margin-left: -327px
    transition: margin-left 250ms

  .menu-expanded
    > #selection
      margin-left: 0
    > #poll
      margin-right: -327px
</style>
