<template>
  <div v-if="hasAutomatic">
    <v-card-text>
      {{ t('accessPolicies.automatic.isActive') }}
    </v-card-text>
    <v-card-actions>
      <v-tooltip :model-value="copied" :text="t('copied')" :open-on-hover="false">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="elevated"
            prepend-icon="mdi-content-copy"
            :color="copied ? 'success' : 'primary'"
            @click="copy(meetingUrl)"
          >
            {{ t('meeting.copyUrl') }}
          </v-btn>
        </template>
      </v-tooltip>
    </v-card-actions>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useClipboard } from '@vueuse/core'

import { AccessPolicyType } from '@/contentTypes/types'

import useMeeting from '../useMeeting'

import useAccessPolicies from './useAccessPolicies'

const { t } = useI18n()
const { copy, copied } = useClipboard()
const { meetingId, meetingUrl } = useMeeting()
const { accessPolicies } = useAccessPolicies(meetingId)

const hasAutomatic = computed(() => accessPolicies.value.some(ap => ap.active && ap.name === AccessPolicyType.Automatic))
</script>
