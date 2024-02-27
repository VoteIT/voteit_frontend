<template>
  <main>
    <form @submit.prevent="save()">
      <v-text-field v-model="formData.title" required :label="t('title')" />
      <v-text-field
        v-model="formData.base_tag"
        required
        :label="t('proposal.textBaseTag')"
        @change="cleanBaseTag()"
      />
      <textarea class="form-control" v-model="formData.body" required />
      <div class="btn-group text-right">
        <v-btn
          type="submit"
          :disabled="saving"
          color="primary"
          prepend-icon="mdi-check-all"
          >{{ t('save') }}</v-btn
        >
      </div>
    </form>
  </main>
</template>

<script lang="ts">
import { defineComponent, PropType, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { slugify } from '@/utils'
import { closeModalEvent } from '@/utils/events'

import useMeetingId from '../meetings/useMeetingId'
import useAgenda from '../agendas/useAgenda'

import { ProposalText, proposalTextType } from './contentTypes'

export default defineComponent({
  props: {
    data: Object as PropType<ProposalText>
  },
  setup(props) {
    const { agendaId } = useAgenda(useMeetingId())
    const { t } = useI18n()
    const formData = reactive<
      Pick<ProposalText, 'base_tag' | 'body' | 'title'>
    >({
      base_tag: props.data?.base_tag ?? t('proposal.textBaseTagDefault'),
      body: props.data?.body ?? '',
      title: props.data?.title ?? ''
    })

    function cleanBaseTag() {
      formData.base_tag = slugify(formData.base_tag)
    }
    const saving = ref(false)
    async function save() {
      saving.value = true
      try {
        if (props.data)
          await proposalTextType.api.patch(props.data.pk, formData)
        else
          await proposalTextType.api.add({
            agenda_item: agendaId.value,
            ...formData
          })
        closeModalEvent.emit()
      } catch {
        saving.value = false
      }
    }

    return {
      t,
      formData,
      saving,
      cleanBaseTag,
      save
    }
  }
})
</script>

<style lang="sass">
textarea.form-control
  width: 100%
  min-height: 14em
  padding: .6em
  transition: background-color 250ms cubic-bezier(0.4, 0, 0.2, 1)
  background-color: rgba(var(--v-theme-on-background), calc(0.04 * var(--v-theme-overlay-multiplier)))
  &:hover
    background-color: rgba(var(--v-theme-on-background), calc(0.08 * var(--v-theme-overlay-multiplier)))
  &:focus,
  &:valid
    background-color: rgba(white, 1)
</style>
