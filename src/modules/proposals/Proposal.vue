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
      <Richtext v-if="p.shortname === 'proposal'" submit :editing="editing" :api="proposalType.api" :object="p" @edit-done="editing = false" class="my-3" />
      <div v-else-if="p.shortname === 'diff_proposal'" v-html="p.body_diff_brief" class="proposal-text-paragraph my-3" />
      <div class="mt-6 mb-3" v-if="extraTags.length">
        <Tag v-for="tag in extraTags" :key="tag" :name="tag" class="mr-1" />
      </div>
      <div class="author">
        <span>{{ t('by') }} <User :pk="p.author" /></span>
        <Moment :date="p.created" />
      </div>
      <v-sheet v-if="$slots.vote" class="vote-slot">
        <slot name="vote"/>
      </v-sheet>
      <footer v-if="!readOnly" class="mt-2 d-flex align-center">
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
        <v-spacer />
        <Menu size="small" :items="menuItems" />
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

import Moment from '@/components/Moment.vue'
import Richtext from '@/components/Richtext.vue'
import WorkflowState from '@/components/WorkflowState.vue'
import Comments from '@/modules/discussions/Comments.vue'

import useMeeting from '@/modules/meetings/useMeeting'
import useAgendaItem from '@/modules/agendas/useAgendaItem'
import useUnread from '@/composables/useUnread'

import { MenuItem, ThemeColor } from '@/utils/types'
import useTags from '../meetings/useTags'
import { Proposal } from './types'
import useDiscussions from '../discussions/useDiscussions'
import { canChangeProposal, canDeleteProposal, canRetractProposal } from './rules'
import { proposalType } from './contentTypes'

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
    Richtext,
    Moment,
    Comments,
    WorkflowState
  },
  setup (props) {
    const { t } = useI18n()
    const { agendaItem, canAddDiscussionPost } = useAgendaItem()
    const { isModerator } = useMeeting()
    const { getHTMLTags } = useTags()
    const editing = ref(false)
    const showComments = ref(false)
    const { getProposalDiscussions } = useDiscussions()
    const workflows = proposalType.useWorkflows()

    const wfState = computed(() => {
      return workflows.getState(props.p.state)
    })

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

    const menuItems = computed<MenuItem[]>(() => {
      const items: MenuItem[] = []
      if (props.p.shortname !== 'diff_proposal' && canChangeProposal(props.p)) {
        items.push({
          title: t('edit'),
          icon: 'mdi-pencil',
          onClick: async () => { editing.value = true }
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
      editing,
      extraTags,
      isUnread,
      isModerator,
      proposalType,
      showComments,
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
    color: rgb(var(--v-theme-secondary))
    font-size: 10.5pt
    > *
      margin-right: 1.5em

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
      margin: -10px

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
