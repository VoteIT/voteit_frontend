<script setup lang="ts">
import { shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogAlert, getDisplayName } from '@/utils'
import { isApiError } from '@/utils/restApi'
import { ThemeColor } from '@/utils/types'
import ConfirmPhraseDialog from '@/components/ConfirmPhraseDialog.vue'
import Moment from '@/components/Moment.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import useAuthStore from '@/modules/auth/useAuthStore'
import { meetingType } from '@/modules/meetings/contentTypes'

import { organisationType } from './contentTypes'
import {
  RemovalClassification,
  type MeetingInvolvement,
  type RemovalRequest
} from './types'
import useRemovalRequests from './useRemovalRequests'

const { t } = useI18n()
const authStore = useAuthStore()
const { requests, fetchRequests, removeUser } = useRemovalRequests()

const classificationMeta: Record<
  RemovalClassification,
  { color: ThemeColor; icon: string; translate: () => string }
> = {
  [RemovalClassification.NoActivity]: {
    color: ThemeColor.Success,
    icon: 'mdi-account-off-outline',
    translate: () =>
      t('organization.removalRequests.classification.no_activity')
  },
  [RemovalClassification.InactiveMeetings]: {
    color: ThemeColor.Info,
    icon: 'mdi-archive-outline',
    translate: () =>
      t('organization.removalRequests.classification.inactive_meetings')
  },
  [RemovalClassification.ActiveMeeting]: {
    color: ThemeColor.Warning,
    icon: 'mdi-calendar-account',
    translate: () =>
      t('organization.removalRequests.classification.active_meeting')
  },
  [RemovalClassification.OngoingPoll]: {
    color: ThemeColor.Error,
    icon: 'mdi-vote',
    translate: () =>
      t('organization.removalRequests.classification.ongoing_poll')
  },
  [RemovalClassification.OrganisationRoles]: {
    color: ThemeColor.Error,
    icon: 'mdi-account-key',
    translate: () =>
      t('organization.removalRequests.classification.organisation_roles')
  }
}

/**
 * Counters worth a chip when non-zero, in order of how much they matter.
 * Keys spelled out in full, so extractLocales can find them.
 */
const counters: {
  key: keyof Pick<
    MeetingInvolvement,
    | 'ongoing_polls'
    | 'votes'
    | 'vote_transfers'
    | 'proposals'
    | 'discussion_posts'
    | 'speaker_entries'
    | 'reactions'
  >
  icon: string
  translate: (count: number) => string
}[] = [
  {
    key: 'ongoing_polls',
    icon: 'mdi-vote',
    translate: (n) => t('organization.removalRequests.count.ongoing_polls', n)
  },
  {
    key: 'votes',
    icon: 'mdi-check-decagram',
    translate: (n) => t('organization.removalRequests.count.votes', n)
  },
  {
    key: 'vote_transfers',
    icon: 'mdi-swap-horizontal',
    translate: (n) => t('organization.removalRequests.count.vote_transfers', n)
  },
  {
    key: 'proposals',
    icon: 'mdi-text-box',
    translate: (n) => t('organization.removalRequests.count.proposals', n)
  },
  {
    key: 'discussion_posts',
    icon: 'mdi-comment',
    translate: (n) =>
      t('organization.removalRequests.count.discussion_posts', n)
  },
  {
    key: 'speaker_entries',
    icon: 'mdi-account-voice',
    translate: (n) => t('organization.removalRequests.count.speaker_entries', n)
  },
  {
    key: 'reactions',
    icon: 'mdi-thumb-up',
    translate: (n) => t('organization.removalRequests.count.reactions', n)
  }
]

function getCounts(meeting: MeetingInvolvement) {
  return counters
    .filter(({ key }) => meeting[key])
    .map(({ key, icon, translate }) => ({
      key,
      icon,
      text: translate(meeting[key])
    }))
}

function getMeetingState(meeting: MeetingInvolvement) {
  const state = meetingType.sm.getState(meeting.state)
  return { icon: state.icon, title: state.translate?.(t) ?? meeting.state }
}

function getMeetingRoles(meeting: MeetingInvolvement) {
  return meeting.roles
    .map((role) => meetingType.getRole(role)?.translateName(t) ?? role)
    .join(', ')
}

function getOrgRoles(request: RemovalRequest) {
  return request.organisation_roles
    .map((role) => organisationType.getRole(role)?.translateName(t) ?? role)
    .join(', ')
}

function isSelf(request: RemovalRequest) {
  return request.user.pk === authStore.user?.pk
}

function getPhrase(request: RemovalRequest) {
  return request.user.userid || t('auth.removal.confirmWord')
}

const refreshing = shallowRef(false)
async function refresh() {
  refreshing.value = true
  try {
    await fetchRequests()
  } catch {
    dialogAlert(t('organization.removalRequests.fetchFailed'))
  }
  refreshing.value = false
}

async function remove(request: RemovalRequest) {
  let result: Awaited<ReturnType<typeof removeUser>>
  try {
    result = await removeUser(request.user.pk)
  } catch (e) {
    // Withdrawn or handled by someone else - the row is gone, so is the dialog
    if (isApiError(e) && e.status === 404) {
      dialogAlert(t('organization.removalRequests.gone'), ThemeColor.Info)
      return
    }
    throw e // Shown in the confirm dialog
  }
  const name = getDisplayName(request.user)
  dialogAlert(
    result === 'deleted'
      ? t('organization.removalRequests.result.deleted', { name })
      : t('organization.removalRequests.result.anonymised', { name }),
    ThemeColor.Success
  )
}
</script>

<template>
  <div>
    <v-alert
      class="mb-4"
      type="info"
      :text="$t('organization.removalRequests.intro')"
    />
    <div class="d-flex justify-end mb-2">
      <v-btn
        :loading="refreshing"
        prepend-icon="mdi-autorenew"
        :text="$t('organization.removalRequests.refresh')"
        variant="text"
        @click="refresh"
      />
    </div>
    <div v-if="!requests" class="text-center my-6">
      <v-progress-circular indeterminate />
    </div>
    <p v-else-if="!requests.length" class="text-center text-secondary my-6">
      {{ $t('organization.removalRequests.empty') }}
    </p>
    <v-card
      v-for="request in requests"
      :key="request.user.pk"
      border
      class="mb-4"
      :title="getDisplayName(request.user)"
    >
      <template #prepend>
        <UserAvatar :user="request.user" />
      </template>
      <template #subtitle>
        <span v-if="request.user.email">{{ request.user.email }} · </span>
        <Moment
          :date="request.removal_requested"
          :prepend="$t('organization.removalRequests.requested')"
          ordinary
        />
      </template>
      <template #text>
        <v-alert
          :color="classificationMeta[request.classification].color"
          density="compact"
          :icon="classificationMeta[request.classification].icon"
          :text="classificationMeta[request.classification].translate()"
          variant="tonal"
        />
        <p v-if="request.organisation_roles.length" class="mt-3">
          <strong>{{ $t('organization.removalRequests.orgRoles') }}:</strong>
          {{ getOrgRoles(request) }}
        </p>
        <v-list v-if="request.meetings.length" density="compact" class="mt-2">
          <v-list-item
            v-for="meeting in request.meetings"
            :key="meeting.pk"
            :prepend-icon="getMeetingState(meeting).icon"
            :title="meeting.title"
          >
            <template #subtitle>
              {{ getMeetingState(meeting).title }}
              <template v-if="meeting.roles.length">
                · {{ getMeetingRoles(meeting) }}
              </template>
              <template v-if="meeting.groups.length">
                · {{ $t('organization.removalRequests.groups') }}:
                {{ meeting.groups.join(', ') }}
              </template>
              <template v-if="meeting.used_invite">
                · {{ $t('organization.removalRequests.usedInvite') }}
              </template>
            </template>
            <div class="d-flex flex-wrap ga-1 mt-1">
              <v-chip
                v-for="count in getCounts(meeting)"
                :key="count.key"
                :prepend-icon="count.icon"
                size="small"
                :text="count.text"
              />
            </div>
          </v-list-item>
        </v-list>
      </template>
      <template #actions>
        <span v-if="isSelf(request)" class="text-secondary text-body-2 ml-2">
          {{ $t('organization.removalRequests.cantRemoveSelf') }}
        </span>
        <span
          v-else-if="!request.can_remove"
          class="text-secondary text-body-2 ml-2"
        >
          <Moment
            :date="request.removable_after"
            future
            ordinary
            :prepend="$t('organization.removalRequests.removableAfter')"
          />
        </span>
        <v-spacer />
        <ConfirmPhraseDialog
          color="error"
          :confirm="() => remove(request)"
          :confirm-text="$t('organization.removalRequests.remove')"
          :phrase="getPhrase(request)"
          :text="
            $t('organization.removalRequests.confirmText', {
              name: getDisplayName(request.user)
            })
          "
          :title="$t('organization.removalRequests.remove')"
        >
          <template #activator="{ props }">
            <v-btn
              color="error"
              :disabled="!request.can_remove"
              prepend-icon="mdi-account-remove"
              :text="$t('organization.removalRequests.remove')"
              variant="tonal"
              v-bind="props"
            />
          </template>
        </ConfirmPhraseDialog>
      </template>
    </v-card>
  </div>
</template>
