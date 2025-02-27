<template>
  <v-slide-x-transition group>
    <ProposalCard v-for="p in proposals" :key="p.pk" :p="p" class="mb-4">
      <template #buttons>
        <ButtonPlugins :proposal="p" />
      </template>
    </ProposalCard>
  </v-slide-x-transition>
</template>

<script lang="ts" setup>
import ButtonPlugins from './ButtonPlugins.vue'
import ProposalCard from './ProposalCard.vue'
import type { Proposal } from './types'

defineProps<{ proposals: Proposal[] }>()
</script>
