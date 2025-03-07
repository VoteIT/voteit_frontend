<template>
  <div>
    <p class="mb-1">
      {{ $t('accessPolicies.automatic.joinDescription') }}
    </p>
    <div class="mb-4 d-flex ga-1">
      <v-chip v-for="role in policy.roles_given" :key="role">
        {{ meetingType.getRole(role).translateName($t) }}
      </v-chip>
    </div>
    <div class="text-right">
      <v-btn
        color="primary"
        :disabled="submitting"
        :loading="submitting"
        prepend-icon="mdi-door-open"
        :text="$t('join.now')"
        @click="joinNow"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import useAlert from '@/composables/useAlert'
import type { AccessPolicy } from '@/contentTypes/types'

import useMeeting from '../useMeeting'
import { automaticAccessType } from './contentTypes'
import { meetingType } from '../contentTypes'

const props = defineProps<{ policy: AccessPolicy }>()

const { alert } = useAlert()
const router = useRouter()
const { meetingRoute } = useMeeting()
const submitting = ref(false)

async function joinNow() {
  submitting.value = true
  try {
    await automaticAccessType.api.action(props.policy.pk, 'join')
    router.push(meetingRoute.value)
  } catch {
    alert('^Could not join meeting')
  }
  submitting.value = false
}
</script>
