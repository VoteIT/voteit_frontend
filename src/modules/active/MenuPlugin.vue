<template>
  <div class="mx-3 d-flex align-center">
    <p class="flex-grow-1 text-truncate">
      <strong>
        {{ isActive ? t('activeUsers.active') : t('activeUsers.inactive') }}
      </strong>
    </p>
    <v-switch v-model="isActive" hide-details class="flex-grow-0">
      <template #label>
        <v-icon
          icon="mdi-account-network"
          :color="isActive ? undefined : 'secondary'"
        />
      </template>
    </v-switch>
    <v-dialog v-model="dialogActive" v-bind="dialogDefaults" persistent>
      <v-sheet class="pa-4">
        <div class="d-flex mb-2">
          <h2 class="flex-grow-1 text-truncate">
            {{ t('activeUsers.dialogTitle') }}
          </h2>
          <v-icon icon="mdi-account-network" size="x-large" />
        </div>
        <p class="my-2">
          <strong>
            {{ t('activeUsers.dialogDescription') }}
          </strong>
        </p>
        <p class="my-2">
          {{ t('activeUsers.dialogInformation') }}
        </p>
        <div class="text-right mt-4">
          <QueryDialog
            @confirmed="dialogActive = false"
            :text="t('activeUsers.confirmDismiss')"
          >
            <template #activator="{ props }">
              <v-btn
                prepend-icon="mdi-close"
                variant="tonal"
                class="mr-2"
                v-bind="props"
              >
                {{ t('close') }}
              </v-btn>
            </template>
          </QueryDialog>
          <v-btn
            prepend-icon="mdi-check"
            color="primary"
            :loading="working"
            @click="dialogSetActive"
          >
            {{ t('activeUsers.yesImActive') }}
          </v-btn>
        </div>
      </v-sheet>
    </v-dialog>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { sleep } from '@/utils'
import useDefaults from '@/composables/useDefaults'
import useMeeting from '../meetings/useMeeting'

import useActive from './useActive'
import QueryDialog from '@/components/QueryDialog.vue'

const { t } = useI18n()
const { dialogDefaults } = useDefaults()
const { meetingId } = useMeeting()

const { componentActive, isActive, setActive } = useActive(meetingId)

const reactedMeetings = reactive(new Set<number>())

const dialogActive = computed({
  get() {
    return (
      working.value ||
      (componentActive.value &&
        !isActive.value &&
        !reactedMeetings.has(meetingId.value))
    )
  },
  set(value) {
    if (value) reactedMeetings.delete(meetingId.value)
    else reactedMeetings.add(meetingId.value)
  }
})

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

// Disable dialog on any modification
watch(isActive, () => {
  dialogActive.value = false
})
</script>

<style lang="sass" scoped>
.v-icon
  transition: color 1s
</style>
