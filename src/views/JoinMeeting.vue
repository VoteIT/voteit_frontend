<template>
  <v-row id="join-meeting" v-if="meeting">
    <v-col>
      <h1>{{ t('join.meeting', meeting) }}</h1>
      <Richtext :object="meeting" />
      <p/>
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
import useMeeting from '@/composables/meeting/useMeeting'

import Richtext from '@/components/widgets/Richtext.vue'
import accessPolicies from '@/components/meeting/accessPolicies'
import accessPolicyType from '@/contentTypes/accessPolicy'
import meetingType from '@/contentTypes/meeting'
import organizationRules from '@/contentTypes/organization/rules'
import { AccessPolicy, MeetingRole } from '@/contentTypes/types'
import { dialogQuery } from '@/utils'
import { ThemeColor } from '@/utils/types'

export default defineComponent({
  components: { Richtext },
  name: 'JoinMeeting',
  setup () {
    const { t } = useI18n()
    const { meeting, meetingId, meetingPath, meetingApi, setMeeting } = useMeeting()
    const loader = useLoader('JoinMeeting')
    const router = useRouter()
    const policyApi = accessPolicyType.getContentApi()
    const policies = ref<AccessPolicy[]>([])

    const policyComponents = computed(() => {
      return policies.value.map(ap => accessPolicies[ap.name])
    })

    const canBecomeModerator = computed(() => {
      return meetingType.rules.canBecomeModerator(meeting.value)
    })

    async function joinAsModerator () {
      if (!user.value) return console.warn('Anonymous tried to join as moderator')
      if (await dialogQuery({
        title: t('join.asModeratorDescription'),
        theme: ThemeColor.Info
      })) {
        await meetingType.getChannel().addRoles(meetingId.value, user.value.pk, MeetingRole.Moderator)
        router.push(meetingPath.value)
      }
    }

    onBeforeMount(() => {
      loader.call(async () => {
        try {
          const { data } = await meetingApi.retrieve(meetingId.value)
          setMeeting(data)
        } catch {
          console.warn(`Failed fetching meeting ${meetingId.value}`)
          router.push('/')
        }
      })
      loader.call(async () => {
        const { data } = await policyApi.retrieve(meetingId.value)
        policies.value = data.policies
      })
    })

    return {
      t,
      joinAsModerator,
      meeting,
      policies,
      policyComponents,
      ...organizationRules,
      canBecomeModerator
    }
  }
})
</script>

<style lang="sass">
#join-meeting
  text-align: center
  .btn-controls
    justify-content: center
</style>
