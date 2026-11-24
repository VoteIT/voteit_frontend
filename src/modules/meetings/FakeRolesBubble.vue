<script setup lang="ts">
import BubbleHeader from './BubbleHeader.vue'
import useMeetingId from './useMeetingId'
import { setFakeRoles } from './rules'

defineProps<{ modelValue?: boolean }>()
defineEmits(['update:modelValue'])

const meetingId = useMeetingId()
</script>

<template>
  <BubbleHeader
    icon="mdi-account-hard-hat"
    :title="$t('admin.testMode')"
    :subtitle="$t('admin.testModeActive')"
  />
  <v-btn
    block
    color="primary"
    class="mt-4"
    :text="$t('reset')"
    @click="setFakeRoles(meetingId)"
  />
</template>
