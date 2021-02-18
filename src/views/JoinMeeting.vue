<template>
  <main id="join-meeting">
    <p><router-link to="/">{{ t('home.home') }}</router-link></p>
    <h1>{{ t('join.meeting', meeting) }}</h1>
    <richtext :object="meeting" />
    <p/>
    <div class="btn-controls" v-if="policies.length">
      <btn v-if="policies.includes('automatic')" :disabled="working" icon="meeting_room" @click="joinNow()">{{ t('join.now') }}</btn>
    </div>
  </main>
</template>

<script>
import { onBeforeMount, ref } from 'vue'
import { useRouter } from 'vue-router'

import useLoader from '@/composables/useLoader'
import useMeeting from '@/composables/meeting/useMeeting'

import Richtext from '@/components/widgets/Richtext.vue'
import accessPolicyType from '@/contentTypes/accessPolicy'

export default {
  components: { Richtext },
  name: 'JoinMeeting',
  inject: ['t'],
  setup () {
    const { meeting, meetingId, meetingPath, meetingApi, setMeeting } = useMeeting()
    const loader = useLoader('JoinMeeting')
    const router = useRouter()
    const policyApi = accessPolicyType.useContentApi()
    const policies = ref([])
    const working = ref(false)

    function joinNow () {
      working.value = true
      policyApi.action(meetingId.value, 'join')
        .then(_ => {
          router.push(meetingPath.value)
        })
        .finally(_ => {
          working.value = false
        })
    }

    onBeforeMount(_ => {
      loader.call(_ => {
        meetingApi.retrieve(meetingId.value)
          .then(({ data }) => {
            setMeeting(data)
          })
          .catch(_ => {
            router.push('/')
          })
      })
      loader.call(_ => {
        policyApi.retrieve(meetingId.value)
          .then(({ data }) => {
            policies.value = data.policies
              .filter(p => p.active)
              .map(p => p.name)
          })
      })
    })

    return {
      meeting,
      policies,
      joinNow,
      working
    }
  }
}
</script>

<style lang="sass">
#join-meeting
  text-align: center
</style>
