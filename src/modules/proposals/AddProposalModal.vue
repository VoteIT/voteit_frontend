<template>
  <v-sheet color="background" class="pa-4 d-flex flex-column overflow-y-auto" v-bind="dialogDefaults">
    <v-expand-transition>
      <form @submit.prevent="preview()" v-show="!done">
        <slot name="editor">
          <RichtextEditor v-model="body" class="proposal-editor mb-2" :placeholder="t('proposal.postPlaceholder')" />
        </slot>
        <div class="d-flex flex-column flex-md-row">
          <PostAs v-if="canPostAs" v-model="author" />
          <v-spacer />
          <slot name="actions" />
        </div>
      </form>
    </v-expand-transition>
    <v-expand-transition>
      <div v-if="!proposalPreview">
        <p v-if="errorText" class="my-6 text-center text-error">
          {{ errorText }}
        </p>
        <p class="text-center my-6" v-else-if="previewing">
          <v-progress-circular color="primary" indeterminate />
        </p>
      </div>
    </v-expand-transition>
    <v-expand-transition>
      <div v-if="proposalPreview" id="proposal-preview">
        <Proposal readOnly :p="proposalPreview" class="my-6" :class="{ previewing }" />
      </div>
    </v-expand-transition>
    <v-spacer />
    <v-alert v-if="done" type="success" :text="t('allDone')" class="mt-8 flex-grow-0" />
    <div v-if="done" class="text-right mt-4">
      <v-btn color="primary" @click="$emit('close')">
        {{ t('close') }}
      </v-btn>
    </div>
    <div v-else class="text-right mt-4">
      <v-btn variant="text" @click="$emit('close')">
        {{ t('cancel') }}
      </v-btn>
      <v-btn color="primary" prepend-icon="mdi-text-box-plus-outline" :disabled="!proposalPreview || previewing || saving" @click="saveProposal()">
        {{ proposal ? t('update') : t('publish') }}
      </v-btn>
    </div>
  </v-sheet>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { stripHTML } from '@/utils'
import { parseRestError } from '@/utils/restApi'

import useAuthentication from '@/composables/useAuthentication'
import useDefaults from '@/composables/useDefaults'
import RichtextEditor from '@/components/RichtextEditor.vue'
import { proposalType } from './contentTypes'
import useAgenda from '../agendas/useAgenda'
import useMeeting from '../meetings/useMeeting'
import PostAs from '../meetings/PostAs.vue'
import useMeetingGroups from '../meetings/useMeetingGroups'

import type { PreviewProposal, Proposal } from './types'
import type { Author } from '../meetings/types'

const previewDelay = 500 // Wait 1 s before preview
let previewTimeout: number

export default defineComponent({
  emits: ['close'],
  components: {
    PostAs,
    RichtextEditor
  },
  props: {
    shortname: {
      type: String as PropType<Proposal['shortname']>,
      default: 'proposal'
    },
    extra: {
      type: Object as PropType<Partial<Proposal>>,
      default: () => ({})
    },
    modelValue: {
      type: String,
      default: ''
    },
    proposal: Object as PropType<Proposal>
  },
  setup (props) {
    const { t } = useI18n()
    const body = ref(
      props.proposal
        ? props.proposal.body
        : props.modelValue
    )
    const { meetingId } = useMeeting()
    const { agendaId } = useAgenda(meetingId)
    const { canPostAs } = useMeetingGroups(meetingId)
    const { user } = useAuthentication()

    const author = ref<Partial<Author> | undefined>(
      props.proposal && {
        author: props.proposal.author,
        meeting_group: props.proposal.meeting_group
      } as Author
    )

    function getPatchData (): Partial<Proposal> {
      return {
        body: body.value,
        ...(author.value || {})
      }
    }

    function getCreateData (): Partial<Proposal> {
      return {
        shortname: props.shortname,
        agenda_item: agendaId.value,
        ...props.extra,
        ...getPatchData()
      }
    }

    const api = proposalType.getContentApi({ alertOnError: false })
    const proposalPreview = ref<Partial<Proposal> | null>(null)
    const errors = ref<Record<string, string[]>>({})
    const errorText = computed(() => {
      const errs = errors.value.body ?? errors.value.__root__
      if (!errs) return
      return errs.join(', ')
    })
    async function preview () {
      errors.value = {}
      if (!body.value) return
      try {
        const { data } = await api.action<PreviewProposal>('preview', getCreateData())
        proposalPreview.value = {
          ...data,
          created: new Date(),
          pk: 0,
          shortname: props.shortname
        }
      } catch (e) {
        proposalPreview.value = null
        errors.value = parseRestError(e)
      }
      previewing.value = false
    }

    const saving = ref(false)
    const done = ref(false)
    async function saveProposal () {
      saving.value = true
      try {
        if (props.proposal) await proposalType.api.patch(props.proposal.pk, getPatchData())
        else await proposalType.api.add(getCreateData())
        done.value = true
      } catch {}
      saving.value = false
    }

    const previewing = ref(false)
    function setPreviewTimeout () {
      clearTimeout(previewTimeout)
      if (!stripHTML(body.value)) {
        previewing.value = false
        proposalPreview.value = null
        return
      }
      previewing.value = true
      previewTimeout = setTimeout(
        preview,
        previewDelay
      )
    }

    watch(author, preview)
    watch(body, setPreviewTimeout)
    watch(() => props.modelValue, value => { // React when used as subcomponent, i.e. in AddTextProposalModal
      body.value = value
    })

    return {
      t,
      ...useDefaults(),
      author,
      canPostAs,
      done,
      errorText,
      previewing,
      proposalPreview,
      body,
      saving,
      user,
      saveProposal,
      preview
    }
  }
})
</script>

<style lang="sass">
.proposal-editor .ql-editor
  min-height: 140px

#proposal-preview
  .previewing
    opacity: .6
</style>
