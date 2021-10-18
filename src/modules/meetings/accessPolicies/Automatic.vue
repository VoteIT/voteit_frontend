<template>
  <v-btn color="primary" :disabled="submitting" prepend-icon="mdi-door-open" @click="joinNow()">{{ t('join.now') }}</v-btn>
</template>

<script lang="ts">
import useMeeting from '@/modules/meetings/useMeeting'
import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'
import { accessPolicyType } from '../contentTypes'

export default defineComponent({
  inject: ['t'],
  setup () {
    const router = useRouter()
    const { meetingId, meetingPath } = useMeeting()
    const submitting = ref(false)

    async function joinNow () {
      submitting.value = true
      try {
        await accessPolicyType.api.action(meetingId.value, 'join')
        router.push(meetingPath.value)
      } catch {
        // TODO
      }
      submitting.value = false
    }
    return {
      joinNow,
      submitting
    }
  }
})
</script>
