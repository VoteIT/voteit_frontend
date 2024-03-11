<template>
  <ComponentQuickPanel
    component-name="active_users"
    :switch-label="t('activeUsers.enable')"
  >
    <template #actions>
      <DefaultDialog
        @close="purgedCount = null"
        :title="t('activeUsers.purgeInactive')"
      >
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            variant="flat"
            color="secondary"
            prepend-icon="mdi-account-clock"
            size="small"
          >
            {{ t('activeUsers.purgeInactive') }}
          </v-btn>
        </template>
        <p class="mb-2">
          {{ t('activeUsers.purgeInactiveHelp') }}
        </p>
        <v-form
          v-if="!working"
          class="d-flex mb-2"
          @submit.prevent="purgeInactive"
        >
          <v-text-field
            type="number"
            :rules="[rules.required, rules.min(0)]"
            v-model="hours"
            :label="t('activeUsers.inactiveHours')"
            min="0"
            hide-details
          />
          <v-btn
            type="submit"
            class="rounded-s-0"
            :disabled="working"
            color="primary"
          >
            {{ t('clear') }}
          </v-btn>
        </v-form>
        <div v-if="working" class="text-center py-11">
          <v-progress-circular indeterminate />
        </div>
        <v-alert v-else-if="purgedCount !== null">
          {{ t('activeUsers.purgedCount', purgedCount) }}
        </v-alert>
      </DefaultDialog>
    </template>
    {{ t('activeUsers.description') }}
  </ComponentQuickPanel>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import ComponentQuickPanel from '../meetings/ComponentQuickPanel.vue'
import DefaultDialog from '@/components/DefaultDialog.vue'

import useRules from '@/composables/useRules'
import useMeetingId from '../meetings/useMeetingId'
import { activeUserType } from './contentTypes'

const { t } = useI18n()
const meetingId = useMeetingId()
const rules = useRules(t)

const hours = ref(1)
const working = ref(false)
const purgedCount = ref<number | null>(null)

async function purgeInactive() {
  working.value = true
  const { p } = await activeUserType.methodCall<{ count: number }>('purge', {
    meeting: meetingId.value,
    hours: hours.value
  })
  purgedCount.value = p.count
  working.value = false
}
</script>

<style scoped lang="sass">
.v-form .v-btn
  height: auto
</style>
