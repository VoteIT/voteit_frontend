<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import { sleep } from '@/utils'
import { ThemeColor } from '@/utils/types'
import QueryDialog from '@/components/QueryDialog.vue'
import useDefaults from '@/composables/useDefaults'

import useMeetingId from '../meetings/useMeetingId'

import useActive from './useActive'

const { dialogDefaults } = useDefaults()
const meetingId = useMeetingId()
const { componentActive, isActive, isDismissed, dismiss, setActive } =
  useActive(meetingId)

const dialogActive = computed(
  () =>
    working.value ||
    (componentActive.value && !isActive.value && !isDismissed.value)
)

const working = ref(false)
async function dialogSetActive() {
  working.value = true
  try {
    await setActive(true)
    await sleep(1_000)
  } catch {
    alert('Unknown error: Could not set active status')
  }
  working.value = false
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
          :loading="working"
          @click="dialogSetActive"
        >
          {{ $t('activeUsers.yesImActive') }}
        </v-btn>
      </div>
    </v-sheet>
  </v-dialog>
</template>
