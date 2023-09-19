<template>
  <v-row id="join-meeting" v-if="meeting">
    <v-col v-bind="cols.default">
      <h1>{{ t('join.meetingTitle', { ...meeting }) }}</h1>
      <Richtext :object="meeting" class="mb-8" />
      <div class="btn-controls" v-if="canBecomeModeratorMeeting" @click="joinAsModerator()">
        <v-btn color="warning" prepend-icon="mdi-gavel">
          {{ t('join.asModerator') }}
        </v-btn>
      </div>
      <div class="btn-controls" v-else-if="policyComponents.length">
        <component v-for="{ component, policy } in policyComponents" :is="component" :key="policy.name" :policy="policy" />
      </div>
      <p v-else>
        <em>{{ t('join.noAccess') }}</em>
      </p>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import useLoader from '@/composables/useLoader'
import { user } from '@/composables/useAuthentication'
import useDefaults from '@/composables/useDefaults'

import Richtext from '@/components/Richtext.vue'
import accessPolicies from '@/modules/meetings/accessPolicies'
import { accessPolicyType, meetingType } from '@/modules/meetings/contentTypes'
import { AccessPolicy } from '@/contentTypes/types'
import { dialogQuery } from '@/utils'
import { ThemeColor } from '@/utils/types'
import { MeetingRole } from './types'
import useMeeting from './useMeeting'
import useMeetings from './useMeetings'
import { canBecomeModerator } from './rules'

const { t } = useI18n()
const { meetingId, meetingPath } = useMeeting()
const loader = useLoader('JoinMeeting')
const { meetings } = useMeetings(loader.call)
const router = useRouter()
const policies = ref<AccessPolicy[]>([])
const { cols } = useDefaults()

const policyComponents = computed(() => {
  return policies.value
    .filter(ap => ap.active)
    .map(policy => ({
      component: accessPolicies[policy.name],
      policy
    }))
})

const meeting = computed(() => meetings.get(meetingId.value))
const canBecomeModeratorMeeting = computed(() => meeting.value && canBecomeModerator())

async function joinAsModerator () {
  if (!user.value) return console.warn('Anonymous tried to join as moderator')
  if (await dialogQuery({
    title: t('join.asModeratorDescription'),
    theme: ThemeColor.Info
  })) {
    await meetingType.addRoles(meetingId.value, user.value.pk, MeetingRole.Moderator)
    router.push(meetingPath.value)
  }
}

onBeforeMount(() => {
  loader.call(async () => {
    const { data } = await accessPolicyType.api.retrieve(meetingId.value)
    policies.value = data.policies
  })
})
</script>
