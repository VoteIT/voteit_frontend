<template>
  <div>
    <h2>{{ t('reaction.settings') }}</h2>
    <Widget v-for="button in meetingButtons" :key="button.pk">
      <h2>
        {{ button.title }}
      </h2>
      <div class="btn-controls">
        <v-btn :color="button.color">
          <v-icon left :icon="button.icon" />
          {n}
        </v-btn>
        <Btn icon="mdi-pencil" @click="editReaction(button)">{{ t('edit') }}</Btn>
      </div>
    </Widget>
    <Btn icon="mdi-plus" @click="editReaction()">{{ t('reaction.addButton') }}</Btn>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject } from 'vue'

import { openModalEvent } from '@/utils'
import useMeeting from '@/composables/meeting/useMeeting'
import useReactions from '@/composables/meeting/useReactions'
import { ReactionButton } from '@/contentTypes/reactionButton'

import ReactionEditModalVue from './ReactionEditModal.vue'

export default defineComponent({
  name: 'ReactionButtons',
  path: 'reactions',
  icon: 'mdi-thumb-up',
  setup () {
    const t = inject('t') as (text: string) => string
    const reactions = useReactions()
    const { meetingId } = useMeeting()
    const meetingButtons = computed(() => reactions.getMeetingButtons(meetingId.value))

    function editReaction (button?: ReactionButton) {
      openModalEvent.emit({
        component: ReactionEditModalVue,
        data: button,
        title: button ? t('reaction.editButton') : t('reaction.addButton')
      })
    }

    return {
      t,
      editReaction,
      meetingButtons
    }
  }
})
</script>
