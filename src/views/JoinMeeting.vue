<template>
  <main id="join-meeting">
    <p><RouterLink to="/">{{ t('home.home') }}</RouterLink></p>
    <h1>{{ t('join.meeting', meeting) }}</h1>
    <Richtext :object="meeting" />
    <p/>
    <div class="btn-controls" v-if="policies.length">
      <Btn v-if="hasActive('automatic')" :disabled="working" icon="meeting_room" @click="joinNow()">{{ t('join.now') }}</Btn>
    </div>
  </main>
</template>

<script lang="ts">
import { defineComponent, onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'

import useLoader from '@/composables/useLoader'
import useMeeting from '@/composables/meeting/useMeeting'

import Richtext from '@/components/widgets/Richtext.vue'
import accessPolicyType from '@/contentTypes/accessPolicy'
import { AccessPolicy, MeetingAccessPolicy } from '@/contentTypes/types'

export default defineComponent({
  components: { Richtext },
  name: 'JoinMeeting',
  inject: ['t'],
  setup () {
    const { meeting, meetingId, meetingPath, meetingApi, setMeeting } = useMeeting()
    const loader = useLoader('JoinMeeting')
    const router = useRouter()
    const policyApi = accessPolicyType.getContentApi()
    const policies = ref<AccessPolicy[]>([])
    const working = ref(false)

    function joinNow () {
      working.value = true
      policyApi.action(meetingId.value, 'join')
        .then(() => {
          router.push(meetingPath.value)
        })
        .finally(() => {
          working.value = false
        })
    }

    function hasActive (name: string): boolean {
      return !!policies.value.filter(
        policy => policy.name === name && policy.active
      )
    }

    onBeforeMount(() => {
      loader.call(() => {
        meetingApi.retrieve(meetingId.value)
          .then(({ data }) => {
            setMeeting(data)
          })
          .catch(() => {
            router.push('/')
          })
      })
      loader.call(() => {
        policyApi.retrieve(meetingId.value)
          .then(({ data }: { data: MeetingAccessPolicy }) => {
            policies.value = data.policies
          })
      })
    })

    return {
      meeting,
      policies,
      joinNow,
      working,
      hasActive
    }
  }
})
</script>

<style lang="sass">
#join-meeting
  text-align: center
</style>
