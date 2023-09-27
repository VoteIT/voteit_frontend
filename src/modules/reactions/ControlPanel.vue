<script lang="ts" setup>
import { computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'

import DefaultDialog from '@/components/DefaultDialog.vue'
import UserList from '@/components/UserList.vue'
import useAuthentication from '@/composables/useAuthentication'
import useMeeting from '../meetings/useMeeting'

import useReactions from './useReactions'
import ReactionEditModal from './ReactionEditModal.vue'
import FlagButtonEditModal from './FlagButtonEditModal.vue'
import { ReactionButton, isFlagButton } from './types'
import { reactionButtonType } from './contentTypes'
import RealReactionButton from './RealReactionButton.vue'
import FlagButton from './FlagButton.vue'

const { t } = useI18n()
const { user } = useAuthentication()
const { meetingId } = useMeeting()
const reactions = useReactions()

const meetingButtons = computed(() => reactions.getMeetingButtons(meetingId.value))

async function setContentType (button: ReactionButton, contentType: string, value: boolean) {
  const allowed_models = value
    ? [contentType, ...button.allowed_models]
    : button.allowed_models.filter(ct => ct !== contentType)
  await reactionButtonType.api.patch(button.pk, { allowed_models })
}

async function setActive (button: ReactionButton, active: boolean) {
  await reactionButtonType.api.patch(button.pk, { active })
}

const model = reactive<Record<number, boolean>>({})
</script>

<template>
  <div>
    <div class="d-flex mb-4">
      <h2>{{ t('reaction.settings') }}</h2>
      <v-spacer />
      <v-menu>
        <v-list>
          <DefaultDialog :title="t('reaction.addButton')" persistent>
            <template #activator="{ props }">
              <v-list-item v-bind="props" prepend-icon="mdi-gesture-tap-button">
                {{ t('reaction.button') }}
              </v-list-item>
            </template>
            <template #default="{ close }">
              <ReactionEditModal @close="close" />
            </template>
          </DefaultDialog>
          <DefaultDialog :title="t('reaction.addButton')" persistent>
            <template #activator="{ props }">
              <v-list-item v-bind="props" prepend-icon="mdi-flag">
                {{ t('reaction.flag') }}
              </v-list-item>
            </template>
            <template #default="{ close }">
              <FlagButtonEditModal @close="close" />
            </template>
          </DefaultDialog>
        </v-list>
        <template #activator="{ props }">
          <v-btn v-bind="props" append-icon="mdi-chevron-down" color="primary">
            {{ t('reaction.addButton') }}
          </v-btn>
        </template>
      </v-menu>
    </div>
    <v-table>
      <thead>
        <tr>
          <th>
            {{ t('reaction.buttons') }}
          </th>
          <th>
            {{ t('reaction.active') }}
          </th>
          <th>
            {{ t('proposal.proposals') }}
          </th>
          <th>
            {{ t('discussion.discussions') }}
          </th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="button in meetingButtons" :key="button.pk">
          <td>
            <FlagButton
              v-if="isFlagButton(button)"
              :button="button"
              :can-toggle="true"
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
                <UserList v-if="user" :userIds="[user.pk]" />
              </template>
            </RealReactionButton>
          </td>
          <td>
            <v-switch hide-details color="primary" :modelValue="button.active" @update:modelValue="setActive(button, $event!)" />
          </td>
          <td v-for="contentType in ['proposal', 'discussion_post']" :key="contentType">
            <v-switch hide-details color="primary" :modelValue="button.allowed_models.includes(contentType)" @update:modelValue="setContentType(button, contentType, $event!)" />
          </td>
          <td class="text-right">
            <DefaultDialog :title="t('reaction.editButton')" persistent>
              <template #activator="{ props }">
                <v-btn prepend-icon="mdi-pencil" size="small" color="primary" v-bind="props">
                  {{ t('edit') }}
                </v-btn>
              </template>
              <template #default="{ close }">
                <FlagButtonEditModal v-if="isFlagButton(button)" :data="button" @close="close" />
                <ReactionEditModal v-else :data="button" @close="close" />
              </template>
            </DefaultDialog>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>
