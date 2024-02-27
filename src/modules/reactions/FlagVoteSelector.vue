<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { computed } from 'vue'

import { dialogQuery } from '@/utils'

import useMeetingId from '../meetings/useMeetingId'
import type { Proposal } from '../proposals/types'

import useReactions from './useReactions'
import { ReactionButton, isFlagButton } from './types'

const props = defineProps<{
  proposals: Proposal[]
  warn: boolean
}>()

const emit = defineEmits<{ (e: 'selected', value: number[]): void }>()

const { t } = useI18n()
const { getMeetingButtons, getButtonReactionCount, getUserReaction } =
  useReactions()
const meetingId = useMeetingId()

function isTemplateProposal(btn: ReactionButton, proposal: number) {
  const relation = { content_type: 'proposal', object_id: proposal }
  return isFlagButton(btn)
    ? getButtonReactionCount(btn, relation)
    : getUserReaction(btn, relation)
}

function hasTemplateProposals(btn: ReactionButton) {
  return (
    btn.vote_template &&
    props.proposals.some(({ pk }) => isTemplateProposal(btn, pk))
  )
}

const activeFlagButtons = computed(() =>
  getMeetingButtons(meetingId.value, 'proposal', 'voteTemplate').filter(
    hasTemplateProposals
  )
)

const singleButton = computed(() =>
  activeFlagButtons.value.length === 1 ? activeFlagButtons.value[0] : undefined
)

async function selectButtonProposals(btn: ReactionButton) {
  if (
    props.warn &&
    !(await dialogQuery(t('reaction.selectTemplateWithValidVote', { ...btn })))
  )
    return
  emit(
    'selected',
    props.proposals.map((p) => p.pk).filter((pk) => isTemplateProposal(btn, pk))
  )
}
</script>

<template>
  <v-toolbar
    v-if="activeFlagButtons.length"
    :border="true"
    rounded
    :title="t('reaction.templateCount', activeFlagButtons.length)"
  >
    <v-btn
      v-if="singleButton"
      :color="singleButton.color"
      :prepend-icon="singleButton.icon"
      variant="flat"
      @click="selectButtonProposals(singleButton)"
    >
      {{ singleButton.title }}
    </v-btn>
    <v-menu v-else>
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
