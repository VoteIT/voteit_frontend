<template>
  <AddProposalModal v-bind="props" @close="$emit('close')">
    <template #editor>
      <textarea class="form-control mb-2" v-model="body" required />
    </template>
    <template #actions>
      <v-btn variant="text" color="warning" prepend-icon="mdi-undo-variant" :disabled="!isModified" @click="reset()">{{ t('reset') }}</v-btn>
    </template>
  </AddProposalModal>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import type { TextParagraph } from './contentTypes'
import AddProposalModal from './AddProposalModal.vue'
import useTextDocuments from './useTextDocuments'
import type { DiffProposal } from './types'

export default defineComponent({
  components: {
    AddProposalModal
  },
  props: {
    paragraph: Object as PropType<TextParagraph>,
    proposal: Object as PropType<DiffProposal>
  },
  setup (props) {
    if (!(props.proposal || props.paragraph)) throw new Error('AddTextProposalModal requires either paragraph or proposal')

    const { t } = useI18n()
    const { getParagraph } = useTextDocuments()
    const paragraph = computed(() => props.paragraph ?? (props.proposal && getParagraph(props.proposal?.paragraph)))
    const body = ref(
      props.proposal
        ? props.proposal.body
        : paragraph.value?.body ?? ''
    )

    function reset () {
      body.value = paragraph.value?.body ?? ''
    }

    const isModified = computed(() => body.value.trim() !== paragraph.value?.body)

    return {
      t,
      props: computed(() => ({
        shortname: 'diff_proposal',
        extra: {
          paragraph: paragraph.value?.pk
        },
        modelValue: body.value,
        proposal: props.proposal
      })),
      isModified,
      body,
      reset
    }
  }
})
</script>
