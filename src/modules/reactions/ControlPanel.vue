<template>
  <div>
    <h2>{{ t('reaction.settings') }}</h2>
    <Widget v-for="button in meetingButtons" :key="button.pk">
      <h2>
        {{ button.title }}
      </h2>
      <div class="btn-controls">
        <v-btn :prepend-icon="button.icon" :color="button.color">
          {n}
        </v-btn>
        <Btn icon="mdi-pencil" @click="editReaction(button)">{{ t('edit') }}</Btn>
      </div>
    </Widget>
    <Btn icon="mdi-plus" @click="editReaction()">{{ t('reaction.addButton') }}</Btn>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'

import { openModalEvent } from '@/utils'
import useMeeting from '@/modules/meetings/useMeeting'

import useReactions from './useReactions'
import ReactionEditModalVue from './ReactionEditModal.vue'
import { ReactionButton } from './types'

export default defineComponent({
  translationKey: 'reaction.buttons',
  path: 'reactions',
  icon: 'mdi-thumb-up',
  setup () {
    const { t } = useI18n()
    const reactions = useReactions()
    const { meetingId } = useMeeting()
    const meetingButtons = computed(() => reactions.getMeetingButtons(meetingId.value))

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
      editReaction
    }
  }
})
</script>
