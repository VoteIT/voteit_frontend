<template>
  <div v-if="p" class="proposal" :class="{ isUnread }">
    <slot name="top"/>
    <div class="meta">
      <div>
        <span class="content-type">{{ t('proposal.proposal') }}</span>
        <Tag :name="p.prop_id"/>
      </div>
      <div>
        <WorkflowState right v-if="!readOnly && (isModerator || p.state !== 'published')" :admin="isModerator" :object="p" :content-type="proposalType" />
      </div>
    </div>
    <Richtext submit :editing="editing" :api="api" :object="p" @edit-done="editing = false" />
    <div class="author">
      <span>{{ t('by') }} <User :pk="p.author" /></span>
      <Moment :date="p.created" />
    </div>
    <v-sheet v-if="$slots.vote" class="vote-slot">
      <slot name="vote"/>
    </v-sheet>
    <footer v-if="!readOnly">
      <div>
        <v-btn prepend-icon="mdi-comment-outline" variant="text" v-if="canComment(p)" @click="comment()">
          {{ t('discussion.comment') }}
        </v-btn>
        <v-btn prepend-icon="mdi-chevron-up" variant="text" v-if="showComments" @click="showComments = false">
          {{ t('discussion.hideComments') }}
        </v-btn>
        <v-btn variant="text" v-else-if="comments?.length" @click="showComments = true">
          {{ t('discussion.comments', { count: comments.length }) }}
        </v-btn>
        <slot name="buttons"/>
      </div>
      <Menu :items="menuItems" />
    </footer>
    <slot name="bottom"/>
    <Comments v-if="!readOnly && showComments" ref="commentsComponent" :set-tag="p.prop_id" :comments="comments" :comment-input="discussionRules.canAdd(agendaItem)" />
  </div>
  <div v-else class="proposal">
    <em>{{ t('proposal.notFound') }}</em>
  </div>
</template>

<script lang="ts">
import { ComponentPublicInstance, computed, defineComponent, nextTick, PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'

import Moment from './Moment.vue'
import Richtext from './Richtext.vue'
import Comments from '../Comments.vue'
import WorkflowState from './WorkflowState.vue'

import useAgenda from '@/modules/agendas/useAgenda'
import useMeeting from '@/composables/meeting/useMeeting'
import useUnread from '@/composables/useUnread'

import proposalType from '@/contentTypes/proposal'
import discussionRules from '@/contentTypes/discussionPost/rules'
import { DiscussionPost, MeetingRole, Proposal } from '@/contentTypes/types'
import { MenuItem, ThemeColor } from '@/utils/types'

export default defineComponent({
  name: 'Proposal',
  props: {
    p: {
      type: Object as PropType<Proposal>,
      required: true
    },
    comments: Array as PropType<DiscussionPost[]>,
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
    const api = proposalType.getContentApi()
    const { agendaItem } = useAgenda()
    const { hasRole } = useMeeting()
    const editing = ref(false)
    const showComments = ref(false)

    const wfState = computed(() => {
      return proposalType.useWorkflows().getState(props.p.state)
    })

    const { isUnread } = useUnread(props.p.created as Date)

    async function queryDelete () {
      if (await dialogQuery({
        title: t('proposal.deletePrompt'),
        theme: ThemeColor.Warning
      })) api.delete(props.p.pk)
    }

    async function retract () {
      if (await dialogQuery({
        title: t('proposal.retractPrompt'),
        theme: ThemeColor.Warning
      })) api.transition(props.p.pk, 'retract')
    }

    const commentsComponent = ref<null | ComponentPublicInstance<{ focus:() => void }>>(null)
    async function comment () {
      showComments.value = true
      await nextTick()
      // eslint-disable-next-line no-unused-expressions
      commentsComponent.value?.focus()
    }

    const menuItems = computed<MenuItem[]>(() => {
      const items: MenuItem[] = []
      if (proposalType.rules.canChange(props.p)) {
        items.push({
          text: t('edit'),
          icon: 'mdi-pencil',
          onClick: async () => { editing.value = true }
        })
      }
      if (proposalType.rules.canRetract(props.p)) {
        items.push({
          text: t('proposal.retract'),
          icon: 'mdi-undo',
          onClick: retract,
          color: ThemeColor.Warning
        })
      }
      if (proposalType.rules.canDelete(props.p)) {
        items.push({
          text: t('delete'),
          icon: 'mdi-delete',
          onClick: queryDelete,
          color: ThemeColor.Warning
        })
      }
      return items
    })

    const isModerator = computed<boolean>(() => {
      return hasRole(MeetingRole.Moderator)
    })

    return {
      t,
      agendaItem,
      commentsComponent,
      discussionRules,
      editing,
      isUnread,
      isModerator,
      proposalType,
      showComments,
      menuItems,
      api,
      wfState,
      ...proposalType.rules,
      comment,
      retract,
      queryDelete
    }
  }
})
</script>

<style lang="sass" scoped>
.proposal
  // border-left: 6px solid var(--proposal)
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

  &.isUnread .richtext
    position: relative
    ::after
      content: ''
      display: block
      position: absolute
      left: -1.2em
      top: .5em
      background-color: rgba(var(--v-theme-primary), .5)
      height: 6px
      width: 6px
      border-radius: 50%

  footer
    margin-bottom: .5em
    display: flex
    justify-content: space-between
    .context-menu
      margin-top: -6px

  .comments
    border-left: 2px solid rgb(var(--v-border-color))
    padding-left: 2em
    padding-right: 4em

  .vote-slot
    margin-top: .8em
    border: 1px solid rgb(var(--v-border-color))
    background-color: rgb(var(--v-theme-surface))
    padding: .6em 1.2em
    border-radius: 5px

a.tag
  font-size: 10pt
  text-decoration: none
  font-weight: 500
  margin-left: .5em
</style>
