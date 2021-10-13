<template>
  <main>
    <transition name="slide-down">
      <form @submit.prevent="preview()" v-show="!done">
        <textarea class="form-control" v-model="paragraph" required />
        <div class="btn-group text-right">
          <v-btn variant="text" color="warning" prepend-icon="mdi-undo-variant" @click="reset()">{{ t('reset') }}</v-btn>
          <v-btn type="submit" color="primary" prepend-icon="mdi-text-box-outline" :disabled="!isModified || !!html">{{ t('preview') }}</v-btn>
        </div>
      </form>
    </transition>
    <template v-if="html">
      <v-divider class="my-4" v-if="!done" />
      <p class="proposal-text-paragraph" v-html="html"/>
      <div class="btn-group text-right mt-2" v-if="!done">
        <v-btn color="primary" prepend-icon="mdi-text-box-plus-outline" :disabled="saving" @click="addProposal()">{{ t('publish') }}</v-btn>
      </div>
    </template>
    <v-alert v-if="done" type="success" :text="t('allDone')" class="mt-4" />
  </main>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { TextParagraph } from './contentTypes'
import proposalType from '@/contentTypes/proposal'
import useAgendaItem from '../agendas/useAgendaItem'
import { DiffProposal } from './types'

export default defineComponent({
  props: {
    data: {
      type: Object as PropType<TextParagraph>,
      required: true
    }
  },
  setup (props) {
    const { t } = useI18n()
    const paragraph = ref(props.data.body)
    const { agendaId } = useAgendaItem()

    function reset () {
      paragraph.value = props.data.body
    }

    const isModified = computed(() => paragraph.value.trim() !== props.data.body)
    function getPostData (): Partial<DiffProposal> {
      return {
        shortname: 'diff_proposal',
        agenda_item: agendaId.value,
        body: paragraph.value,
        paragraph: props.data.pk
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

    watch(paragraph, () => {
      html.value = null
    })

    return {
      t,
      done,
      isModified,
      html,
      paragraph,
      saving,
      addProposal,
      reset,
      preview
    }
  }
})
</script>
