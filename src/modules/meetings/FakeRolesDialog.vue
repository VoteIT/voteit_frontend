<script setup lang="ts">
import { computed, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

import DefaultDialog from '@/components/DefaultDialog.vue'

import { hasMeetingRole, setFakeRoles } from './rules'
import { MeetingRole } from './types'
import useMeetingId from './useMeetingId'
import { DEFAULT_ROLE_ORDER } from './constants'
import { translateMeetingRole } from './utils'

const meetingId = useMeetingId()
const { t } = useI18n()

const isActualModerator = computed(() =>
  hasMeetingRole(meetingId.value, MeetingRole.Moderator, true)
)
function nonParticipantRole(role: MeetingRole) {
  return role !== MeetingRole.Participant
}

function setFakeRole(role: MeetingRole, value: boolean) {
  const currentRoles = DEFAULT_ROLE_ORDER.filter((r) =>
    hasMeetingRole(meetingId.value, r)
  )
  // Already correctly set
  if (currentRoles.includes(role) === value) return
  const newRoles = value
    ? [...currentRoles, role]
    : currentRoles.filter((r) => r !== role)
  setFakeRoles(meetingId.value, newRoles)
}

const fakeableRoles = computed(() =>
  DEFAULT_ROLE_ORDER.filter(nonParticipantRole).map((role) => ({
    setValue(value: boolean | null) {
      if (value === null) return
      setFakeRole(role, value)
    },
    title: translateMeetingRole(role, t),
    value: hasMeetingRole(meetingId.value, role)
  }))
)

// Clear fake roles when leaving meeting
onBeforeUnmount(() => setFakeRoles(meetingId.value))
</script>

<template>
  <DefaultDialog v-if="isActualModerator" :title="$t('admin.testMode')">
    <template #activator="{ props }">
      <v-list-item
        density="compact"
        prepend-icon="mdi-account-hard-hat"
        :title="$t('admin.testMode')"
        v-bind="props"
      />
    </template>
    <v-alert type="info" :text="$t('admin.testModeDescription')" class="mb-3" />
    <v-checkbox
      density="comfortable"
      hide-details
      v-for="{ setValue, title, value } in fakeableRoles"
      :label="title"
      :model-value="value"
      @update:model-value="setValue"
    />
  </DefaultDialog>
</template>
