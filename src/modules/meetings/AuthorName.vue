<script setup lang="ts">
import { computed } from 'vue'
import useUserDetails from '../organisations/useUserDetails'

import { type Author, isGroupAuthor, isUserAuthor } from './types'
import useMeeting from './useMeeting'
import useMeetingGroups from './useMeetingGroups'
import { getFullName } from '@/utils'
import User from '@/components/User.vue'

const { getUser } = useUserDetails()
const { meetingId } = useMeeting()
const { getMeetingGroup } = useMeetingGroups(meetingId)

const props = defineProps<{
  author: Author
  prependText?: string
  icon?: boolean
}>()

const user = computed(() => getUser(props.author.author))
const fullName = computed(() => (user.value ? getFullName(user.value) : '-'))
const groupName = computed(() =>
  props.author.meeting_group
    ? getMeetingGroup(props.author.meeting_group)?.title ?? '-'
    : '-'
)
</script>

<template>
  <span v-if="isGroupAuthor(author)">
    <v-icon v-if="icon" size="small" class="mr-1" style="margin-top: -1px"
      >mdi-account-multiple</v-icon
    >
    {{ prependText }}
    {{ groupName }}
  </span>
  <span v-else-if="isUserAuthor(author)">
    {{ prependText }}
    <User :pk="author.author" userid />
  </span>
  <span v-else>
    {{ prependText }}
    {{ fullName }} <small>({{ groupName }})</small>
  </span>
</template>
