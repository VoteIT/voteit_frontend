<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'
import useMeetingId from '../meetings/useMeetingId'

import useActive from './useActive'
import UserActiveDialog from './UserActiveDialog.vue'
import { ThemeColor } from '@/utils/types'

const { t } = useI18n()
const { isActive, dismiss } = useActive(useMeetingId())

async function confirmSetActive(value: boolean | null) {
  if (!value) {
    if (
      await dialogQuery({
        title: t('activeUsers.confirmDismiss'),
        theme: ThemeColor.Warning
      })
    )
      dismiss()
    else return
  }
  isActive.value = value || false // ts says value could be null?
}
</script>

<template>
  <div class="mx-3 d-flex align-center">
    <p class="flex-grow-1 text-truncate">
      <strong>
        {{ isActive ? $t('activeUsers.active') : $t('activeUsers.inactive') }}
      </strong>
    </p>
    <v-switch
      :modelValue="isActive"
      @update:modelValue="confirmSetActive"
      hide-details
      color="surface"
      class="flex-grow-0"
    >
      <template #label>
        <v-icon
          icon="mdi-account-network"
          :color="isActive ? undefined : 'secondary'"
        />
      </template>
    </v-switch>
    <UserActiveDialog />
  </div>
</template>

<style lang="sass" scoped>
.v-icon
  transition: color 1s
</style>
