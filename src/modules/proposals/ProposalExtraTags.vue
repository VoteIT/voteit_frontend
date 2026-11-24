<script setup lang="ts">
import { computed } from 'vue'

import Tag from '@/components/Tag.vue'

import type { Proposal } from './types'
import { getExtraTags } from './utils'

const props = defineProps<{
  proposal: Proposal
}>()

const extraTags = computed(() => getExtraTags(props.proposal))
</script>

<template>
  <div v-if="extraTags.length" class="d-flex flex-wrap ga-1">
    <Tag v-for="tag in extraTags" :key="tag" :name="tag" />
  </div>
</template>
