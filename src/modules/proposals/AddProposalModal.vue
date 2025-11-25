<template>
  <DefaultDialog
    color="background"
    :persistent="!closable"
    :title="proposal ? $t('proposal.edit') : $t('proposal.add')"
    @close="resetContent"
  >
    <template #activator="attrs">
      <slot name="activator" v-bind="attrs"></slot>
    </template>
    <template #default="{ close }">
      <div class="d-flex flex-column">
        <v-expand-transition>
          <form @submit.prevent="preview" v-show="!done">
            <slot name="editor">
              <RichtextEditor
                v-model="body"
                class="proposal-editor mb-2"
                :placeholder="$t('proposal.postPlaceholder')"
              />
            </slot>
            <TagEdit v-model="extraTags" class="mb-2" />
            <div class="d-flex flex-column flex-md-row">
              <PostAs v-if="canPostAs" v-model="author" />
              <v-spacer />
              <slot name="actions"></slot>
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
            <ProposalCard
              readOnly
              :p="proposalPreview"
              class="my-6"
              :class="{ previewing }"
            />
          </div>
        </v-expand-transition>
        <v-spacer />
        <v-alert
          v-if="done"
          type="success"
          :text="$t('allDone')"
          class="mt-8 flex-grow-0"
        />
        <div v-if="done" class="text-right mt-4">
          <v-btn color="primary" :text="$t('close')" @click="close" />
        </div>
        <div v-else class="text-right mt-4">
          <v-btn :text="$t('cancel')" variant="text" @click="close" />
          <v-btn
            color="primary"
            :disabled="!proposalPreview || previewing || saving"
            prepend-icon="mdi-text-box-plus-outline"
            :text="proposal ? $t('update') : $t('publish')"
            @click="saveProposal"
          />
        </div>
      </div>
    </template>
  </DefaultDialog>
</template>

<script lang="ts" setup generic="T extends Proposal">
import { computed, ref, watch } from 'vue'

import { stripHTML } from '@/utils'
import { parseRestError } from '@/utils/restApi'

import DefaultDialog from '@/components/DefaultDialog.vue'
import RichtextEditor from '@/components/RichtextEditor.vue'
import TagEdit from '@/components/TagEdit.vue'
import useAgenda from '../agendas/useAgenda'
import { getHTMLTags } from '../meetings/useTags'
import useMeetingId from '../meetings/useMeetingId'
import PostAs from '../meetings/PostAs.vue'
import useMeetingGroups from '../meetings/useMeetingGroups'
import type { Author } from '../meetings/types'

import { proposalType } from './contentTypes'
import type { PreviewProposal, Proposal } from './types'
import ProposalCard from './ProposalCard.vue'

const previewDelay = 500 // Wait 1 s before preview
let previewTimeout: ReturnType<typeof setTimeout>

interface Props {
  extra?: Partial<T>
  modelValue?: string
  proposal?: T
  shortname?: string
}
const props = withDefaults(defineProps<Props>(), {
  extra() {
    return {}
  },
  modelValue: '',
  shortname: 'proposal'
})

const emit = defineEmits<{
  (e: 'reset'): void
}>()

const meetingId = useMeetingId()
const { agendaId } = useAgenda(meetingId)
const { canPostAs } = useMeetingGroups(meetingId)

const body = ref(props.proposal ? props.proposal.body : props.modelValue)
function getExtraTags(proposal?: Proposal) {
  if (!proposal) return []
  const docTags = getHTMLTags(proposal.body)
  return proposal.tags.filter(
    (tag) => !docTags.has(tag) && tag !== proposal.prop_id
  )
}
const extraTags = ref(getExtraTags(props.proposal))

const author = ref<Author | undefined>(
  props.proposal &&
    ({
      as_group: props.proposal.as_group,
      author: props.proposal.author,
      meeting_group: props.proposal.meeting_group
    } as Author)
)

function getPatchData(): Partial<Proposal> {
  return {
    body: body.value,
    ...(author.value || {}),
    tags: extraTags.value
  }
}

function getCreateData() {
  return {
    shortname: props.shortname,
    agenda_item: agendaId.value,
    ...props.extra,
    ...getPatchData()
  } as Partial<Proposal>
}

const api = proposalType.getContentApi({ alertOnError: false })
const proposalPreview = ref<Proposal>()
const errors = ref<Record<string, string[]>>({})
const errorText = computed(() => {
  const errs = errors.value.body ?? errors.value.__root__
  if (!errs) return
  return errs.join(', ')
})
async function preview() {
  errors.value = {}
  if (!body.value) return
  try {
    const { data } = await api.listAction<PreviewProposal>(
      'preview',
      getCreateData()
    )
    proposalPreview.value = {
      ...data,
      created: new Date().toISOString(),
      pk: 0,
      shortname: props.shortname
    } as Proposal
  } catch (e) {
    proposalPreview.value = undefined
    errors.value = parseRestError(e)
  }
  previewing.value = false
}

const saving = ref(false)
const done = ref(false)
async function saveProposal() {
  saving.value = true
  try {
    if (props.proposal)
      await proposalType.api.patch(props.proposal.pk, getPatchData())
    else await proposalType.api.add(getCreateData())
    done.value = true
  } catch {}
  saving.value = false
}

const previewing = ref(false)
function setPreviewTimeout() {
  clearTimeout(previewTimeout)
  if (!stripHTML(body.value)) {
    previewing.value = false
    proposalPreview.value = undefined
    return
  }
  previewing.value = true
  previewTimeout = setTimeout(preview, previewDelay)
}

watch(author, preview)
watch(body, setPreviewTimeout)
watch(extraTags, preview)
watch(
  () => props.modelValue,
  (value) => {
    // React when used as subcomponent, i.e. in AddTextProposalModal
    body.value = value
  }
)

/**
 * Control modal closing
 */
const closable = computed(
  () => done.value || (!proposalPreview.value && !previewing.value)
)

function resetContent() {
  done.value = false
  extraTags.value = getExtraTags(props.proposal)
  body.value = props.proposal?.body ?? ''
  proposalPreview.value = undefined
  emit('reset')
}
</script>

<style lang="sass">
.proposal-editor .ql-editor
  min-height: 140px

#proposal-preview
  .previewing
    opacity: .6
</style>
