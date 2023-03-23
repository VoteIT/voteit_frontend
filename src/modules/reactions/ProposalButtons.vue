<template>
  <ReactionButton v-for="btn in reactions" :key="btn.pk" :button="btn" :relation="{ content_type: 'proposal', object_id: proposal.pk }" class="mr-1">
    {{ btn.title }}
  </ReactionButton>
</template>

<script lang="ts" setup>
import { computed, inject } from 'vue'

import { meetingIdKey } from '../meetings/injectionKeys'
import { Proposal } from '../proposals/types'

import useReactions from './useReactions'
import ReactionButton from './ReactionButton.vue'

const meetingId = inject(meetingIdKey)
if (!meetingId) throw new Error('Reaction buttons requires meeting context')
const { getMeetingButtons } = useReactions()

defineProps<{ proposal: Proposal }>()

const reactions = computed(() => getMeetingButtons(meetingId.value, 'proposal'))
</script>
