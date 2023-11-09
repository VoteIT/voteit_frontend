<script setup lang="ts">
import { computed } from 'vue'

import useMeeting from '../meetings/useMeeting'

import { proposalButtonPlugins } from './registry'
import type { Proposal, ProposalButtonMode } from './types'

const props = withDefaults(
  defineProps<{
    mode?: ProposalButtonMode
    proposal: Proposal
    tag?: string
  }>(),
  {
    tag: 'div'
  }
)

const { meeting } = useMeeting()

const plugins = computed(() =>
  meeting.value
    ? proposalButtonPlugins.getActivePlugins(meeting.value, props.mode)
    : []
)
</script>

<template>
  <component v-if="plugins.length" :is="tag">
    <component
      v-for="plugin in plugins"
      :key="plugin.id"
      :is="plugin.component"
      :mode="mode"
      :proposal="proposal"
    />
  </component>
</template>
