<template>
  <v-row id="join-meeting" v-if="meeting">
    <v-col>
      <h1>{{ t('join.meeting', meeting) }}</h1>
      <Richtext :object="meeting" class="mb-8" />
      <div class="btn-controls" v-if="canBecomeModerator" @click="joinAsModerator()">
        <v-btn color="warning" prepend-icon="mdi-gavel">
          {{ t('join.asModerator') }}
        </v-btn>
      </div>
      <div class="btn-controls" v-else-if="policyComponents.length">
        <component v-for="(c, i) in policyComponents" :is="c" :key="i" />
      </div>
      <p v-else>
        <em>{{ t('join.noAccess') }}</em>
      </p>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import useLoader from '@/composables/useLoader'
import { user } from '@/composables/useAuthentication'

import Richtext from '@/components/Richtext.vue'
import accessPolicies from '@/modules/meetings/accessPolicies'
import { accessPolicyType, meetingType } from '@/modules/meetings/contentTypes'
import { AccessPolicy } from '@/contentTypes/types'
import { dialogQuery } from '@/utils'
import { ThemeColor } from '@/utils/types'
import { MeetingRole } from './types'
import useMeeting from './useMeeting'
import useMeetings from './useMeetings'
import { canBecomeModeratorMeeting } from './rules'

export default defineComponent({
  components: { Richtext },
  name: 'JoinMeeting',
  setup () {
    const { t } = useI18n()
    const { meeting, meetingId, meetingPath } = useMeeting()
    const { fetchMeeting } = useMeetings()
    const loader = useLoader('JoinMeeting')
    const router = useRouter()
    const policies = ref<AccessPolicy[]>([])

    const policyComponents = computed(() => {
      return policies.value.map(ap => accessPolicies[ap.name])
    })

    const canBecomeModerator = computed(() => {
      return meeting.value && canBecomeModeratorMeeting(meeting.value)
    })

    async function joinAsModerator () {
      if (!user.value) return console.warn('Anonymous tried to join as moderator')
      if (await dialogQuery({
        title: t('join.asModeratorDescription'),
        theme: ThemeColor.Info
      })) {
        await meetingType.channel.addRoles(meetingId.value, user.value.pk, MeetingRole.Moderator)
        router.push(meetingPath.value)
      }
    }

    onBeforeMount(() => {
      loader.call(
        async () => {
          try {
            await fetchMeeting(meetingId.value)
          } catch {
            console.warn(`Failed fetching meeting ${meetingId.value}`)
            router.push('/')
          }
        },
        async () => {
          const { data } = await accessPolicyType.api.retrieve(meetingId.value)
          policies.value = data.policies
        }
      )
    })

    return {
      t,
      meeting,
      policies,
      policyComponents,
      canBecomeModerator,
      joinAsModerator
    }
  }
})
</script>
