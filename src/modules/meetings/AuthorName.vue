<script setup lang="ts">
import { computed } from 'vue'

import { type Author, isGroupAuthor, isUserAuthor } from './types'
import useMeeting from './useMeeting'
import { getMeetingGroup, isGroupMember } from './useMeetingGroups'
import User from '@/components/User.vue'
import useUserDetails from '../organisations/useUserDetails'
import { useI18n } from 'vue-i18n'
import { getFullName } from '@/utils'

const { t } = useI18n()
const { isModerator } = useMeeting()
const { getUser } = useUserDetails()

const props = defineProps<{
  author: Author
  prependText?: string
  icon?: boolean
}>()

const group = computed(() =>
  props.author.meeting_group
    ? getMeetingGroup(props.author.meeting_group)
    : undefined
)

const groupName = computed(() => group.value?.title ?? '-')

/**
 * Only available for moderators and same group members.
 */
const groupUserId = computed(() => {
  if (!props.author.as_group) return
  if (
    !isModerator.value ||
    !isGroupMember(props.author.meeting_group, props.author.author)
  )
    return
  const user = getUser(props.author.author)
  if (!user) return
  return t('postedBy', { name: `${getFullName(user)} (${user.userid})` })
})
</script>

<template>
  <v-overlay
    v-if="isGroupAuthor(author)"
    scroll-strategy="close"
    location-strategy="connected"
    location="top center"
    origin="auto"
    :scrim="false"
    :transition="false"
  >
    <template #activator="{ props }">
      <span v-bind="props">
        <v-icon v-if="icon" size="small" class="mr-1" style="margin-top: -1px"
          >mdi-account-multiple</v-icon
        >
        {{ prependText }}
        {{ groupName }}
      </span>
    </template>
    <v-card rounded="lg" class="mb-1" elevation="4">
      <v-card-item>
        <v-avatar
          color="secondary"
          icon="mdi-account-multiple"
          size="large"
          class="mt-1"
        />
        <v-card-title>
          {{ groupName }}
        </v-card-title>
        <v-card-subtitle v-if="groupUserId">
          {{ groupUserId }}
        </v-card-subtitle>
      </v-card-item>
    </v-card>
  </v-overlay>

  <span v-else-if="isUserAuthor(author)">
    {{ prependText }}
    <User :pk="author.author" />
  </span>
  <span v-else>
    {{ prependText }}
    <User :pk="author.author" /><br />
    <small class="text-secondary"
      ><v-icon icon="mdi-account-multiple" /> {{ groupName }}</small
    >
  </span>
</template>
