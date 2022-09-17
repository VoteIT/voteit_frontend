<template>
  <v-card-text>
    {{ t('reaction.buttonCount', meetingButtons.length) }}
  </v-card-text>
  <v-card-actions>
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
import { computed, inject, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import { user } from '@/composables/useAuthentication'
import UserList from '@/components/UserList.vue'

import { meetingIdKey } from '../meetings/injectionKeys'

import RealReactionButton from './RealReactionButton.vue'
import useReactions from './useReactions'

const { t } = useI18n()

const reactions = useReactions()
const meetingId = inject(meetingIdKey)
if (!meetingId) throw new Error('Meeting context required for Reaction Buttons')

const meetingButtons = computed(() => reactions.getMeetingButtons(meetingId.value))
const model = reactive<Record<number, boolean>>({})
</script>
