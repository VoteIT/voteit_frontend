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
import PostponeRemovalDialog from './PostponeRemovalDialog.vue'
import {
  PostponeKind,
  RemovalClassification,
  type MeetingInvolvement,
  type RemovalRequest
} from './types'
import useRemovalRequests from './useRemovalRequests'

const { t } = useI18n()
const authStore = useAuthStore()
const { requests, fetchRequests, removeUser, clearPostponed } =
  useRemovalRequests()

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

const postponeMeta: Record<
  PostponeKind,
  { color: ThemeColor; icon: string; translate: () => string }
> = {
  [PostponeKind.Remind]: {
    color: ThemeColor.Info,
    icon: 'mdi-bell-sleep',
    translate: () => t('organization.removalRequests.postpone.reminding')
  },
  [PostponeKind.Block]: {
    color: ThemeColor.Warning,
    icon: 'mdi-hand-back-left',
    translate: () => t('organization.removalRequests.postpone.blocked')
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

function isGone(e: unknown) {
  // Withdrawn or handled by someone else - the row is gone
  if (!isApiError(e) || e.status !== 404) return false
  dialogAlert(t('organization.removalRequests.gone'), ThemeColor.Info)
  return true
}

const clearing = shallowRef<number>()
async function clear(request: RemovalRequest) {
  clearing.value = request.user.pk
  try {
    await clearPostponed(request.user.pk)
  } catch (e) {
    if (!isGone(e))
      dialogAlert(t('organization.removalRequests.postpone.clearFailed'))
  }
  clearing.value = undefined
}

async function remove(request: RemovalRequest) {
  let result: Awaited<ReturnType<typeof removeUser>>
  try {
    result = await removeUser(request.user.pk)
  } catch (e) {
    // The row is gone, so is the dialog
    if (isGone(e)) return
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
        <v-alert
          v-if="request.postponed"
          class="mt-2"
          :color="postponeMeta[request.postponed.kind].color"
          density="compact"
          :icon="postponeMeta[request.postponed.kind].icon"
          variant="tonal"
        >
          <div class="d-flex align-center flex-wrap ga-2">
            <span class="flex-grow-1">
              {{ postponeMeta[request.postponed.kind].translate() }}
              <Moment
                :date="request.postponed.until"
                future
                ordinary
                :prepend="$t('organization.removalRequests.postpone.until')"
              />
            </span>
            <v-btn
              :loading="clearing === request.user.pk"
              size="small"
              :text="$t('organization.removalRequests.postpone.clear')"
              variant="text"
              @click="clear(request)"
            />
          </div>
        </v-alert>
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
        <PostponeRemovalDialog :request="request">
          <template #activator="{ props }">
            <v-btn
              prepend-icon="mdi-clock-outline"
              :text="
                request.postponed
                  ? $t('organization.removalRequests.postpone.change')
                  : $t('organization.removalRequests.postpone.button')
              "
              variant="text"
              v-bind="props"
            />
          </template>
        </PostponeRemovalDialog>
        <ConfirmPhraseDialog
          color="error"
          :confirm="() => remove(request)"
          :confirm-text="$t('organization.removalRequests.remove')"
          :phrase="getPhrase(request)"
          :title="$t('organization.removalRequests.remove')"
        >
          <v-alert
            v-if="request.postponed?.kind === PostponeKind.Block"
            class="mb-4"
            :text="$t('organization.removalRequests.postpone.blockedWarning')"
            type="warning"
          />
          <p>
            {{
              $t('organization.removalRequests.confirmText', {
                name: getDisplayName(request.user)
              })
            }}
          </p>
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
