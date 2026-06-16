<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

import { getApiLink } from '@/utils/restApi'
import useMeetingId from '../meetings/useMeetingId'
import useExportImport from './useExportImport'

const { t } = useI18n()
const { optionsFor, valuesFor, selectionModel } = useExportImport(t)

const clearOptions = optionsFor('clear')
const clearSelected = selectionModel('clear')
const includeOptions = optionsFor('include')
const includeSelected = selectionModel('include')

const meetingId = useMeetingId()

function download() {
  const params = new URLSearchParams()
  for (const [key, enabled] of Object.entries(valuesFor('include', 'clear'))) {
    params.set(key, String(enabled))
  }
  const url = getApiLink(`meeting-data/${meetingId.value}/yaml?${params}`)
  window.open(url, '_blank')
}
</script>

<template>
  <div>
    <header class="mb-6">
      <h2>
        {{ $t('exportImport.exportFromMeeting') }}
      </h2>
      <p>{{ $t('exportImport.exportFromMeetingDescription') }}</p>
    </header>
    <v-form @submit.prevent="download" v-slot="{ isValid }">
      <v-select
        v-model="includeSelected"
        :items="includeOptions"
        item-title="title"
        item-value="key"
        :label="$t('exportImport.options.includeLabel')"
        multiple
        chips
        closable-chips
      />
      <v-select
        v-model="clearSelected"
        :items="clearOptions"
        item-title="title"
        item-value="key"
        :label="$t('exportImport.options.clearLabel')"
        multiple
        chips
        closable-chips
      />
      <div class="text-right">
        <v-btn
          color="primary"
          :disabled="!isValid.value"
          prepend-icon="mdi-download"
          :text="$t('exportImport.exportFromMeeting')"
          type="submit"
        />
      </div>
    </v-form>
  </div>
</template>
