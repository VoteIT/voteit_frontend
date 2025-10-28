<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'

import { cols } from '@/utils/defaults'
import AppBar from '@/components/AppBar.vue'
import UserMenu from '@/components/UserMenu.vue'
import useLoader from '@/composables/useLoader'
import QueryDialog from '@/components/QueryDialog.vue'
import { AccessPolicy } from '@/contentTypes/types'
import useAuthStore from '../auth/useAuthStore'
import useOrgStore from '../organisations/useOrgStore'

import accessPolicies from './accessPolicies'
import { accessPolicyType, meetingType } from './contentTypes'
import { MeetingRole } from './types'
import useMeeting from './useMeeting'
import useMeetings from './useMeetings'
import { canBecomeModerator } from './rules'

const authStore = useAuthStore()
const { meetingId, meetingRoute } = useMeeting()
const orgStore = useOrgStore()
const loader = useLoader('JoinMeeting')
const { meetings } = useMeetings(loader.call)
const router = useRouter()
const policies = ref<AccessPolicy[]>([])

const policyComponents = computed(() => {
  return policies.value
    .filter((ap) => ap.active)
    .map((policy) => ({
      component: accessPolicies[policy.name],
      policy
    }))
})

const meeting = computed(() => meetings.get(meetingId.value))
const canBecomeModeratorMeeting = computed(
  () => meeting.value && canBecomeModerator()
)

async function joinAsModerator() {
  if (!authStore.user) throw new Error('Anonymous tried to join as moderator')
  await meetingType.addRoles(
    meetingId.value,
    authStore.user.pk,
    MeetingRole.Moderator
  )
  router.push(meetingRoute.value)
}

onBeforeMount(() => {
  loader.call(async () => {
    const { data } = await accessPolicyType.api.retrieve(meetingId.value)
    policies.value = data.policies
  })
})
</script>

<template>
  <AppBar />
  <UserMenu />
  <v-main>
    <v-container>
      <v-row id="join-meeting" v-if="meeting">
        <v-col v-bind="cols.default">
          <h1 class="mb-4">{{ $t('join.meetingTitle', { ...meeting }) }}</h1>
          <div
            class="d-flex flex-column ga-4"
            v-if="policyComponents.length || canBecomeModeratorMeeting"
          >
            <v-alert
              v-if="canBecomeModeratorMeeting"
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
          </div>
          <p v-else>
            <em>{{ $t('join.noAccess') }}</em>
          </p>
        </v-col>
      </v-row>
      <v-row v-else-if="!authStore.isAuthenticated">
        <v-col v-bind="cols.default">
          <v-alert
            :title="$t('join.loginRequired')"
            :text="$t('join.loginDescription')"
          >
            <div v-if="orgStore.loginURL" class="mt-2 text-right">
              <v-btn
                color="primary"
                :disabled="!orgStore.canLogin"
                :href="orgStore.loginURL"
                prepend-icon="mdi-login"
                :text="$t('organization.loginTo', { ...orgStore.organisation })"
              />
            </div>
          </v-alert>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>
