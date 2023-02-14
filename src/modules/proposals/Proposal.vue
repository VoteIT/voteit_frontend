<template>
  <div>
    <v-sheet v-if="p" rounded elevation="4" class="proposal" :class="{ isUnread }">
      <slot name="top"></slot>
      <div class="meta">
        <div>
          <span class="content-type">{{ t('proposal.proposal') }}</span>
          <Tag :name="p.prop_id"/>
        </div>
        <div>
          <WorkflowState right v-if="!readOnly && (isModerator || p.state !== 'published')" :admin="isModerator" :object="p" :content-type="proposalType" />
        </div>
      </div>
      <Richtext v-if="p.shortname === 'proposal'" :object="p" class="my-3" />
      <div v-else-if="p.shortname === 'diff_proposal'" v-html="p.body_diff_brief" class="proposal-text-paragraph my-3" />
      <div class="mt-6 mb-3" v-if="extraTags.length">
        <Tag v-for="tag in extraTags" :key="tag" :name="tag" class="mr-1" />
      </div>
      <div class="author text-secondary d-flex flex-wrap align-end">
        <v-icon v-if="meetingGroup" size="small" class="mr-1" style="position: relative; top: -1px;">mdi-account-multiple</v-icon>
        <span>{{ t('by') }}
          <span v-if="meetingGroup">
            {{ meetingGroup.title }}
          </span>
          <User v-else :pk="p.author" userid />
        </span>
        <Moment :date="p.created" class="ml-6" />
        <v-spacer />
        <slot name="bottom-right"></slot>
      </div>
      <v-sheet v-if="$slots.vote" class="vote-slot">
        <slot name="vote"></slot>
      </v-sheet>
      <footer v-if="!readOnly" class="mt-2 d-flex">
        <div class="d-flex flex-wrap">
          <v-btn prepend-icon="mdi-comment-outline" size="small" variant="text" v-if="canAddDiscussionPost" @click="comment()">
            {{ t('discussion.comment') }}
          </v-btn>
          <v-btn prepend-icon="mdi-chevron-up" size="small" variant="text" v-if="showComments" @click="showComments = false">
            {{ t('discussion.hideComments') }}
          </v-btn>
          <v-btn prepend-icon="mdi-chevron-down" size="small" variant="text" v-else-if="discussionPosts.length" @click="showComments = true">
            {{ t('discussion.comments', { count: discussionPosts.length }) }}
          </v-btn>
          <slot name="buttons"></slot>
        </div>
        <v-spacer />
        <DropdownMenu size="small" :items="menuItems" />
        <DefaultDialog v-model="editDialog" color="background" persistent>
          <AddTextProposalModal v-if="p.shortname === 'diff_proposal'" @close="editDialog = false" :proposal="p" />
          <AddProposalModal v-else @close="editDialog = false" :proposal="p" />
        </DefaultDialog>
      </footer>
      <slot name="bottom"></slot>
    </v-sheet>
    <v-sheet rounded elevation="2" v-else class="proposal">
      <em>{{ t('proposal.notFound') }}</em>
    </v-sheet>
    <Comments class="proposal-comments mt-4 mb-8 ml-1 mr-4 mr-sm-8 mr-lg-12" v-if="!readOnly && showComments" ref="commentsComponent" :set-tag="p.prop_id" :comments="discussionPosts" :comment-input="canAddDiscussionPost" />
  </div>
</template>

<script lang="ts" setup>
import { ComponentPublicInstance, computed, nextTick, PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'
import { MenuItem, ThemeColor } from '@/utils/types'

import Moment from '@/components/Moment.vue'
import Richtext from '@/components/Richtext.vue'
import WorkflowState from '@/components/WorkflowState.vue'
import useUnread from '@/composables/useUnread'

import useAgendaItem from '../agendas/useAgendaItem'
import useAgendaFilter from '../agendas/useAgendaFilter'
import Comments from '../discussions/Comments.vue'
import useDiscussions from '../discussions/useDiscussions'
import useMeeting from '../meetings/useMeeting'
import useMeetingGroups from '../meetings/useMeetingGroups'
import useTags from '../meetings/useTags'

import { proposalType } from './contentTypes'
import { canChangeProposal, canDeleteProposal, canRetractProposal } from './rules'
import AddProposalModal from './AddProposalModal.vue'
import AddTextProposalModal from './AddTextProposalModal.vue'
import type { Proposal } from './types'
import DefaultDialog from '@/components/DefaultDialog.vue'

const props = defineProps({
  p: {
    type: Object as PropType<Proposal>,
    required: true
  },
  readOnly: Boolean
})

const { t } = useI18n()
const { isModerator, meetingId } = useMeeting()
const agendaId = computed(() => props.p.agenda_item)
const { orderContent } = useAgendaFilter(agendaId)
const { canAddDiscussionPost } = useAgendaItem(agendaId)
const { getHTMLTags } = useTags()
const showComments = ref(false)
const { getProposalDiscussions } = useDiscussions()
const { getMeetingGroup } = useMeetingGroups(meetingId)

const meetingGroup = computed(() => props.p.meeting_group && getMeetingGroup(props.p.meeting_group))
const { isUnread } = useUnread(props.p.created)

async function queryDelete () {
  if (await dialogQuery({
    title: t('proposal.deletePrompt'),
    theme: ThemeColor.Warning
  })) proposalType.api.delete(props.p.pk)
}

async function retract () {
  if (await dialogQuery({
    title: t('proposal.retractPrompt'),
    theme: ThemeColor.Warning
  })) proposalType.api.transition(props.p.pk, 'retract')
}

const discussionPosts = computed(() => {
  if (props.readOnly) return []
  return orderContent(getProposalDiscussions(props.p))
})
const commentsComponent = ref<null | ComponentPublicInstance<{ focus:() => void }>>(null)
async function comment () {
  showComments.value = true
  await nextTick()
  // eslint-disable-next-line no-unused-expressions
  commentsComponent.value?.focus()
}

const editDialog = ref(false)
const menuItems = computed<MenuItem[]>(() => {
  const items: MenuItem[] = []
  if (canChangeProposal(props.p)) {
    items.push({
      title: t('edit'),
      prependIcon: 'mdi-pencil',
      onClick: async () => { editDialog.value = true }
    })
  }
  if (canRetractProposal(props.p)) {
    items.push({
      title: t('proposal.retract'),
      prependIcon: 'mdi-undo',
      onClick: retract,
      color: ThemeColor.Warning
    })
  }
  if (canDeleteProposal(props.p)) {
    items.push({
      title: t('delete'),
      prependIcon: 'mdi-delete',
      onClick: queryDelete,
      color: ThemeColor.Warning
    })
  }
  return items
})

const extraTags = computed(() => {
  const docTags = getHTMLTags(props.p.body)
  return props.p.tags.filter(tag => !docTags.has(tag) && tag !== props.p.prop_id)
})
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
    display: flex
    justify-content: space-between
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
