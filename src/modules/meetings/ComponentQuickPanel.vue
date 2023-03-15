<template>
  <v-card-text>
    <slot></slot>
    <v-switch
      :label="switchLabel"
      color="primary"
      hide-details
      v-model="active"
    />
    <div v-if="componentRequired" class="mt-2">
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

const props = defineProps({
  componentName: {
    type: String,
    required: true
  },
  switchLabel: {
    type: String,
    required: true
  }
})

const { t } = useI18n()

const { meeting, meetingId } = useMeeting()
const componentRequired = computed(() => isActiveMeeting(meeting.value) && (meeting.value?.dialect?.configure_components || []).some(({ name }) => name === props.componentName))
const warnRequired = computed(() => !active.value && componentRequired.value)
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
