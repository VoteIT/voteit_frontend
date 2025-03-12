<template>
  <div>
    <v-sheet
      v-if="p"
      rounded
      elevation="4"
      class="proposal"
      :class="{ isUnread }"
    >
      <slot name="top"></slot>
      <div class="meta d-flex ga-1">
        <div class="flex-grow-1">
          <span class="content-type">{{ $t('proposal.proposal') }}</span>
          <Tag :name="p.prop_id" />
        </div>
        <slot name="actions">
          <WorkflowState
            right
            v-if="!readOnly && (isModerator || p.state !== 'published')"
            :admin="isModerator"
            :object="p"
            :content-type="proposalType"
          />
        </slot>
      </div>
      <ProposalText :proposal="p" class="my-3" />
      <div class="mt-6 mb-3" v-if="extraTags.length">
        <Tag v-for="tag in extraTags" :key="tag" :name="tag" class="mr-1" />
      </div>
      <div class="author text-secondary d-flex flex-wrap align-end">
        <AuthorName :author="p" icon :prepend-text="$t('by')">
          <template #appendMain>
            <Moment :date="p.created" class="ml-6" />
          </template>
        </AuthorName>
        <v-spacer />
        <slot name="bottom-right"></slot>
      </div>
      <v-sheet v-if="$slots.vote" class="vote-slot">
        <slot name="vote"></slot>
      </v-sheet>
      <footer v-if="!readOnly" class="mt-2 d-flex flex-wrap ga-1">
        <v-btn
          v-if="canAddDiscussionPost"
          prepend-icon="mdi-comment-outline"
          size="small"
          :text="$t('discussion.comment')"
          variant="text"
          @click="comment"
        />
        <v-btn
          v-if="showComments"
          prepend-icon="mdi-chevron-up"
          size="small"
          :text="$t('discussion.hideComments')"
          variant="text"
          @click="showComments = false"
        />
        <v-btn
          v-else-if="discussionPosts.length"
          prepend-icon="mdi-chevron-down"
          size="small"
          :text="$t('discussion.comments', { count: discussionPosts.length })"
          variant="text"
          @click="showComments = true"
        />
        <slot name="buttons"></slot>
        <v-spacer />
        <v-menu
          v-if="
            canChangeProposal(p) ||
            canRetractProposal(p) ||
            canDeleteProposal(p)
          "
        >
          <template #activator="{ props }">
            <v-btn
              icon="mdi-dots-vertical"
              v-bind="props"
              size="small"
              variant="text"
              class="my-n2 mr-n2 ml-auto"
            />
          </template>
          <v-list>
            <ProposalEditModal v-if="canChangeProposal(p)" :proposal="p">
              <template #activator="{ props }">
                <v-list-item
                  prepend-icon="mdi-pencil"
                  :title="$t('edit')"
                  v-bind="props"
                />
              </template>
            </ProposalEditModal>
            <QueryDialog
              v-if="canRetractProposal(p)"
              color="warning"
              :text="$t('proposal.retractPrompt')"
              @confirmed="retract"
            >
              <template #activator="{ props }">
                <v-list-item
                  base-color="warning"
                  prepend-icon="mdi-undo"
                  :title="$t('proposal.retract')"
                  v-bind="props"
                />
              </template>
            </QueryDialog>
            <QueryDialog
              v-if="canDeleteProposal(p)"
              color="warning"
              :text="$t('proposal.deletePrompt')"
              @confirmed="deleteProposal"
            >
              <template #activator="{ props }">
                <v-list-item
                  base-color="warning"
                  prepend-icon="mdi-delete"
                  :title="$t('content.delete')"
                  v-bind="props"
                />
              </template>
            </QueryDialog>
          </v-list>
        </v-menu>
      </footer>
      <footer v-else-if="$slots.buttons" class="d-flex flex-wrap ga-1">
        <slot name="buttons"></slot>
      </footer>
      <slot name="bottom"></slot>
    </v-sheet>
    <v-sheet rounded elevation="2" v-else class="proposal">
      <em>{{ $t('proposal.notFound') }}</em>
    </v-sheet>
    <Comments
      class="proposal-comments mt-4 mb-8 ml-1 mr-4 mr-sm-8 mr-lg-12"
      v-if="!readOnly && showComments"
      ref="commentsComponent"
      :set-tag="p.prop_id"
      :comments="discussionPosts"
    />
  </div>
</template>

<script lang="ts" setup>
import { ComponentPublicInstance, computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import Moment from '@/components/Moment.vue'
import Tag from '@/components/Tag.vue'
import QueryDialog from '@/components/QueryDialog.vue'
import WorkflowState from '@/components/WorkflowState.vue'
import useUnread from '@/composables/useUnread'

import useAgendaItem from '../agendas/useAgendaItem'
import useAgendaFilter from '../agendas/useAgendaFilter'
import Comments from '../discussions/Comments.vue'
import useDiscussions from '../discussions/useDiscussions'
import useMeeting from '../meetings/useMeeting'
import useTags from '../meetings/useTags'
import AuthorName from '../meetings/AuthorName.vue'

import { proposalType } from './contentTypes'
import {
  canChangeProposal,
  canDeleteProposal,
  canRetractProposal
} from './rules'
import ProposalText from './ProposalText.vue'
import { type Proposal } from './types'
import { proposalTypeRegistry } from './registry'

const props = defineProps<{
  p: Proposal
  readOnly?: boolean
}>()

const { t } = useI18n()
const { isModerator } = useMeeting()
const agendaId = computed(() => props.p.agenda_item)
const { orderContent } = useAgendaFilter(agendaId)
const { canAddDiscussionPost } = useAgendaItem(agendaId)
const { getHTMLTags } = useTags()
const showComments = ref(false)
const { getProposalDiscussions } = useDiscussions()

const { isUnread } = useUnread(new Date(props.p.created))

function deleteProposal() {
  proposalType.api.delete(props.p.pk)
}

function retract() {
  proposalType.transitions.make(props.p, 'retract', t)
}

const discussionPosts = computed(() => {
  if (props.readOnly) return []
  return orderContent(getProposalDiscussions(props.p))
})
const commentsComponent = ref<null | ComponentPublicInstance<{
  focus: () => void
}>>(null)
async function comment() {
  showComments.value = true
  await nextTick()
  commentsComponent.value?.focus()
}

const extraTags = computed(() => {
  const docTags = getHTMLTags(props.p.body)
  return props.p.tags.filter(
    (tag) => !docTags.has(tag) && tag !== props.p.prop_id
  )
})

/**
 * Dynamic choice of component for editing proposal
 */
const ProposalEditModal = computed(() =>
  proposalTypeRegistry.getEditModal(props.p.shortname)
)
</script>

<style lang="sass" scoped>
.proposal
  padding: 10px
  border-left: 4px solid rgba(var(--v-border-color), .8)
  &.isUnread
    border-left-color: rgba(var(--v-theme-primary), .3)
  .meta
    .content-type
      color: #000
      font-size: 8pt
      font-weight: 700
      text-transform: uppercase
      letter-spacing: .03em
    color: var(--disabled-text)
    div > span
      margin-right: 1em
      &:last-child
        margin-right: 0

  .author
    font-size: 10.5pt

  footer
    border-top: 1px solid rgba(var(--v-border-color), .4)
    margin: 0 -10px
    padding: 10px 10px 0
    .context-menu
      margin: -6px

  .vote-slot
    margin-top: .8em
    border: 1px solid rgb(var(--v-border-color))
    background-color: rgb(var(--v-theme-surface))
    padding: .6em 1.2em
    border-radius: 5px

.proposal-comments
  border-left: 2px solid rgb(var(--v-border-color))
  padding-left: 2em

a.tag
  font-size: 10pt
  text-decoration: none
  font-weight: 500
  margin-left: .5em
</style>
