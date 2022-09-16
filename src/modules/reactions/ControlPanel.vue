<template>
  <div>
    <div class="d-flex mb-4">
      <h2>{{ t('reaction.settings') }}</h2>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-gesture-tap-button" @click="editReaction()">
        {{ t('reaction.addButton') }}
      </v-btn>
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
          <th />
        </tr>
      </thead>
      <tbody>
        <tr v-for="button in meetingButtons" :key="button.pk">
          <td>
            <v-btn :prepend-icon="button.icon" :color="button.color" size="small">
              {{ button.title }}
            </v-btn>
          </td>
          <td>
            <v-switch hide-details color="primary" :modelValue="button.active" @update:modelValue="setActive(button, $event)" />
          </td>
          <td v-for="contentType in ['proposal', 'discussion_post']" :key="contentType">
            <v-switch hide-details color="primary" :modelValue="button.allowed_models.includes(contentType)" @update:modelValue="setContentType(button, contentType, $event)" />
          </td>
          <td class="text-right">
            <v-btn prepend-icon="mdi-pencil" @click="editReaction(button)" size="small" color="primary">
              {{ t('edit') }}
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'

import { openModalEvent } from '@/utils/events'
import useMeeting from '@/modules/meetings/useMeeting'

import useReactions from './useReactions'
import ReactionEditModalVue from './ReactionEditModal.vue'
import { ReactionButton } from './types'
import { reactionButtonType } from './contentTypes'

export default defineComponent({
  setup () {
    const { t } = useI18n()
    const reactions = useReactions()
    const { meetingId } = useMeeting()
    const meetingButtons = computed(() => reactions.getMeetingButtons(meetingId.value))

    async function setContentType (button: ReactionButton, contentType: string, value: boolean) {
      // eslint-disable-next-line camelcase
      const allowed_models = value
        ? [contentType, ...button.allowed_models]
        : button.allowed_models.filter(ct => ct !== contentType)
      // eslint-disable-next-line camelcase
      await reactionButtonType.api.patch(button.pk, { allowed_models })
    }

    async function setActive (button: ReactionButton, active: boolean) {
      await reactionButtonType.api.patch(button.pk, { active })
    }

    function editReaction (button?: ReactionButton) {
      openModalEvent.emit({
        component: ReactionEditModalVue,
        data: button,
        title: button ? t('reaction.editButton') : t('reaction.addButton'),
        dismissable: false
      })
    }

    return {
      t,
      meetingButtons,
      editReaction,
      setActive,
      setContentType
    }
  }
})
</script>
