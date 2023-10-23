<template>
  <AddProposalModal v-bind="modalProps" @close="$emit('close')">
    <template #editor>
      <textarea class="form-control mb-2" v-model="body" required></textarea>
    </template>
    <template #actions>
      <v-btn
        variant="text"
        color="warning"
        prepend-icon="mdi-undo-variant"
        :disabled="!isModified"
        @click="reset()"
        >{{ t('reset') }}</v-btn
      >
    </template>
  </AddProposalModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import type { TextParagraph } from './contentTypes'
import AddProposalModal from './AddProposalModal.vue'
import useTextDocuments from './useTextDocuments'
import type { DiffProposal } from './types'

const props = defineProps<{
  paragraph?: TextParagraph
  proposal?: DiffProposal
}>()

if (!(props.proposal || props.paragraph))
  throw new Error('AddTextProposalModal requires either paragraph or proposal')

const { t } = useI18n()
const { getParagraph } = useTextDocuments()
const paragraph = computed(
  () =>
    props.paragraph ??
    (props.proposal && getParagraph(props.proposal?.paragraph))
)
const body = ref(
  props.proposal ? props.proposal.body : paragraph.value?.body ?? ''
)

function reset() {
  body.value = paragraph.value?.body ?? ''
}

const isModified = computed(() => body.value.trim() !== paragraph.value?.body)

const modalProps = computed(
  () =>
    ({
      shortname: 'diff_proposal',
      extra: {
        paragraph: paragraph.value?.pk
      },
      modelValue: body.value,
      proposal: props.proposal
    } as const)
)
</script>
