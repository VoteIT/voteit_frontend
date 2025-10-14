<script lang="ts" setup>
import { computed, reactive } from 'vue'

import { user } from '@/composables/useAuthentication'
import UserList from '@/components/UserList.vue'

import useMeetingId from '../meetings/useMeetingId'

import RealReactionButton from './RealReactionButton.vue'
import useReactions from './useReactions'
import FlagButton from './FlagButton.vue'
import { isFlagButton } from './types'

const reactions = useReactions()
const meetingId = useMeetingId()

const meetingButtons = computed(() =>
  reactions.getMeetingButtons(meetingId.value)
)
const model = reactive<Record<number, boolean>>({})
</script>

<template>
  <v-card-text>
    {{ $t('reaction.buttonCount', meetingButtons.length) }}
  </v-card-text>
  <v-card-actions v-if="meetingButtons.length">
    <template v-for="button in meetingButtons" :key="button.pk">
      <FlagButton
        v-if="isFlagButton(button)"
        :button="button"
        can-toggle
        v-model="model[button.pk]"
      />
      <RealReactionButton
        v-else
        :button="button"
        :count="Number(!!model[button.pk])"
        :disabled="!button.active"
        v-model="model[button.pk]"
      >
        <template #userList>
          <UserList v-if="user" :user-ids="[user.pk]" />
        </template>
      </RealReactionButton>
    </template>
  </v-card-actions>
</template>

<style lang="sass">
.v-card-actions .v-btn
  margin-inline-start: 0 !important
</style>
