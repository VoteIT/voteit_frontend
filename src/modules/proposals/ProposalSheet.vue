<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import Tag from '@/components/Tag.vue'

import { Proposal } from './types'
import ProposalText from './ProposalText.vue'
import AuthorName from '../meetings/AuthorName.vue'

const { t } = useI18n()

defineProps<{
  proposal: Proposal
}>()
</script>

<template>
  <v-sheet rounded>
    <div class="pa-4">
      <div class="d-flex">
        <div class="flex-grow-1">
          <Tag :name="proposal.prop_id" />
        </div>
        <slot name="actions"></slot>
      </div>
      <ProposalText :proposal="proposal" />
      <div class="text-secondary">
        <AuthorName :author="proposal" icon :prepend-text="t('by')" />
      </div>
      <slot name="append"></slot>
    </div>
    <slot name="bottom"></slot>
  </v-sheet>
</template>
