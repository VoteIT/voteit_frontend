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
      </v-btn-toggle>
    </div>
    <v-expand-transition>
      <v-sheet v-if="baseSetting" border rounded class="pa-4 d-print-none">
        <h3>
          {{ t('minutes.includeProposalStates') }}
        </h3>
        <CheckboxMultipleSelect
          v-model="settings.showStates"
          :settings="{ options }"
        />
        <h3 class="mb-1">
          {{ t('minutes.proposalOrder') }}
        </h3>
        <v-btn-toggle
          mandatory
          variant="outlined"
          v-model="settings.proposalOrder"
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
          v-model="settings.showAuthors"
          :label="t('minutes.showAuthors')"
        />
        <v-switch
          color="primary"
          hide-details
          v-model="settings.showSeparators"
          :label="t('minutes.showSeparators')"
        />
        <!-- <v-switch
          color="primary"
          hide-details
          v-model="settings.showMeetingBody"
          :label="t('minutes.showMeetingBody')"
        /> -->
        <v-switch
          color="primary"
          hide-details
          v-model="settings.showAgendaBody"
          :label="t('minutes.showAIBody')"
        />
        <div class="text-right">
          <v-btn
            size="large"
            value="minutes"
            prepend-icon="mdi-printer"
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
            v-if="baseSetting === 'minutes' && hasUnresolved"
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
            <h4>
              {{ t('proposal.proposal') }} <Tag disabled :name="p.prop_id" />
              <template v-if="settings.showAuthors">
                {{ ' ' + t('by') }}
                <span v-if="p.meeting_group">
                  {{ getMeetingGroup(p.meeting_group)?.title }}
                </span>
                <User v-else-if="p.author" :pk="p.author" />
              </template>
            </h4>
            <div class="proposal-text-paragraph" v-html="getProposalBody(p)" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { WorkflowState } from '@/contentTypes/types'
import User from '@/components/User.vue'
import CheckboxMultipleSelect from '@/components/inputs/CheckboxMultipleSelect.vue'

import useAgenda from '../agendas/useAgenda'
import useUserDetails from '../organisations/useUserDetails'
import { proposalType } from '../proposals/contentTypes'
import { Proposal, ProposalState } from '../proposals/types'
import useProposals from '../proposals/useProposals'
import { proposalStates } from '../proposals/workflowStates'

import useMeeting from './useMeeting'
import { orderBy } from 'lodash'
import useMeetingTitle from './useMeetingTitle'
import useMeetingGroups from './useMeetingGroups'
import Tag from '@/components/Tag.vue'

const UNRESOLVED_STATES = Object.freeze([
  ProposalState.Published,
  ProposalState.Voting
])

const PROPOSAL_STATE_ORDER = Object.freeze([
  ProposalState.Approved,
  ProposalState.Denied,
  ProposalState.Voting,
  ProposalState.Published,
  ProposalState.Unhandled,
  ProposalState.Retracted
])

const PROPOSAL_ORDERING = {
  created: ['created'],
  modified: ['modified', 'created']
}

const SETTING_DEFAULTS = Object.freeze({
  documents: {
    proposalOrder: 'created',
    showAgendaBody: true,
    showMeetingBody: true,
    showStates: [...PROPOSAL_STATE_ORDER]
  },
  minutes: {
    proposalOrder: 'modified',
    showAgendaBody: false,
    showMeetingBody: false,
    showStates: [ProposalState.Approved, ProposalState.Denied]
  }
})

const { getState: getProposalState } = proposalType.useWorkflows()

export default defineComponent({
  components: {
    CheckboxMultipleSelect,
    User,
    Tag
  },
  setup() {
    const { t } = useI18n()
    const { meetingId, isFinishedMeeting, meeting } = useMeeting()
    const { agenda } = useAgenda(meetingId)
    const { getUser } = useUserDetails()
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
      showSeparators: true,
      showStates: [] as ProposalState[]
    })
    watch(baseSetting, (type) => {
      // If baseSetting changes, all settings should be reset to those defaults
      if (type) Object.assign(settings, SETTING_DEFAULTS[type])
    })

    const options = Object.fromEntries(
      PROPOSAL_STATE_ORDER.map((state) => [
        state,
        getProposalState(state)!.getName(t)
      ])
    )

    const annotatedAgenda = computed(() => {
      return agenda.value.map(({ pk, title }) => {
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
          // hasProposals: prposalStates.some(({ proposals }) => proposals.length),
          // body,
          hasUnresolved: proposalStates.some(
            ({ state, proposals }) =>
              UNRESOLVED_STATES.includes(state) && proposals.length
          ),
          pk,
          proposalStates: proposalStates.filter(
            ({ state, proposals }) =>
              settings.showStates.includes(state) && proposals.length
          ),
          title
        }
      })
    })

    const orderedProposalStates = computed(() => {
      return PROPOSAL_STATE_ORDER.map((s) =>
        proposalStates.find(({ state }) => s === state)
      ) as WorkflowState[]
    })

    function getProposalBody(p: Proposal) {
      if (p.shortname === 'proposal') return p.body
      return p.body_diff_brief
    }

    function setDefaults(type: keyof typeof SETTING_DEFAULTS) {
      Object.assign(settings, SETTING_DEFAULTS[type])
    }

    return {
      t,
      annotatedAgenda,
      baseSetting,
      isFinishedMeeting,
      meeting,
      orderedProposalStates,
      options,
      settings,
      getProposalBody,
      getMeetingGroup,
      getUser,
      setDefaults
    }
  }
})
</script>
