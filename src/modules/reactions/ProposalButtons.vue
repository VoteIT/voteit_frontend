<script lang="ts" setup>
import { computed } from 'vue'

import useMeeting from '../meetings/useMeeting'
import { Proposal, ProposalButtonMode } from '../proposals/types'

import useReactions from './useReactions'
import ReactionButton from './ReactionButton.vue'
import { isFlagButton, IFlagButton } from './types'

const { meetingId, isModerator } = useMeeting()
const {
  getButtonReactionCount,
  getMeetingButtons,
  removeUserReacted,
  setUserReacted
} = useReactions()

const props = defineProps<{
  mode?: ProposalButtonMode
  proposal: Proposal
}>()

const readonly = computed(() => !!props.mode)

const relation = computed(() => ({
  content_type: 'proposal',
  object_id: props.proposal.pk
}))

const buttons = computed(() =>
  getMeetingButtons(meetingId.value, 'proposal', props.mode)
)
const flagButtons = computed(() =>
  buttons.value.filter(isFlagButton).map((button) => ({
    button,
    active: !!getButtonReactionCount(button, relation.value)
  }))
)
const collapseFlags = computed(
  () => readonly.value || flagButtons.value.length > 2
)
const activeButtons = computed(() =>
  collapseFlags.value
    ? buttons.value.filter(
        (b) => !isFlagButton(b) || !!getButtonReactionCount(b, relation.value)
      )
    : buttons.value
)

async function setFlag(button: IFlagButton, value: boolean) {
  // TODO error handle!
  try {
    value
      ? await setUserReacted(button, relation.value)
      : await removeUserReacted(button, relation.value)
  } catch (e) {
    console.error(e)
  }
}
</script>

<template>
  <ReactionButton
    v-for="btn in activeButtons"
    :key="btn.pk"
    :button="btn"
    :readonly="readonly || (collapseFlags && isFlagButton(btn))"
    :relation="relation"
  >
    {{ btn.title }}
  </ReactionButton>
  <v-menu v-if="!readonly && collapseFlags && isModerator">
    <template #activator="{ props }">
      <v-btn
        append-icon="mdi-chevron-down"
        size="small"
        variant="tonal"
        v-bind="props"
      >
        <v-icon icon="mdi-flag" />
      </v-btn>
    </template>
    <v-list>
      <v-list-item
        v-for="{ active, button } in flagButtons"
        :active="active"
        :append-icon="button.icon"
        :prepend-icon="
          active ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'
        "
        :title="button.title"
        @click.stop="setFlag(button, !active)"
      >
        <template #append>
          <v-icon
            :color="button.color"
            :icon="button.icon || 'mdi-checkbox-blank'"
          />
        </template>
      </v-list-item>
    </v-list>
  </v-menu>
</template>
