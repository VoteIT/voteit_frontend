<template>
  <div v-if="p" class="proposal" :selected="selected">
    <slot name="top"/>
    <div class="meta">
      <div>
        <span class="content-type">{{ t('proposal.proposal') }}</span>
        <Tag :name="p.prop_id"/>
      </div>
      <div>
        <span>{{ t('by') }} <User :pk="p.author" /></span>
        <Moment :date="p.created" />
        <v-icon v-if="!readOnly" :icon="wfState.icon" color="secondary" size="small" :title="wfState.state" />
      </div>
    </div>
    <Richtext submit :tags="allTags" :editing="editing" :api="api" :object="p" @edit-done="editing = false" />
    <v-sheet v-if="$slots.vote" class="vote-slot">
      <slot name="vote"/>
    </v-sheet>
    <footer v-if="!readOnly">
      <div>
        <v-btn plain v-if="canComment(p)" @click="comment()">
          <v-icon left icon="mdi-comment-outline"/>
          {{ t('discussion.comment') }}
        </v-btn>
        <v-btn plain v-if="showComments" @click="showComments = false">
          <v-icon left icon="mdi-chevron-up"/>
          {{ t('discussion.hideComments') }}
        </v-btn>
        <v-btn plain v-else-if="comments?.length" @click="showComments = true">
          {{ t('discussion.comments', { count: comments.length }) }}
        </v-btn>
        <slot name="buttons"/>
      </div>
      <Menu :items="menuItems" :show-transitions="canChange(p)" :content-type="proposalType" :content-pk="p.pk" />
    </footer>
    <slot name="bottom"/>
    <Comments v-if="!readOnly" ref="commentsComponent" v-show="showComments" :set-tag="p.prop_id" :comments="comments" :all-tags="allTags" :comment-input="discussionRules.canAdd(agendaItem)" />
  </div>
  <div v-else class="proposal">
    <em>{{ t('proposal.notFound') }}</em>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'

import Moment from './Moment.vue'
import Richtext from './Richtext.vue'
import Comments from '../Comments.vue'

import useAgenda from '@/composables/meeting/useAgenda'

import proposalType from '@/contentTypes/proposal'
import discussionRules from '@/contentTypes/discussionPost/rules'
import { DiscussionPost, Proposal } from '@/contentTypes/types'
import { MenuItem, ThemeColor } from '@/utils/types'

export default defineComponent({
  name: 'Proposal',
  inject: ['t'],
  props: {
    p: {
      type: Object as PropType<Proposal>,
      required: true
    },
    allTags: Set as PropType<Set<string>>,
    comments: Array as PropType<DiscussionPost[]>,
    readOnly: Boolean,
    selected: Boolean
  },
  components: {
    Richtext,
    Moment,
    Comments
  },
  setup (props) {
    const { t } = useI18n()
    const api = proposalType.getContentApi()
    const { agendaItem } = useAgenda()
    const editing = ref(false)
    const showComments = ref(false)

    const wfState = computed(() => {
      return proposalType.useWorkflows().getState(props.p.state)
    })

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

    const commentsComponent = ref<any>(null)
    async function comment () {
      showComments.value = true
      await nextTick()
      commentsComponent.value.editorComponent.focus()
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

    return {
      agendaItem,
      comment,
      commentsComponent,
      discussionRules,
      proposalType,
      editing,
      queryDelete,
      retract,
      showComments,
      menuItems,
      api,
      wfState,
      ...proposalType.rules
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
      letter-spacing: .08em
    display: flex
    justify-content: space-between
    color: var(--disabled-text)
    div > span
      margin-right: 1em
      &:last-child
        margin-right: 0

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
    border: 1px solid rgb(var(--v-border-color))
    background-color: rgb(var(--v-theme-surface))
    padding: .35em .6em
    border-radius: 5px

a.tag
  font-size: 10pt
  text-decoration: none
  font-weight: 500
  margin-left: .5em
</style>
