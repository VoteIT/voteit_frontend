<script lang="ts" setup generic="T extends Proposal">
import { computed, shallowRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery, stripHTML } from '@/utils'
import { ThemeColor } from '@/utils/types'
import { parseRestError } from '@/utils/restApi'
import useErrorHandler from '@/composables/useErrorHandler'
import DefaultDialog from '@/components/DefaultDialog.vue'
import RichtextEditor from '@/components/RichtextEditor.vue'
import TagEdit from '@/components/TagEdit.vue'

import useAgendaItem from '../agendas/useAgendaItem'
import { getHTMLTags } from '../meetings/useTags'
import useMeetingId from '../meetings/useMeetingId'
import PostAs from '../meetings/PostAs.vue'
import useMeetingGroups from '../meetings/useMeetingGroups'
import type { Author } from '../meetings/types'

import { proposalType } from './contentTypes'
import type { PreviewProposal, Proposal } from './types'
import ProposalCard from './ProposalCard.vue'
import { getParagraphs, isApproveDenyProposal } from './utils'
import { RestError } from '@/utils/types'

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

const { t } = useI18n()
const { agendaId } = useAgendaItem()
const { canPostAs } = useMeetingGroups(useMeetingId())
const { handled } = useErrorHandler({ target: 'dialog' })

const body = shallowRef(props.proposal ? props.proposal.body : props.modelValue)
function getExtraTags(proposal?: Proposal) {
  if (!proposal) return []
  const docTags = getHTMLTags(proposal.body)
  return proposal.tags.filter(
    (tag) => !docTags.has(tag) && tag !== proposal.prop_id
  )
}
const extraTags = shallowRef(getExtraTags(props.proposal))

const author = shallowRef<Author | undefined>(
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

function getCreateData(paragraph?: string) {
  const data = {
    shortname: props.shortname,
    agenda_item: agendaId.value,
    ...props.extra,
    ...getPatchData()
  } as Partial<Proposal>
  if (paragraph !== undefined) data.body = paragraph
  return data
}

/**
 * Multiple paragraphs in a new plain proposal may be several proposals,
 * which the user can choose to post separately.
 */
const isNewPlainProposal = computed(
  () => !props.proposal && props.shortname === 'proposal'
)
const paragraphs = computed(() => getParagraphs(body.value))
const isMultiParagraph = computed(
  () => isNewPlainProposal.value && paragraphs.value.length > 1
)
const splitParagraphs = shallowRef(false)
const isSplit = computed(() => isMultiParagraph.value && splitParagraphs.value)
/** Bodies to post: one per paragraph when splitting */
function getBodies() {
  return isSplit.value ? paragraphs.value : [body.value]
}

const proposalPreviews = shallowRef<Proposal[]>([])
const errors = shallowRef<RestError<Proposal>>({})
const errorText = computed(() => {
  const errs = errors.value.body ?? errors.value.non_field_errors
  if (!errs) return
  return errs.join(', ')
})
async function preview() {
  errors.value = {}
  if (!body.value) return
  try {
    const previews = await Promise.all(
      getBodies().map((paragraph) =>
        proposalType.api.listAction<PreviewProposal>(
          'preview',
          getCreateData(paragraph)
        )
      )
    )
    proposalPreviews.value = previews.map(
      (data) =>
        ({
          ...data,
          created: new Date().toISOString(),
          pk: 0,
          shortname: props.shortname
        }) as Proposal
    )
  } catch (e) {
    proposalPreviews.value = []
    errors.value = parseRestError(e)
  }
  previewing.value = false
}

const saving = shallowRef(false)
const done = shallowRef(false)
async function saveProposal() {
  saving.value = true
  if (props.proposal) {
    await handled(async () => {
      await proposalType.api.patch(props.proposal!.pk, getPatchData())
      done.value = true
    })
    saving.value = false
    return
  }
  const pending = getBodies()
  if (
    isNewPlainProposal.value &&
    pending.some(isApproveDenyProposal) &&
    !(await dialogQuery({
      title: t('proposal.approveDenyConfirm'),
      theme: ThemeColor.Warning
    }))
  ) {
    saving.value = false
    return
  }
  const split = isSplit.value
  await handled(async () => {
    // Post one at a time, to keep the order
    while (pending.length) {
      await proposalType.api.add(getCreateData(pending[0]))
      pending.shift()
    }
    done.value = true
  })
  // On failure, keep only what wasn't posted, so that a retry doesn't create duplicates
  if (split && pending.length) body.value = pending.join('')
  saving.value = false
}

const previewing = shallowRef(false)
function setPreviewTimeout() {
  clearTimeout(previewTimeout)
  if (!stripHTML(body.value)) {
    previewing.value = false
    proposalPreviews.value = []
    return
  }
  previewing.value = true
  previewTimeout = setTimeout(preview, previewDelay)
}

watch(author, preview)
watch(body, setPreviewTimeout)
watch(extraTags, preview)
watch(isSplit, preview)
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
  () => done.value || (!proposalPreviews.value.length && !previewing.value)
)

function resetContent() {
  done.value = false
  extraTags.value = getExtraTags(props.proposal)
  body.value = props.proposal?.body ?? ''
  splitParagraphs.value = false
  proposalPreviews.value = []
  emit('reset')
}
</script>

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
                class="proposal-editor"
                :placeholder="$t('proposal.postPlaceholder')"
              />
            </slot>
            <TagEdit v-model="extraTags" />
            <v-expand-transition>
              <v-checkbox
                v-if="isMultiParagraph"
                v-model="splitParagraphs"
                hide-details
                :label="$t('proposal.splitParagraphs')"
              />
            </v-expand-transition>
            <div class="d-flex flex-column flex-md-row">
              <PostAs v-if="canPostAs" v-model="author" />
              <v-spacer />
              <slot name="actions"></slot>
            </div>
          </form>
        </v-expand-transition>
        <v-expand-transition>
          <div v-if="!proposalPreviews.length">
            <p v-if="errorText" class="my-6 text-center text-error">
              {{ errorText }}
            </p>
            <p class="text-center my-6" v-else-if="previewing">
              <v-progress-circular color="primary" indeterminate />
            </p>
          </div>
        </v-expand-transition>
        <v-expand-transition>
          <div
            v-if="proposalPreviews.length"
            class="d-flex flex-column ga-3 my-6"
            id="proposal-preview"
          >
            <ProposalCard
              v-for="(p, index) in proposalPreviews"
              :key="index"
              readOnly
              :p="p"
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
            :disabled="!proposalPreviews.length || previewing || saving"
            prepend-icon="mdi-text-box-plus-outline"
            :text="
              proposal
                ? $t('update')
                : isSplit
                  ? $t('proposal.publishCount', paragraphs.length)
                  : $t('publish')
            "
            @click="saveProposal"
          />
        </div>
      </div>
    </template>
  </DefaultDialog>
</template>

<style lang="sass">
.proposal-editor .ql-editor
  min-height: 140px

#proposal-preview
  .previewing
    opacity: .6
</style>
