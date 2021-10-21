<template>
  <v-dialog v-model="isOpen">
    <template #activator="{ props }">
      <v-btn size="small" prepend-icon="mdi-text-box-plus-outline" color="primary" v-bind="props">
        {{ t('proposal.change') }}
      </v-btn>
    </template>
    <v-sheet color="background" class="pa-4 d-flex flex-column" width="640" max-width="90vw" min-height="580">
      <v-expand-transition>
        <form @submit.prevent="preview()" v-show="!done">
          <textarea class="form-control" v-model="body" required />
          <div class="btn-group text-right">
            <v-btn variant="text" color="warning" prepend-icon="mdi-undo-variant" :disabled="!isModified" @click="reset()">{{ t('reset') }}</v-btn>
            <v-btn type="submit" color="primary" prepend-icon="mdi-text-box-outline" :disabled="!isModified || !!html">{{ t('preview') }}</v-btn>
          </div>
        </form>
      </v-expand-transition>
      <v-expand-transition>
        <div v-if="html">
          <v-divider class="my-8" v-if="!done" />
          <p class="proposal-text-paragraph" v-html="html"/>
        </div>
      </v-expand-transition>
      <v-alert v-if="done" type="success" :text="t('allDone')" class="mt-8" />
      <v-spacer />
      <div v-if="done" class="text-right">
        <v-btn color="primary" @click="isOpen = false">
          {{ t('close') }}
        </v-btn>
      </div>
      <div v-else class="text-right">
        <v-btn variant="text" @click="isOpen = false">
          {{ t('cancel') }}
        </v-btn>
        <v-btn color="primary" prepend-icon="mdi-text-box-plus-outline" :disabled="!html || saving" @click="addProposal()">
          {{ t('publish') }}
        </v-btn>
      </div>
    </v-sheet>
  </v-dialog>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { proposalType, TextParagraph } from './contentTypes'
import useAgendaItem from '../agendas/useAgendaItem'
import { DiffProposal } from './types'

export default defineComponent({
  props: {
    paragraph: {
      type: Object as PropType<TextParagraph>,
      required: true
    }
  },
  setup (props) {
    const { t } = useI18n()
    const body = ref(props.paragraph.body)
    const { agendaId } = useAgendaItem()
    const isOpen = ref(false)

    function reset () {
      body.value = props.paragraph.body
    }

    const isModified = computed(() => body.value.trim() !== props.paragraph.body)
    function getPostData (): Partial<DiffProposal> {
      return {
        shortname: 'diff_proposal',
        agenda_item: agendaId.value,
        body: body.value,
        paragraph: props.paragraph.pk
      }
    }

    const html = ref<string | null>(null)
    async function preview () {
      const { data } = await proposalType.api.action<DiffProposal>('preview', getPostData())
      html.value = data.body_diff
    }

    const saving = ref(false)
    const done = ref(false)
    async function addProposal () {
      saving.value = true
      try {
        await proposalType.api.add(getPostData())
        done.value = true
      } catch {}
      saving.value = false
    }

    watch(body, () => {
      html.value = null
    })

    watch(isOpen, open => {
      if (done.value && !open) {
        reset()
        done.value = false
      }
    })

    return {
      t,
      done,
      isModified,
      isOpen,
      html,
      body,
      saving,
      addProposal,
      reset,
      preview
    }
  }
})
</script>
