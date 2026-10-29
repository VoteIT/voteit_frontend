<script setup lang="ts">
import { computed, ref } from 'vue'
import { useElementSize } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

import { slugify } from '@/utils'
import DefaultDialog from '@/components/DefaultDialog.vue'
import Moment from '@/components/Moment.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import WorkflowState from '@/components/WorkflowState.vue'

import useMeeting from '../meetings/useMeeting'
import usePollStore from '../polls/usePollStore'
import ProposalSheet from '../proposals/ProposalSheet.vue'

import { pollType } from './contentTypes'
import usePoll from './usePoll'
import { Poll } from './types'

const props = defineProps<{ poll: Poll }>()

const { t } = useI18n()

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

function* resultDialogGen() {
  if (!isFinished.value) return
  if (approved.value.length) {
    yield {
      key: 'approved',
      title: t('poll.numApproved', approved.value.length),
      proposals: approved.value,
      color: 'success'
    }
  }
  if (denied.value.length) {
    yield {
      key: 'denied',
      title: t('poll.numDenied', denied.value.length),
      proposals: denied.value,
      color: 'warning'
    }
  }
}

const resultDialogs = computed(() => [...resultDialogGen()])
</script>

<template>
  <v-card
    ref="rootEl"
    :style="{ '--columns': proposalColumns }"
    :to="pollRoute"
  >
    <template #title>
      {{ poll.title }}
      <small class="text-secondary ml-4">{{ pollMethodName }}</small>
    </template>
    <template #subtitle>
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
    </template>
    <template #append v-if="isModerator">
      <WorkflowState admin :object="poll" :contentType="pollType" right />
    </template>
    <template #text>
      <ProgressBar
        v-if="isFinished"
        :text="voteCount.text"
        :value="voteCount.voted"
        :total="voteCount.total"
      />
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
    </template>
    <template #actions v-if="resultDialogs.length">
      <template
        v-for="{ key, title, proposals, color } in resultDialogs"
        :key="key"
      >
        <DefaultDialog v-if="proposals.length" :title="title">
          <template #activator="{ props }">
            <!-- prevent: the card is a link, so keep the click from navigating -->
            <v-btn
              v-bind="props"
              :color="color"
              :text="title"
              variant="tonal"
              @click.prevent
              @mousedown.stop
            />
          </template>
          <div class="proposals ga-2">
            <ProposalSheet
              v-for="p in proposals"
              :key="p.pk"
              elevation="2"
              :proposal="p"
            />
          </div>
        </DefaultDialog>
      </template>
    </template>
  </v-card>
</template>

<style lang="sass" scoped>
.proposals
  display: grid
  grid-template-columns: repeat(var(--columns, 1), 1fr)
  &.full-width
    --columns: 1
</style>
