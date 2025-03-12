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
    <v-btn
      block
      color="primary"
      :text="$t('reset')"
      @click="setFakeRoles(meetingId)"
    />
  </div>
</template>

<style lang="sass" scoped>
.container
  max-width: 360px
</style>
