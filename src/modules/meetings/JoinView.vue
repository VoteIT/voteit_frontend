<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { useRouter } from 'vue-router'

import { cols } from '@/utils/defaults'
import AppBar from '@/components/AppBar.vue'
import UserMenu from '@/components/UserMenu.vue'
import useErrorHandler from '@/composables/useErrorHandler'
import usePermission from '@/composables/usePermission'
import { isApiError } from '@/utils/restApi'
import QueryDialog from '@/components/QueryDialog.vue'
import { AccessPolicy } from '@/contentTypes/types'
import LoginButton from '../auth/LoginButton.vue'
import useAuthStore from '../auth/useAuthStore'
import InviteCard from '../meetingInvites/InviteCard.vue'
import usePolledInvites from '../meetingInvites/usePolledInvites'

import accessPolicies from './accessPolicies'
import { accessPolicyType, meetingType } from './contentTypes'
import { MeetingRole } from './types'
import useMeeting from './useMeeting'
import useMeetings from './useMeetings'
import useMeetingStore from './useMeetingStore'
import { canBecomeModerator } from './rules'

const { handled } = useErrorHandler({ target: 'dialog' })
const authStore = useAuthStore()
const { meetingId, meetingRoute } = useMeeting()
const { getMeeting } = useMeetingStore()
useMeetings()
const router = useRouter()
const policies = shallowRef<AccessPolicy[]>([])
const policiesState = shallowRef<
  'loading' | 'loaded' | 'notFound' | 'failed'
>('loading')
const { invitesLoaded, matchedInvites } = usePolledInvites()

const invites = computed(() =>
  matchedInvites.value.filter((inv) => inv.meeting === meetingId.value)
)

/**
 * The server won't show us the meeting, and we have no other way in.
 * An invitation, or managing the organisation, is a way in even to a meeting
 * we can't see yet.
 */
const denied = computed(
  () =>
    policiesState.value === 'notFound' &&
    invitesLoaded.value &&
    !invites.value.length &&
    !canBecomeModerator()
)
usePermission(computed(() => (denied.value ? false : undefined)))

const policyComponents = computed(() => {
  // When invited, the invitation is the way into the meeting
  if (invites.value.length) return []
  return policies.value
    .filter((ap) => ap.active)
    .map((policy) => ({
      component: accessPolicies[policy.name],
      policy
    }))
})

const meeting = computed(() => getMeeting(meetingId.value))
const meetingTitle = computed(
  () => meeting.value?.title ?? invites.value[0]?.meeting_title
)

async function joinAsModerator() {
  if (!authStore.user) throw new Error('Anonymous tried to join as moderator')
  const { pk } = authStore.user
  await handled(async () => {
    await meetingType.addRoles(meetingId.value, pk, MeetingRole.Moderator)
    router.push(meetingRoute.value)
  }, 'roles')
}

async function fetchPolicies() {
  policiesState.value = 'loading'
  try {
    const data = await accessPolicyType.api.retrieve(meetingId.value)
    policies.value = data.policies
    policiesState.value = 'loaded'
  } catch (e) {
    if (isApiError(e) && e.status === 404) {
      policies.value = []
      policiesState.value = 'notFound'
      return
    }
    console.warn(e)
    policiesState.value = 'failed'
  }
}

// Requires login
watch(
  () => [authStore.user?.pk, meetingId.value],
  ([userPk]) => {
    if (userPk) fetchPolicies()
  },
  { immediate: true }
)

const loading = computed(
  () =>
    !invitesLoaded.value ||
    policiesState.value === 'loading' ||
    // Permission handler sends the user home; nothing to do until then
    denied.value
)
const noAccess = computed(
  () =>
    policiesState.value === 'loaded' &&
    !invites.value.length &&
    !policyComponents.value.length &&
    !canBecomeModerator()
)
</script>

<template>
  <AppBar />
  <UserMenu />
  <v-main>
    <v-container>
      <v-row id="join-meeting" v-if="authStore.isAuthenticated">
        <v-col v-bind="cols.default">
          <h1 v-if="meetingTitle" class="mb-4">
            {{ $t('join.meetingTitle', { title: meetingTitle }) }}
          </h1>
          <v-progress-linear v-if="loading" indeterminate />
          <div v-else class="d-flex flex-column ga-4">
            <InviteCard v-for="inv in invites" :key="inv.pk" :invite="inv" />
            <v-alert
              v-if="canBecomeModerator()"
              color="warning"
              icon="mdi-gavel"
              :text="$t('join.asModeratorDescription')"
              :title="$t('join.asModerator')"
            >
              <template #append>
                <QueryDialog
                  color="warning"
                  :text="$t('join.asModeratorQuery')"
                  @confirmed="joinAsModerator"
                >
                  <template #activator="{ props }">
                    <v-btn :text="$t('join.asModerator')" v-bind="props" />
                  </template>
                </QueryDialog>
              </template>
            </v-alert>
            <component
              v-for="{ component, policy } in policyComponents"
              :is="component"
              :key="policy.name"
              :policy="policy"
            />
            <v-alert
              v-if="policiesState === 'failed'"
              :text="$t('join.policiesFailed')"
              type="error"
            >
              <template #append>
                <v-btn
                  class="retry-policies"
                  prepend-icon="mdi-reload"
                  :text="$t('tryAgain')"
                  variant="tonal"
                  @click="fetchPolicies"
                />
              </template>
            </v-alert>
            <p v-if="noAccess">
              <em>{{ $t('join.noAccess') }}</em>
            </p>
          </div>
        </v-col>
      </v-row>
      <v-row v-else>
        <v-col v-bind="cols.default">
          <v-alert
            :title="$t('join.loginRequired')"
            :text="$t('join.loginDescription')"
          >
            <div class="mt-2 d-flex justify-end">
              <LoginButton />
            </div>
          </v-alert>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>
