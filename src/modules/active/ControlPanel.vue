<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { minTime } from '@/utils'
import { parseRestError } from '@/utils/restApi'
import DefaultDialog from '@/components/DefaultDialog.vue'
import useRules from '@/composables/useRules'

import ComponentQuickPanel from '../meetings/ComponentQuickPanel.vue'
import useMeetingId from '../meetings/useMeetingId'
import { activeUserType } from './contentTypes'

const { t } = useI18n()
const meetingId = useMeetingId()
const rules = useRules(t)

const hours = ref(1)
const working = ref(false)
const purgedCount = ref<number | null>(null)
const error = ref<{ hours?: string[]; __root__?: string[] } | null>(null)

async function purgeInactive() {
  error.value = null
  purgedCount.value = null
  working.value = true
  try {
    const { data } = await minTime(
      activeUserType.api.action<{ count: number }>('purge', meetingId.value, {
        hours: hours.value
      })
    )
    purgedCount.value = data.count
  } catch (e) {
    error.value = parseRestError(e)
  } finally {
    working.value = false
  }
}
</script>

<template>
  <ComponentQuickPanel
    component-name="active_users"
    :switch-label="$t('activeUsers.enable')"
  >
    <template #actions>
      <DefaultDialog
        @close="purgedCount = null"
        :title="$t('activeUsers.purgeInactive')"
      >
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="flat"
            color="secondary"
            prepend-icon="mdi-account-clock"
            size="small"
            :text="$t('activeUsers.purgeInactive')"
          />
        </template>
        <p class="mb-2">
          {{ $t('activeUsers.purgeInactiveHelp') }}
        </p>
        <v-form @submit.prevent="purgeInactive" v-slot="{ isValid }">
          <div class="d-flex mb-2">
            <v-text-field
              hide-details
              :label="$t('activeUsers.inactiveHours')"
              :rules="[rules.required, rules.min(0), rules.max(72)]"
              min="0"
              max="72"
              type="number"
              v-model="hours"
            />
            <v-btn
              class="rounded-s-0 h-auto"
              color="primary"
              :disabled="!isValid.value"
              :loading="working"
              :text="$t('clear')"
              type="submit"
            />
          </div>
          <v-messages
            :active="!!error?.hours"
            color="error"
            :messages="error?.hours"
          />
        </v-form>
        <v-alert
          v-if="error?.__root__"
          type="error"
          :text="error.__root__.join(' ')"
        />
        <v-alert
          v-else-if="purgedCount !== null"
          :text="$t('activeUsers.purgedCount', purgedCount)"
        />
      </DefaultDialog>
    </template>
    {{ $t('activeUsers.description') }}
  </ComponentQuickPanel>
</template>
