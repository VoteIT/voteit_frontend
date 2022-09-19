<template>
  <div>
    <p class="mb-1">
      {{ t('accessPolicies.automatic.joinDescription') }}
    </p>
    <div class="mb-4">
      <v-chip
        v-for="role in policy.roles_given"
        :key="role"
      >
        {{ t(`role.${role}`) }}
      </v-chip>
    </div>
    <div class="text-right">
      <v-btn color="primary" :loading="submitting" :disabled="submitting" prepend-icon="mdi-door-open" @click="joinNow()">{{ t('join.now') }}</v-btn>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import useAlert from '@/composables/useAlert'
import type { AccessPolicy } from '@/contentTypes/types'

import useMeeting from '../useMeeting'
import { automaticAccessType } from './contentTypes'

const props = defineProps({
  policy: {
    type: Object as PropType<AccessPolicy>,
    required: true
  }
})

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
</script>
