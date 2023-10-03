<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

import MeetingToolbar from '../meetings/MeetingToolbar.vue'
import useMeeting from '../meetings/useMeeting'
import type { Proposal } from '../proposals/types'

import useReactions from './useReactions'
import { IFlagButton, ReactionButton, isFlagButton } from './types'
import { dialogQuery } from '@/utils'

const props = defineProps<{
  proposals: Proposal[]
  warn: boolean
}>()

const emit = defineEmits<{(e: 'selected', value: number[]): void}>()

const { t } = useI18n()
const { getMeetingButtons, getButtonReactionCount } = useReactions()
const { meetingId } = useMeeting()

function hasFlagActive (btn: ReactionButton): btn is IFlagButton {
  if (!isFlagButton(btn)) return false
  return props.proposals.some(p => {
    return getButtonReactionCount(
      btn,
      { content_type: 'proposal', object_id: p.pk }
    )
  })
}

function isFlaggedProposal (btn: IFlagButton, proposal: number) {
  return getButtonReactionCount(
    btn,
    { content_type: 'proposal', object_id: proposal }
  )
}

const activeFlagButtons = computed(() => getMeetingButtons(meetingId.value, 'proposal', 'vote').filter(hasFlagActive))

async function selectButtonProposals (btn: IFlagButton) {
  if (props.warn && !await dialogQuery(t('reaction.selectTemplateWithValidVote', { ...btn }))) return
  emit('selected', props.proposals.map(p => p.pk).filter(pk => isFlaggedProposal(btn, pk)))
}
</script>

<template>
  <v-toolbar
    v-if="activeFlagButtons.length"
    border
    rounded
    :title="t('reaction.templateCount', activeFlagButtons.length)"
  >
    <v-menu>
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          append-icon="mdi-chevron-down"
          color="primary"
          variant="flat"
        >
          {{ t('reaction.selectTemplate') }}
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          v-for="btn in activeFlagButtons"
          :key="btn.pk"
          :class="`text-${btn.color}`"
          :prepend-icon="btn.icon"
          :title="btn.title"
          @click="selectButtonProposals(btn)"
        />
      </v-list>
    </v-menu>
  </v-toolbar>
</template>
