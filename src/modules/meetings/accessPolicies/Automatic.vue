<template>
  <v-btn color="primary" :loading="submitting" :disabled="submitting" prepend-icon="mdi-door-open" @click="joinNow()">{{ t('join.now') }}</v-btn>
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from 'vue'
import useAlert from '@/composables/useAlert'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import type { AccessPolicy } from '@/contentTypes/types'

import useMeeting from '../useMeeting'
import { automaticAccessType } from './contentTypes'

export default defineComponent({
  props: {
    policy: {
      type: Object as PropType<AccessPolicy>,
      required: true
    }
  },
  setup (props) {
    const { t } = useI18n()
    const { alert } = useAlert()
    const router = useRouter()
    const { meetingPath } = useMeeting()
    const submitting = ref(false)

    async function joinNow () {
      submitting.value = true
      try {
        await automaticAccessType.api.action(props.policy.pk, 'join')
        router.push(meetingPath.value)
      } catch {
        alert('^Could not join meeting')
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
