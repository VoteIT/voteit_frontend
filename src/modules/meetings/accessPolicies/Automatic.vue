<template>
  <v-btn color="primary" :disabled="submitting" prepend-icon="mdi-door-open" @click="joinNow()">{{ t('join.now') }}</v-btn>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import useMeeting from '../useMeeting'
import { accessPolicyType } from '../contentTypes'

export default defineComponent({
  setup () {
    const { t } = useI18n()
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
      t,
      submitting,
      joinNow
    }
  }
})
</script>
