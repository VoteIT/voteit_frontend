<template>
  <v-card-text>
    {{ t('reaction.buttonCount', meetingButtons.length) }}
  </v-card-text>
  <v-card-actions v-if="meetingButtons.length">
    <RealReactionButton
      v-for="button in meetingButtons"
      :key="button.pk"
      :button="button"
      class="mr-1"
      :count="Number(!!model[button.pk])"
      :disabled="!button.active"
      v-model="model[button.pk]"
    >
      <template #userList>
        <UserList v-if="user" :user-ids="[user.pk]" />
      </template>
    </RealReactionButton>
  </v-card-actions>
</template>

<script lang="ts" setup>
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import { user } from '@/composables/useAuthentication'
import UserList from '@/components/UserList.vue'

import useMeeting from '../meetings/useMeeting'

import RealReactionButton from './RealReactionButton.vue'
import useReactions from './useReactions'

const { t } = useI18n()

const reactions = useReactions()
const { meetingId } = useMeeting()

const meetingButtons = computed(() => reactions.getMeetingButtons(meetingId.value))
const model = reactive<Record<number, boolean>>({})
</script>
