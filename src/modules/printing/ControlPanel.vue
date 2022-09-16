<template>
  <div>
    <v-switch
      :label="t('printing.enable')"
      color="primary"
      hide-details
      v-model="active"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { NoSettingsComponent } from '../meetings/types'

import useMeeting from '../meetings/useMeeting'
import useComponentApi from '../meetings/useComponentApi'

const { t } = useI18n()
const { meetingId } = useMeeting()
const { component, addComponent, setComponentState } = useComponentApi<NoSettingsComponent<'proposal_print'>>(meetingId, 'proposal_print')

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
