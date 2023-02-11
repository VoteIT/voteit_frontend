<template>
  <div>
    <h1 class="text-truncate">
      {{ t('activeUsers.title') }}
    </h1>
    <p class="my-2">
      {{ t('activeUsers.listDescription') }}
    </p>
    <UserList v-if="activeUserIds.length" :user-ids="activeUserIds" class="my-3" />
    <v-alert v-else type="info" class="my-3">
      {{ t('activeUsers.listEmpty') }}
    </v-alert>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

import UserList from '@/components/UserList.vue'
import useMeeting from '../meetings/useMeeting'

import useActive from './useActive'

const { t } = useI18n()

const { meetingId } = useMeeting()
const { activeUserIds } = useActive(meetingId)
</script>
