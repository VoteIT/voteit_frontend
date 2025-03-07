<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppBar from '@/components/AppBar.vue'
import UserMenu from '@/components/UserMenu.vue'
import useLoader from '@/composables/useLoader'
import QueryDialog from '@/components/QueryDialog.vue'
import useAuthentication, { user } from '@/composables/useAuthentication'
import useDefaults from '@/composables/useDefaults'
import { AccessPolicy } from '@/contentTypes/types'
import useOrganisation from '../organisations/useOrganisation'

import accessPolicies from './accessPolicies'
import { accessPolicyType, meetingType } from './contentTypes'
import { MeetingRole } from './types'
import useMeeting from './useMeeting'
import useMeetings from './useMeetings'
import { canBecomeModerator } from './rules'

const { isAuthenticated } = useAuthentication()
const { meetingId, meetingRoute } = useMeeting()
const { canLogin, idLoginURL, organisation } = useOrganisation()
const loader = useLoader('JoinMeeting')
const { meetings } = useMeetings(loader.call)
const router = useRouter()
const policies = ref<AccessPolicy[]>([])
const { cols } = useDefaults()

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
  if (!user.value) throw new Error('Anonymous tried to join as moderator')
  await meetingType.addRoles(
    meetingId.value,
    user.value.pk,
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
          <h1>{{ $t('join.meetingTitle', { ...meeting }) }}</h1>
          <div class="btn-controls" v-if="canBecomeModeratorMeeting">
            <QueryDialog
              :confirm-text="$t('join.asModeratorDescription')"
              @confirmed="joinAsModerator"
            >
              <template #activator="{ props }">
                <v-btn
                  color="warning"
                  prepend-icon="mdi-gavel"
                  :text="$t('join.asModerator')"
                />
              </template>
            </QueryDialog>
          </div>
          <div class="btn-controls" v-else-if="policyComponents.length">
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
      <v-row v-else-if="!isAuthenticated">
        <v-col v-bind="cols.default">
          <header class="mb-6">
            <h1 class="mb-1">{{ $t('join.loginRequired') }}</h1>
            <p>{{ $t('join.loginDescription') }}</p>
          </header>
          <v-btn
            v-if="idLoginURL"
            block
            color="primary"
            :disabled="!canLogin"
            :href="idLoginURL"
            prepend-icon="mdi-login"
            :text="$t('organization.loginTo', { ...organisation })"
          />
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>
