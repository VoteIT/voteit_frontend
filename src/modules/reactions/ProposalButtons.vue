<template>
  <ReactionButton
    v-for="btn in reactions"
    :key="btn.pk"
    :button="btn"
    :readonly="!!mode"
    :relation="{ content_type: 'proposal', object_id: proposal.pk }"
  >
    {{ btn.title }}
  </ReactionButton>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import useMeetingId from '../meetings/useMeetingId'
import { Proposal, ProposalButtonMode } from '../proposals/types'

import useReactions from './useReactions'
import ReactionButton from './ReactionButton.vue'

const meetingId = useMeetingId()
const { getMeetingButtons } = useReactions()

const props = defineProps<{
  mode?: ProposalButtonMode
  proposal: Proposal
}>()

const reactions = computed(() =>
  getMeetingButtons(meetingId.value, 'proposal', props.mode)
)
</script>
