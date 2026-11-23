<script setup lang="ts">
import { dialogAlert } from '@/utils'

import useRequiredComponent from './useRequiredComponent'

const props = defineProps<{ componentName: string; switchLabel: string }>()

const {
  component,
  componentActive,
  isBlocked,
  isRequired,
  warnRequired,
  addComponent,
  setComponentState
} = useRequiredComponent(props.componentName)

async function setActive(state: boolean) {
  try {
    if (!component.value) await addComponent(null, state)
    else await setComponentState(state)
  } catch (e) {
    console.error('Failed to set component state', e)
    dialogAlert(`Failed to set ${props.componentName}: ${state}`)
  }
}
</script>

<template>
  <v-card-text v-if="isBlocked">
    <em>
      {{ $t('meeting.componentBlocked') }}
    </em>
  </v-card-text>
  <v-card-text v-else>
    <slot></slot>
    <v-switch
      v-if="!isBlocked"
      color="primary"
      hide-details
      :label="switchLabel"
      :model-value="componentActive"
      @update:model-value="setActive(!!$event)"
    />
    <div v-if="isRequired" class="mt-2">
      <v-chip>
        <v-icon
          :color="warnRequired ? 'warning' : 'secondary'"
          :icon="warnRequired ? 'mdi-alert' : 'mdi-information'"
          class="mr-2"
        />
        {{ $t('meeting.componentRequired') }}
      </v-chip>
    </div>
  </v-card-text>
  <v-card-actions v-if="$slots.actions && componentActive">
    <slot name="actions"></slot>
  </v-card-actions>
</template>
