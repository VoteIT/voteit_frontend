<script setup lang="ts">
import { computed } from 'vue'

import { Proposal } from '../proposals/types'

import FlagButton from './FlagButton.vue'
import { IFlagButton } from './types'
import useReactions from './useReactions'

const props = defineProps<{
  buttons: IFlagButton[]
  proposals: Proposal[]
}>()

defineEmits<{
  (e: 'selected', proposals: number[]): void
}>()

const { getButtonReactionCount } = useReactions()

const annotated = computed(() =>
  props.buttons.map((button) => {
    const proposals = props.proposals
      .map((p) => p.pk)
      .filter((object_id) =>
        getButtonReactionCount(button, {
          content_type: 'proposal',
          object_id
        })
      )
    return { button, proposals }
  })
)
</script>

<template>
  <v-badge
    v-for="({ button, proposals }, i) in annotated"
    :key="button.pk"
    class="my-2"
    color="secondary"
    offset-x="3"
    offset-y="3"
    :content="proposals.length"
  >
    <FlagButton
      :button="button"
      class="mx-2"
      model-value
      @update:model-value="$emit('selected', proposals)"
    />
  </v-badge>
</template>
