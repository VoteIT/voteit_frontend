<template>
  <main id="join-meeting" v-if="meeting">
    <p><RouterLink to="/">{{ t('home.home') }}</RouterLink></p>
    <h1>{{ t('join.meeting', meeting) }}</h1>
    <Richtext :object="meeting" />
    <p/>
    <div class="btn-controls" v-if="policyComponents.length">
      <component v-for="(c, i) in policyComponents" :is="c" :key="i" />
    </div>
    <p v-else>
      <em>{{ t('join.noAccess') }}</em>
    </p>
  </main>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'

import useLoader from '@/composables/useLoader'
import useMeeting from '@/composables/meeting/useMeeting'

import Richtext from '@/components/widgets/Richtext.vue'
import accessPolicyType from '@/contentTypes/accessPolicy'
import { AccessPolicy, MeetingAccessPolicy } from '@/contentTypes/types'
import accessPolicies from '@/components/meeting/accessPolicies'

export default defineComponent({
  components: { Richtext },
  name: 'JoinMeeting',
  inject: ['t'],
  setup () {
    const { meeting, meetingId, meetingApi, setMeeting } = useMeeting()
    const loader = useLoader('JoinMeeting')
    const router = useRouter()
    const policyApi = accessPolicyType.getContentApi()
    const policies = ref<AccessPolicy[]>([])

    const policyComponents = computed(() => {
      return policies.value.map(ap => accessPolicies[ap.name])
    })

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
      policyComponents
    }
  }
})
</script>

<style lang="sass">
#join-meeting
  text-align: center
</style>
