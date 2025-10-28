<script lang="ts" setup>
import { computed, reactive } from 'vue'

import UserList from '@/components/UserList.vue'

import useAuthStore from '../auth/useAuthStore'
import useMeetingId from '../meetings/useMeetingId'

import RealReactionButton from './RealReactionButton.vue'
import useReactions from './useReactions'
import FlagButton from './FlagButton.vue'
import { isFlagButton } from './types'

const authStore = useAuthStore()
const { getMeetingButtons } = useReactions()
const meetingId = useMeetingId()

const meetingButtons = computed(() => getMeetingButtons(meetingId.value))
const model = reactive<Record<number, boolean>>({})
</script>

<template>
  <v-card-text>
    {{ $t('reaction.buttonCount', meetingButtons.length) }}
  </v-card-text>
  <v-card-actions v-if="meetingButtons.length" class="overflow-x-auto">
    <template v-for="button in meetingButtons" :key="button.pk">
      <FlagButton
        v-if="isFlagButton(button)"
        :button="button"
        can-toggle
        v-model="model[button.pk]"
      />
      <div v-else>
        <!-- Div is needed here, or btn disappears (vuetify issue) -->
        <RealReactionButton
          :button="button"
          :count="Number(!!model[button.pk])"
          :disabled="!button.active"
          v-model="model[button.pk]"
        >
          <template #userList>
            <UserList v-if="authStore.user" :user-ids="[authStore.user.pk]" />
          </template>
        </RealReactionButton>
      </div>
    </template>
  </v-card-actions>
</template>

<style lang="sass">
.v-card-actions .v-btn
  margin-inline-start: 0 !important
</style>
