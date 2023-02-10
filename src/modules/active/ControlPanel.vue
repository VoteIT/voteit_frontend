<template>
  <v-card-text>
    {{ t('activeUsers.description') }}
  </v-card-text>
  <v-card-text>
    <v-switch
      :label="t('activeUsers.enable')"
      color="primary"
      hide-details
      v-model="active"
    />
  </v-card-text>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import useMeeting from '../meetings/useMeeting'
import useComponentApi from '../meetings/useComponentApi'
import type { NoSettingsComponent } from '../meetings/types'

const { t } = useI18n()
const { meetingId } = useMeeting()
const { component, addComponent, setComponentState } = useComponentApi<NoSettingsComponent<'active_users'>>(meetingId, 'active_users')

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
