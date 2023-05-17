<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { MeetingInvite } from './types'
import { Dictionary } from 'lodash'
import restApi from '@/utils/restApi'

type Annotations = Dictionary<number>

const props = defineProps<{ invite: MeetingInvite }>()
const annotations = ref<Annotations | null>(null)
const error = ref(false)

async function fetchAnnotations () {
  error.value = false
  try {
    const { data } = await restApi.get<{ annotations: Annotations }>(`meeting-invites/${props.invite.pk}/`)
    annotations.value = data.annotations
  } catch {
    error.value = true
  }
}

onMounted(fetchAnnotations)
</script>

<template>
  <div v-if="error" class="my-3 text-center">
    <p class="test-warning mb-3">
      Something went wrong
    </p>
    <v-btn @click="fetchAnnotations" prepend-icon="mdi-reload" size="large" variant="tonal">
      Try again
    </v-btn>
  </div>
  <div v-else-if="annotations" class="text-pre">
    {{ annotations }}
  </div>
  <div v-else class="my-3 text-center">
    <v-progress-circular indeterminate color="primary" />
  </div>
</template>
