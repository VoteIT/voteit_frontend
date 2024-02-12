<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import useMeeting from './useMeeting'
import { setFakeRoles } from './rules'

const { t } = useI18n()
const { meetingId } = useMeeting()
</script>

<template>
  <div class="container">
    <h2>
      {{ t('admin.testMode') }}
    </h2>
    <p class="mb-3">
      {{ t('admin.testModeActive') }}
    </p>
    <v-btn @click="setFakeRoles(meetingId)" color="primary" block>
      {{ t('reset') }}
    </v-btn>
  </div>
</template>

<style lang="sass" scoped>
.container
  max-width: 360px
</style>
