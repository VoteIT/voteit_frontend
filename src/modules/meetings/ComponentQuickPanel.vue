<template>
  <v-card-text v-if="isBlocked">
    <em>
      {{ t('meeting.componentBlocked') }}
    </em>
  </v-card-text>
  <v-card-text v-else>
    <slot></slot>
    <v-switch
      v-if="!isBlocked"
      color="primary"
      hide-details
      :label="switchLabel"
      v-model="active"
    />
    <div v-if="isRequired" class="mt-2">
      <v-chip>
        <v-icon
          :color="warnRequired ? 'warning' : 'secondary'"
          :icon="warnRequired ? 'mdi-alert' : 'mdi-information'"
          class="mr-2"
        />
        {{ t('meeting.componentRequired') }}
      </v-chip>
    </div>
  </v-card-text>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import useMeeting from './useMeeting'
import useComponentApi from './useComponentApi'
import { isActiveMeeting } from './rules'
import type { NoSettingsComponent } from './types'

const props = defineProps<{ componentName: string, switchLabel: string }>()

const { t } = useI18n()

const { meeting, meetingId } = useMeeting()
const isBlocked = computed(() => meeting.value?.dialect?.block_components?.includes(props.componentName))
const isRequired = computed(() => isActiveMeeting(meeting.value) && (meeting.value?.dialect?.configure_components || []).some(({ name }) => name === props.componentName))
const warnRequired = computed(() => !active.value && isRequired.value)
const { component, addComponent, setComponentState } = useComponentApi<NoSettingsComponent<string>>(meetingId, props.componentName)

const active = computed({
  get () {
    return component.value?.state === 'on'
  },
  set (value) {
    if (!component.value) return addComponent(null, true)
    // TODO error handling here
    setComponentState(component.value, value)
  }
})
</script>
