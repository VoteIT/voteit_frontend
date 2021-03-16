<template>
  <Btn :disabled="submitting" icon="mdi-door-open" @click="joinNow()">{{ t('join.now') }}</Btn>
</template>

<script lang="ts">
import useMeeting from '@/composables/meeting/useMeeting'
import accessPolicy from '@/contentTypes/accessPolicy'
import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'

export default defineComponent({
  inject: ['t'],
  setup () {
    const router = useRouter()
    const { meetingId, meetingPath } = useMeeting()
    const submitting = ref(false)
    const policyApi = accessPolicy.getContentApi()

    function joinNow () {
      submitting.value = true
      policyApi.action(meetingId.value, 'join')
        .then(() => {
          router.push(meetingPath.value)
        })
        .finally(() => {
          submitting.value = false
        })
    }
    return {
      joinNow,
      submitting
    }
  }
})
</script>
