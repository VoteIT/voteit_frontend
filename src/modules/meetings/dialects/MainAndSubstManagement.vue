<template>
  1/{{ group.votes }}
</template>

<script lang="ts" setup>
import { PropType } from 'vue'
import { GroupMembership, MeetingGroup } from '../types'

defineProps({
  group: {
    type: Object as PropType<MeetingGroup & { memberships: GroupMembership[] }>,
    required: true
  }
})
</script>
