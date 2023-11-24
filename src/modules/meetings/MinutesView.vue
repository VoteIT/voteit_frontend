<script setup lang="ts">
import { orderBy } from 'lodash'
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import User from '@/components/User.vue'
import CheckboxMultipleSelect from '@/components/inputs/CheckboxMultipleSelect.vue'
import Tag from '@/components/Tag.vue'

import useAgenda from '../agendas/useAgenda'
import { AgendaState } from '../agendas/types'
import { agendaItemType } from '../agendas/contentTypes'
import { proposalType } from '../proposals/contentTypes'
import { Proposal, ProposalState, isDiffProposal } from '../proposals/types'
import useProposals from '../proposals/useProposals'
import { PROPOSAL_STATE_ORDER } from '../proposals/constants'
import { isUnresolvedState } from '../proposals/utils'

import useMeeting from './useMeeting'
import useMeetingTitle from './useMeetingTitle'
import useMeetingGroups from './useMeetingGroups'

const PROPOSAL_ORDERING = {
  created: ['created'],
  modified: ['modified', 'created']
}

const AGENDA_STATE_ODER = [
  AgendaState.Upcoming,
  AgendaState.Ongoing,
  AgendaState.Closed,
  AgendaState.Archived
]

const SETTING_DEFAULTS = {
  documents: {
    proposalOrder: 'created',
    showAgendaBody: true,
    showMeetingBody: true,
    showUnresolvedWarning: false,
    proposalStates: [...PROPOSAL_STATE_ORDER],
    agendaStates: [...AGENDA_STATE_ODER],
    unresolvedStates: 'all'
  },
  minutes: {
    proposalOrder: 'modified',
    showAgendaBody: false,
    showMeetingBody: false,
    showUnresolvedWarning: true,
    proposalStates: [ProposalState.Approved, ProposalState.Denied],
    agendaStates: [...AGENDA_STATE_ODER],
    unresolvedStates: 'all'
  },
  remaining: {
    proposalOrder: 'created',
    showAgendaBody: false,
    showMeetingBody: false,
    showUnresolvedWarning: false,
    proposalStates: [ProposalState.Published, ProposalState.Voting],
    agendaStates: [AgendaState.Upcoming, AgendaState.Ongoing],
    unresolvedStates: true
  }
} as const

const { getState: getProposalState } = proposalType.useWorkflows()
const { getState: getAgendaState } = agendaItemType.useWorkflows()

const { t } = useI18n()
const { meetingId, isFinishedMeeting, meeting } = useMeeting()
const { agenda } = useAgenda(meetingId)
const { getMeetingGroup } = useMeetingGroups(meetingId)
const { getAgendaProposals } = useProposals()

const baseSetting = ref<keyof typeof SETTING_DEFAULTS | null>(null)
useMeetingTitle(
  computed(() =>
    baseSetting.value === 'minutes'
      ? t('minutes.minutes')
      : t('minutes.documents')
  )
)

const settings = reactive({
  proposalOrder: 'created' as keyof typeof PROPOSAL_ORDERING,
  showAgendaBody: false,
  showAuthors: true,
  showMeetingBody: false,
  showProposalTag: true,
  showSeparators: true,
  showUnresolvedWarning: false,
  proposalStates: [] as ProposalState[],
  agendaStates: [] as AgendaState[],
  unresolvedStates: 'all' as 'all' | boolean
})
watch(baseSetting, (type) => {
  // If baseSetting changes, all settings should be reset to those defaults
  if (type) Object.assign(settings, SETTING_DEFAULTS[type])
})

const proposalStateSettings = {
  options: Object.fromEntries(
    PROPOSAL_STATE_ORDER.map((state) => [
      state,
      getProposalState(state)!.getName(t, 2) // Go plural
    ])
  )
}

const agendaStateSettings = {
  options: Object.fromEntries(
    AGENDA_STATE_ODER.map((state) => [
      state,
      getAgendaState(state)!.getName(t, 2) // Go plural
    ])
  )
}

function unresolvedAIFilter(ai: {
  hasUnresolved: boolean
  state: AgendaState
}) {
  if (!settings.agendaStates.includes(ai.state)) return false
  if (settings.unresolvedStates === 'all') return true
  return ai.hasUnresolved === settings.unresolvedStates
}

const annotatedAgenda = computed(() => {
  return agenda.value
    .map(({ pk, state, title }) => {
      const proposalStates = PROPOSAL_STATE_ORDER.map((state) => {
        const proposals = orderBy(
          getAgendaProposals(pk, (p) => p.state === state),
          PROPOSAL_ORDERING[settings.proposalOrder]
        )
        return {
          state,
          title: getProposalState(state)?.getName(t, proposals.length),
          proposals
        }
      })
      return {
        // hasProposals: proposalStates.some(({ proposals }) => proposals.length),
        // body,
        hasUnresolved: proposalStates.some(
          ({ state, proposals }) => isUnresolvedState(state) && proposals.length
        ),
        pk,
        proposalStates: proposalStates.filter(
          ({ state, proposals }) =>
            settings.proposalStates.includes(state) && proposals.length
        ),
        state,
        title
      }
    })
    .filter(unresolvedAIFilter)
})

function getProposalBody(p: Proposal) {
  return isDiffProposal(p) ? p.body_diff_brief : p.body
}
</script>

<template>
  <div>
    <div class="text-center d-print-none">
      <v-btn-toggle
        mandatory
        variant="outlined"
        v-model="baseSetting"
        class="mb-1"
      >
        <v-btn size="large" value="documents" prepend-icon="mdi-file-document">
          {{ t('minutes.documents') }}
        </v-btn>
        <v-btn size="large" value="minutes" prepend-icon="mdi-file-sign">
          {{ t('minutes.minutes') }}
        </v-btn>
        <v-btn size="large" value="remaining" prepend-icon="mdi-file-clock">
          {{ t('minutes.remaining') }}
        </v-btn>
      </v-btn-toggle>
    </div>
    <v-expand-transition>
      <v-sheet
        v-if="baseSetting"
        :border="true"
        rounded
        class="pa-4 d-print-none"
      >
        <h3>
          {{ t('minutes.includeAgendaStates') }}
        </h3>
        <CheckboxMultipleSelect
          v-model="settings.agendaStates"
          :settings="agendaStateSettings"
        />
        <h3 class="mb-1">
          {{ t('minutes.unresolvedProposals') }}
        </h3>
        <v-btn-toggle
          mandatory
          variant="outlined"
          v-model="settings.unresolvedStates"
          class="mb-4"
        >
          <v-btn value="all" prepend-icon="mdi-asterisk">
            {{ t('all') }}
          </v-btn>
          <v-btn :value="true" prepend-icon="mdi-alert">
            {{ t('minutes.unresolved') }}
          </v-btn>
          <v-btn :value="false" prepend-icon="mdi-check-all">
            {{ t('minutes.noUnresolved') }}
          </v-btn>
        </v-btn-toggle>
        <h3>
          {{ t('minutes.includeProposalStates') }}
        </h3>
        <CheckboxMultipleSelect
          v-model="settings.proposalStates"
          :settings="proposalStateSettings"
        />
        <h3 class="mb-1">
          {{ t('minutes.proposalOrder') }}
        </h3>
        <v-btn-toggle
          mandatory
          variant="outlined"
          v-model="settings.proposalOrder"
          class="mb-4"
        >
          <v-btn value="created" prepend-icon="mdi-sort">
            {{ t('created') }}
          </v-btn>
          <v-btn value="modified" prepend-icon="mdi-sort">
            {{ t('modified') }}
          </v-btn>
        </v-btn-toggle>
        <v-switch
          color="primary"
          hide-details
          v-model="settings.showProposalTag"
          :label="t('minutes.showProposalTag')"
        />
        <v-switch
          color="primary"
          hide-details
          v-model="settings.showAuthors"
          :label="t('minutes.showAuthors')"
        />
        <v-switch
          color="primary"
          hide-details
          v-model="settings.showSeparators"
          :label="t('minutes.showSeparators')"
        />
        <v-switch
          color="primary"
          hide-details
          v-model="settings.showMeetingBody"
          :label="t('minutes.showMeetingBody')"
        />
        <v-switch
          color="primary"
          hide-details
          v-model="settings.showUnresolvedWarning"
          :label="t('minutes.showUnresolvedWarning')"
        />
        <!-- <v-switch
          color="primary"
          hide-details
          v-model="settings.showAgendaBody"
          :label="t('minutes.showAIBody')"
        /> -->
        <div class="text-right">
          <v-btn
            color="primary"
            prepend-icon="mdi-printer"
            size="large"
            value="minutes"
            variant="flat"
            onclick="window.print()"
          >
            {{ t('minutes.print') }}
          </v-btn>
        </div>
      </v-sheet>
    </v-expand-transition>
    <template v-if="baseSetting">
      <v-alert
        v-if="baseSetting === 'minutes' && !isFinishedMeeting"
        type="warning"
        class="my-2"
        :text="t('minutes.warningMeetingNotFinished')"
      />
      <template v-if="meeting">
        <h1 class="mt-8">
          {{ meeting.title }}
        </h1>
        <p
          v-if="settings.showMeetingBody && meeting.body"
          v-html="meeting.body"
        ></p>
      </template>
      <div
        v-for="{ hasUnresolved, pk, proposalStates, title } in annotatedAgenda"
        :key="pk"
      >
        <v-divider v-if="settings.showSeparators" class="my-4" />
        <div class="my-2 d-flex align-center">
          <h2 class="flex-grow-0">
            {{ title }}
          </h2>
          <v-tooltip
            v-if="settings.showUnresolvedWarning && hasUnresolved"
            location="bottom"
            :text="t('minutes.warningAIUnresolved')"
          >
            <template #activator="{ props }">
              <v-icon v-bind="props" color="warning" size="large" class="ml-2">
                mdi-alert
              </v-icon>
            </template>
          </v-tooltip>
        </div>
        <!-- <p v-if="settings.showAgendaBody && body" v-html="body" class="my-4" /> -->
        <p v-if="!proposalStates.length">
          <em>
            {{ t('minutes.noInformation') }}
          </em>
        </p>
        <div v-for="{ proposals, state, title } in proposalStates" :key="state">
          <h3>
            {{ title }}
          </h3>
          <div v-for="p in proposals" :key="p.pk" class="my-3">
            <i18n-t
              v-if="settings.showAuthors"
              keypath="minutes.proposalMetaAuthor"
              tag="h4"
            >
              <template #tag v-if="settings.showProposalTag"
                ><Tag disabled :name="p.prop_id"
              /></template>
              <template v-if="p.meeting_group" #author>
                {{ getMeetingGroup(p.meeting_group)?.title }}
              </template>
              <template v-else-if="p.author" #author>
                <User :pk="p.author" />
              </template>
            </i18n-t>
            <i18n-t v-else keypath="minutes.proposalMeta" tag="h4">
              <template #tag><Tag disabled :name="p.prop_id" /></template>
            </i18n-t>
            <div class="proposal-text-paragraph" v-html="getProposalBody(p)" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
