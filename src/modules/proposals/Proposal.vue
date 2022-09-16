<template>
  <div>
    <v-sheet v-if="p" rounded elevation="4" class="proposal" :class="{ isUnread }">
      <slot name="top" />
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
      <div class="author text-secondary">
        <v-icon v-if="meetingGroup" size="small" class="mr-1" style="position: relative; top: -1px;">mdi-account-multiple</v-icon>
        <span>{{ t('by') }}
          <span v-if="meetingGroup">
            {{ meetingGroup.title }}
          </span>
          <User v-else :pk="p.author" userid />
        </span>
        <Moment :date="p.created" class="ml-6" />
      </div>
      <v-sheet v-if="$slots.vote" class="vote-slot">
        <slot name="vote"/>
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
          <slot name="buttons"/>
        </div>
        <v-spacer />
        <DropdownMenu size="small" :items="menuItems" />
        <v-dialog v-model="editDialog">
          <AddTextProposalModal v-if="p.shortname === 'diff_proposal'" @close="editDialog = false" :proposal="p" />
          <AddProposalModal v-else @close="editDialog = false" :proposal="p" />
        </v-dialog>
      </footer>
      <slot name="bottom"/>
    </v-sheet>
    <v-sheet rounded elevation="2" v-else class="proposal">
      <em>{{ t('proposal.notFound') }}</em>
    </v-sheet>
    <Comments class="proposal-comments mt-4 mb-8 ml-1 mr-4 mr-sm-8 mr-lg-12" v-if="!readOnly && showComments" ref="commentsComponent" :set-tag="p.prop_id" :comments="discussionPosts" :comment-input="canAddDiscussionPost" />
  </div>
</template>

<script lang="ts">
import { ComponentPublicInstance, computed, defineComponent, nextTick, PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'
import { MenuItem, ThemeColor } from '@/utils/types'

import Moment from '@/components/Moment.vue'
import Richtext from '@/components/Richtext.vue'
import WorkflowState from '@/components/WorkflowState.vue'
import Comments from '@/modules/discussions/Comments.vue'

import useMeeting from '@/modules/meetings/useMeeting'
import useAgendaItem from '@/modules/agendas/useAgendaItem'
import useUnread from '@/composables/useUnread'

import useTags from '../meetings/useTags'
import useMeetingGroups from '../meetings/useMeetingGroups'
import useDiscussions from '../discussions/useDiscussions'
import { proposalType } from './contentTypes'
import { canChangeProposal, canDeleteProposal, canRetractProposal } from './rules'
import AddProposalModal from './AddProposalModal.vue'
import AddTextProposalModal from './AddTextProposalModal.vue'
import type { Proposal } from './types'

export default defineComponent({
  name: 'Proposal',
  props: {
    p: {
      type: Object as PropType<Proposal>,
      required: true
    },
    readOnly: Boolean
  },
  components: {
    AddProposalModal,
    AddTextProposalModal,
    Comments,
    Richtext,
    Moment,
    WorkflowState
  },
  setup (props) {
    const { t } = useI18n()
    const { isModerator, meetingId } = useMeeting()
    const { agendaItem, canAddDiscussionPost } = useAgendaItem(computed(() => props.p.agenda_item))
    const { getHTMLTags } = useTags()
    const showComments = ref(false)
    const { getProposalDiscussions } = useDiscussions()
    const workflows = proposalType.useWorkflows()
    const { getMeetingGroup } = useMeetingGroups(meetingId)

    const wfState = computed(() => {
      return workflows.getState(props.p.state)
    })

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
      return getProposalDiscussions(props.p)
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
          icon: 'mdi-pencil',
          onClick: async () => { editDialog.value = true }
        })
      }
      if (canRetractProposal(props.p)) {
        items.push({
          title: t('proposal.retract'),
          icon: 'mdi-undo',
          onClick: retract,
          color: ThemeColor.Warning
        })
      }
      if (canDeleteProposal(props.p)) {
        items.push({
          title: t('delete'),
          icon: 'mdi-delete',
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

    return {
      t,
      agendaItem,
      commentsComponent,
      canAddDiscussionPost,
      discussionPosts,
      editDialog,
      extraTags,
      isUnread,
      isModerator,
      proposalType,
      showComments,
      meetingGroup,
      menuItems,
      wfState,
      comment,
      retract,
      queryDelete
    }
  }
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

  // &.isUnread .richtext
  //   position: relative
  //   &::after
  //     content: ''
  //     display: block
  //     position: absolute
  //     left: -1.2em
  //     top: .5em
  //     background-color: rgba(var(--v-theme-primary), .5)
  //     height: 6px
  //     width: 6px
  //     border-radius: 50%

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
