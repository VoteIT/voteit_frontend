<script setup lang="ts">
import Richtext from '@/components/Richtext.vue'
import type { TermsOfService } from './types'

defineProps<{ tos: Pick<TermsOfService, 'body' | 'global_body'> }>()
</script>

<template>
  <Richtext :value="tos.global_body" />
  <template v-if="tos.body">
    <v-divider class="my-4" />
    <Richtext :value="tos.body" />
  </template>
</template>
