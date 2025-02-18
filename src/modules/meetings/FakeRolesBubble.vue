<script setup lang="ts">
import useMeetingId from './useMeetingId'
import { setFakeRoles } from './rules'

const meetingId = useMeetingId()
</script>

<template>
  <div class="container">
    <h2>
      {{ $t('admin.testMode') }}
    </h2>
    <p class="mb-3">
      {{ $t('admin.testModeActive') }}
    </p>
    <v-btn @click="setFakeRoles(meetingId)" color="primary" block>
      {{ $t('reset') }}
    </v-btn>
  </div>
</template>

<style lang="sass" scoped>
.container
  max-width: 360px
</style>
