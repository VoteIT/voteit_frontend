<template>
  <v-row v-if="poll">
    <v-col offset-lg="2" lg="8">
      <header>
        <header class="d-flex">
          <div class="flex-grow-1">
            <span v-if="isOngoing && !canVote" class="header-tag">{{
              t('poll.cantVote')
            }}</span>
            <WorkflowState
              :admin="isModerator"
              :contentType="pollType"
              :object="poll"
            />
            <h1>{{ poll.title }}</h1>
            <p class="text-secondary">
              {{
                t('poll.pollDescription', {
                  method: pollMethodName,
                  count: poll.proposals.length
                })
              }}
            </p>
            <p v-if="agendaItem && agendaItemRoute">
              {{ $t('agenda.item') }}:
              <router-link :to="agendaItemRoute">
                {{ agendaItem.title }}
              </router-link>
            </p>
            <p v-if="electoralRegister">
              <v-tooltip>
                <template #activator="{ props }">
                  <span v-bind="props">
                    {{
                      erPreliminary
                        ? $t('electoralRegister.preliminary')
                        : $t('electoralRegister.electoralRegister')
                    }}:
                    <span class="text-secondary">
                      {{
                        DateTime.fromISO(
                          electoralRegister.created
                        ).toLocaleString(DateTime.DATETIME_SHORT)
                      }}
                    </span>
                  </span>
                </template>
                <span>
                  {{ erMethod?.title }}
                  (ID: {{ electoralRegister.pk }})
                </span>
              </v-tooltip>
            </p>
          </div>
          <DropdownMenu :items="menuItems" />
        </header>
        <div v-if="poll.body" v-html="poll.body"></div>
        <template v-if="isOngoing">
          <v-alert type="success" v-if="votingComplete" class="my-6">
            {{ $t('poll.voteAddedInfo') }}
          </v-alert>
          <v-alert type="info" v-else class="my-6">
            {{ pollHelpText }}
          </v-alert>
        </template>
      </header>
      <div v-if="isWithheld" id="poll-results" class="my-6">
        <ProgressBar
          class="my-4"
          :text="voteCount.text"
          :value="voteCount.voted"
          :total="voteCount.total"
        />
        <WithheldResult :pollId="pollId" />
      </div>
      <div v-if="isFinished" id="poll-results" class="my-6">
        <ProgressBar
          class="my-4"
          :text="voteCount.text"
          :value="voteCount.voted"
          :total="voteCount.total"
        />
        <h3>
          {{ $t('poll.result.method', { method: pollMethodName }) }}
        </h3>
        <component
          v-if="resultComponent"
          :is="resultComponent"
          :result="poll.result"
          :abstainCount="poll.abstain_count"
          :proposals="poll.proposals"
          class="mb-8"
        />
        <div v-else class="mt-4">
          <h2>
            {{ $t('poll.numApproved', approved.length) }}
          </h2>
          <ProposalCard
            v-for="proposal in approved"
            :key="proposal.pk"
            class="my-3"
            readOnly
            :p="proposal"
          />
          <Dropdown :title="$t('poll.numDenied', approved.length)">
            <ProposalCard
              v-for="proposal in denied"
              :key="proposal.pk"
              class="my-3"
              readOnly
              :p="proposal"
            />
          </Dropdown>
        </div>
      </div>
      <div v-else-if="isPrivateOrUpcoming">
        <v-divider class="my-3" />
        <h2>
          {{ $t('poll.ballot') }}
        </h2>
        <p class="text-secondary mb-4">
          {{ $t('proposal.ordering') }}: {{ proposalOrderingTitle }}
        </p>
        <component
          :is="voteComponent"
          :poll="poll"
          :proposals="proposals"
          disabled
          :key="poll.pk"
        />
      </div>
      <template v-else-if="!votingComplete">
        <component
          class="voting-component"
          :disabled="!canVote"
          v-if="isOngoing"
          :is="voteComponent"
          :poll="poll"
          :proposals="proposals"
          v-model="validVote"
          :key="poll.pk"
        />
        <div class="btn-controls mt-6" v-if="canVote">
          <v-btn
            color="primary"
            :disabled="!validVote || submitting"
            size="large"
            :text="$t('poll.vote')"
            prepend-icon="mdi-vote"
            @click="castVote"
          />
          <v-btn
            color="warning"
            :disabled="submitting"
            prepend-icon="mdi-cancel"
            :text="$t('poll.abstain')"
            @click="abstainVote"
          />
        </div>
      </template>
      <div class="mt-6">
        <v-btn
          v-for="{ props, title } in buttons"
          :key="title"
          class="mr-1 mb-1"
          :text="title"
          v-bind="props"
        />
        <DefaultDialog
          v-if="isFinished && isPollVoter"
          :title="$t('poll.yourVote')"
        >
          <template #activator="{ props }">
            <v-btn
              color="secondary mb-1"
              prepend-icon="mdi-vote"
              :text="$t('poll.showVote')"
              v-bind="props"
            />
          </template>
          <template v-slot="{ close }">
            <p v-if="!userVote">
              {{ $t('poll.didNotVote') }}
            </p>
            <p v-else-if="userVote.abstain">
              {{ $t('poll.abstained') }}
            </p>
            <component
              v-else
              class="voting-component"
              disabled
              :is="voteComponent"
              :poll="poll"
              :proposals="proposals"
              :modelValue="userVote.vote"
            />
            <v-spacer />
            <div class="text-right">
              <v-btn color="primary" :text="$t('close')" @click="close" />
            </div>
          </template>
        </DefaultDialog>
      </div>
    </v-col>
  </v-row>
</template>

<script lang="ts" setup>
import { DateTime } from 'luxon'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import { MenuItem, ThemeColor } from '@/utils/types'
import { dialogQuery, slugify } from '@/utils'
import { socket } from '@/utils/Socket'
import { openAlertEvent } from '@/utils/events'
import DefaultDialog from '@/components/DefaultDialog.vue'
import Dropdown from '@/components/Dropdown.vue'
import DropdownMenu from '@/components/DropdownMenu.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import WorkflowState from '@/components/WorkflowState.vue'
import useChannel from '@/composables/useChannel'
import useAgendaItem from '../agendas/useAgendaItem'
import useMeetingTitle from '../meetings/useMeetingTitle'
import useMeeting from '../meetings/useMeeting'
import ProposalCard from '../proposals/ProposalCard.vue'
import { proposalButtonPlugins } from '../proposals/registry'
import useProposalOrdering from '../proposals/useProposalOrdering'

import usePoll from './usePoll'
import { pollType, voteType } from './contentTypes'
import WithheldResult from './WithheldResult.vue'
import { PollState } from './types'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const pollId = computed(() => Number(route.params.pid))
const {
  approved,
  denied,
  electoralRegister,
  erMethod,
  poll,
  proposals,
  isFinished,
  isPrivateOrUpcoming,
  isOngoing,
  isPollVoter,
  isWithheld,
  pollHelpText,
  pollMethodName,
  userVote,
  canDelete,
  canVote,
  voteComponent,
  resultComponent,
  nextUnvoted,
  voteCount
} = usePoll(pollId)
const { isModerator, meeting, meetingId, getMeetingRoute } = useMeeting()
const { agendaItem, agendaItemRoute } = useAgendaItem(
  computed(() => poll.value?.agenda_item)
)
const { proposalOrderingTitle } = useProposalOrdering(
  t,
  computed(() => poll.value?.p_ord)
)

const subscribeAgendaItem = computed(() => {
  // Only if a component requires, i.e. proposal reaction buttons
  if (
    !meeting.value ||
    !proposalButtonPlugins.getActivePlugins(meeting.value).length
  )
    return
  return poll.value?.agenda_item
})
useChannel('agenda_item', subscribeAgendaItem)
useMeetingTitle(computed(() => poll.value?.title ?? t('poll.poll', 2)))

const validVote = ref(userVote.value?.vote) // Gets updates from method vote component, when valid.
const votingComplete = ref(!!userVote.value) // Set to false to allow changing vote
watch(userVote, (value) => {
  // Reset voting values if user vote is updated.
  votingComplete.value = !!value
  validVote.value = value?.vote
})
watch(pollId, () => {
  validVote.value = undefined
})

const submitting = ref(false)
async function castVote() {
  if (!validVote.value || !poll.value) return
  submitting.value = true
  const msg = {
    poll: poll.value.pk,
    vote: validVote.value
  }
  try {
    await socket.call(`${poll.value.method_name}_vote.add`, msg)
    votingComplete.value = true
  } catch (e) {
    openAlertEvent.emit(
      '^Critical error. Your vote was not accepted! Try again, or contact a meeting offical!'
    )
  }
  submitting.value = false
}

async function abstainVote() {
  if (!poll.value) return
  if (validVote.value) {
    if (
      !(await dialogQuery({
        title: t('poll.abstainValidVoteConfirm'),
        no: t('cancel'),
        yes: t('poll.abstain'),
        theme: ThemeColor.Warning
      }))
    ) {
      return
    }
  }
  submitting.value = true
  try {
    await voteType.methodCall('abstain', { poll: poll.value.pk })
    votingComplete.value = true
    validVote.value = undefined // Forget vote
  } catch (e) {
    openAlertEvent.emit(
      '^Critical error. Your abstain vote was not accepted! Try again, or contact a meeting offical!'
    )
  }
  submitting.value = false
}

async function deletePoll() {
  if (!canDelete.value || !poll.value) return
  if (
    !(await dialogQuery({
      title: t('poll.confirmDeleteQuery'),
      theme: ThemeColor.Warning
    }))
  )
    return
  await pollType.api.delete(poll.value.pk)
  router.push({
    name: 'polls',
    params: { id: meetingId.value }
  })
}

const menuItems = computed<MenuItem[]>(() => {
  if (!canDelete.value) return []
  return [
    {
      title: t('content.delete'),
      prependIcon: 'mdi-delete',
      color: ThemeColor.Warning,
      onClick: deletePoll
    }
  ]
})

const buttons = computed(() => {
  const btns: { props: object; title: string }[] = [
    {
      props: {
        color: ThemeColor.Primary,
        to: getMeetingRoute('polls'),
        prependIcon: 'mdi-chevron-double-left'
      },
      title: t('poll.all')
    }
  ]
  if (votingComplete.value && canVote.value) {
    btns.push({
      props: {
        color: ThemeColor.Secondary,
        onClick: () => {
          votingComplete.value = false
        },
        prependIcon: 'mdi-vote'
      },
      title: t('poll.viewAndChangeVote')
    })
  }
  if (nextUnvoted.value) {
    btns.push({
      props: {
        color: ThemeColor.Primary,
        to: getMeetingRoute('poll', {
          pid: nextUnvoted.value.pk,
          pslug: slugify(nextUnvoted.value.title)
        }),
        prependIcon: 'mdi-star'
      },
      title: t('poll.nextUnvoted', { ...nextUnvoted.value })
    })
  }
  return btns
})

const erPreliminary = computed(() => poll.value?.state === PollState.Upcoming)
</script>

<style lang="sass">
header .header-tag
  margin-right: 1em
  font-size: 9pt
  font-weight: 500
  text-transform: uppercase
  letter-spacing: .03em
  padding: 0 .6em
  color: rgb(var(--v-theme-warning))
  border: 2px solid rgba(var(--v-theme-warning), .6)
  border-radius: 4px
  white-space: nowrap

#poll-results
  .proposals
    display: flex
    margin: -10px
    flex-flow: wrap
    > *
      margin: 10px
      flex: 0 1 calc(50% - 20px)
</style>
