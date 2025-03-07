<script setup lang="ts">
import { computed } from 'vue'

import { dialogDefaults } from '@/utils/defaults'
import { ThemeColor } from '@/utils/types'
import QueryDialog from '@/components/QueryDialog.vue'

import useMeetingId from '../meetings/useMeetingId'

import useActive from './useActive'

const meetingId = useMeetingId()
const { componentActive, isActive, isBusy, isDismissed, dismiss, setActive } =
  useActive(meetingId)

const dialogActive = computed(
  () =>
    isBusy.value ||
    (componentActive.value && !isActive.value && !isDismissed.value)
)

async function dialogSetActive() {
  try {
    await setActive(true)
  } catch {
    alert('Unknown error: Could not set active status')
  }
}
</script>

<template>
  <v-dialog v-model="dialogActive" v-bind="dialogDefaults" persistent>
    <v-sheet class="pa-4">
      <div class="d-flex mb-2">
        <h2 class="flex-grow-1 text-truncate">
          {{ $t('activeUsers.dialogTitle') }}
        </h2>
        <v-icon icon="mdi-account-network" size="x-large" />
      </div>
      <p class="my-2">
        <strong>
          {{ $t('activeUsers.dialogDescription') }}
        </strong>
      </p>
      <p class="my-2">
        {{ $t('activeUsers.dialogInformation') }}
      </p>
      <div class="text-right mt-4">
        <QueryDialog
          @confirmed="dismiss"
          :color="ThemeColor.Warning"
          :text="$t('activeUsers.confirmDismiss')"
        >
          <template #activator="{ props }">
            <v-btn
              prepend-icon="mdi-close"
              variant="tonal"
              class="mr-2"
              v-bind="props"
            >
              {{ $t('close') }}
            </v-btn>
          </template>
        </QueryDialog>
        <v-btn
          prepend-icon="mdi-check"
          color="primary"
          :loading="isBusy"
          @click="dialogSetActive"
        >
          {{ $t('activeUsers.yesImActive') }}
        </v-btn>
      </div>
    </v-sheet>
  </v-dialog>
</template>
