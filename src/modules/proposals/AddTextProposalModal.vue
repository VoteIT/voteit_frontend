<template>
  <AddProposalModal shortname="diff_proposal" :extra="{ paragraph: paragraph.pk }" v-model="body" @reset="reset()">
    <template #activator="{ props }">
      <v-btn size="small" variant="contained" prepend-icon="mdi-text-box-plus-outline" color="primary" v-bind="props">
        {{ t('proposal.change') }}
      </v-btn>
    </template>
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

import { TextParagraph } from './contentTypes'
import AddProposalModal from './AddProposalModal.vue'

export default defineComponent({
  components: {
    AddProposalModal
  },
  props: {
    paragraph: {
      type: Object as PropType<TextParagraph>,
      required: true
    }
  },
  setup (props) {
    const { t } = useI18n()
    const body = ref(props.paragraph.body)

    function reset () {
      body.value = props.paragraph.body
    }

    const isModified = computed(() => body.value.trim() !== props.paragraph.body)

    return {
      t,
      isModified,
      body,
      reset
    }
  }
})
</script>
