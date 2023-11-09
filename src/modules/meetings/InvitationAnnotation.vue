<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import restApi from '@/utils/restApi'
import { meetingInviteAnnotationPlugins } from './registry'
import useMeeting from './useMeeting'
import { MeetingInvite } from './types'
import { invitationScopes } from '../organisations/registry'

const { t } = useI18n()
const { meetingId } = useMeeting()

type Annotation = { name: string }

const props = defineProps<{ invite: MeetingInvite }>()
const annotations = ref<Annotation[] | null>(null)
const error = ref(false)

async function fetchAnnotations() {
  error.value = false
  try {
    const { data } = await restApi.get<{ annotations: Annotation[] }>(
      `meeting-invites/${props.invite.pk}/`
    )
    annotations.value = data.annotations
  } catch {
    error.value = true
  }
}

onMounted(fetchAnnotations)

const annotationList = computed(() => {
  if (!annotations.value) return
  return annotations.value.map((annotation) => {
    const translator = meetingInviteAnnotationPlugins
      .getPlugin(annotation.name)
      ?.getTranslator?.(t, meetingId)
    return translator ? translator(annotation) : { title: t('unknown') }
  })
})

const inviteData = computed(() => {
  return Object.entries(props.invite.user_data).map(([type, data]) => {
    const scopePlugin = invitationScopes.getPlugin(type)!
    return {
      prependIcon: scopePlugin.icon,
      title: scopePlugin.transformData?.(data) ?? data
    }
  })
})
</script>

<template>
  <v-list>
    <v-list-item v-for="(props, i) in inviteData" :key="i" v-bind="props" />
  </v-list>
  <div v-if="error" class="my-3 text-center">
    <p class="test-warning mb-3">Something went wrong</p>
    <v-btn
      @click="fetchAnnotations"
      prepend-icon="mdi-reload"
      size="large"
      variant="tonal"
    >
      Try again
    </v-btn>
  </div>
  <v-list v-else-if="annotationList">
    <v-list-subheader>
      {{ t('invites.annotate.annotatedData') }}
    </v-list-subheader>
    <v-list-item v-for="(props, i) in annotationList" :key="i" v-bind="props" />
  </v-list>
  <div v-else class="my-3 text-center">
    <v-progress-circular indeterminate color="primary" />
  </div>
</template>
