<template>
  <v-sheet rounded elevation="4" class="discussion rounded-tl-xl" :class="{ isUnread }">
    <div class="d-flex" v-if="meetingGroup">
      <v-avatar color="secondary" class="mr-2" icon="mdi-account-multiple" />
      <div class="flex-grow-1">
        {{ meetingGroup.title }}<br/>
        <Moment :date="p.created" />
      </div>
    </div>
    <div class="d-flex" v-else-if="p.author">
      <UserAvatar :pk="p.author" class="mr-2" />
      <div class="flex-grow-1">
        <user :pk="p.author" /><br/>
        <Moment :date="p.created" />
      </div>
    </div>
    <div class="d-flex" v-else>
      <v-avatar color="secondary" class="mr-2">
        ?
      </v-avatar>
      <div class="flex-grow-1">
        {{ t('unknownUser') }}<br/>
        <Moment :date="p.created" />
      </div>
    </div>
    <Richtext :editing="editing" :api="api" :object="p" @edit-done="editing = false" />
    <div class="mt-6 mb-3" v-if="extraTags.length">
      <Tag v-for="tag in extraTags" :key="tag" :name="tag" class="mr-1" />
    </div>
    <footer v-if="!readOnly && ($slots.buttons || menuItems.length)" class="d-flex">
      <div class="d-flex flex-wrap">
        <slot name="buttons" />
      </div>
      <v-spacer />
      <Menu :items="menuItems" size="small" />
    </footer>
  </v-sheet>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue'

import Moment from '@/components/Moment.vue'
import Richtext from '@/components/Richtext.vue'

import { dialogQuery } from '@/utils'
import { useI18n } from 'vue-i18n'
import { MenuItem, ThemeColor } from '@/utils/types'
import useUnread from '@/composables/useUnread'
import useTags from '../meetings/useTags'
import useMeeting from '../meetings/useMeeting'
import useMeetingGroups from '../meetings/useMeetingGroups'

import { DiscussionPost } from './types'
import { discussionPostType } from './contentTypes'
import { canChangeDiscussionPost, canDeleteDiscussionPost } from './rules'

export default defineComponent({
  props: {
    p: {
      type: Object as PropType<DiscussionPost>,
      required: true
    },
    readOnly: Boolean
  },
  components: {
    Richtext,
    Moment
  },
  setup (props) {
    const { t } = useI18n()
    const { getHTMLTags } = useTags()
    const { meetingId } = useMeeting()
    const { getMeetingGroup } = useMeetingGroups(meetingId)

    const editing = ref(false)
    const { isUnread } = useUnread(props.p.created as Date)
    const meetingGroup = computed(() => props.p.meeting_group && getMeetingGroup(props.p.meeting_group))

    async function queryDelete () {
      if (await dialogQuery({
        title: t('discussion.deletePrompt'),
        theme: ThemeColor.Warning
      })) discussionPostType.api.delete(props.p.pk)
    }

    const menuItems = computed<MenuItem[]>(() => {
      const menu: MenuItem[] = []
      if (canChangeDiscussionPost(props.p)) {
        menu.push({
          title: t('edit'),
          icon: 'mdi-pencil',
          onClick: async () => { editing.value = true }
        })
      }
      if (canDeleteDiscussionPost(props.p)) {
        menu.push({
          title: t('delete'),
          icon: 'mdi-delete',
          color: ThemeColor.Warning,
          onClick: queryDelete
        })
      }
      return menu
    })

    const extraTags = computed(() => {
      const docTags = getHTMLTags(props.p.body)
      return props.p.tags.filter(tag => !docTags.has(tag))
    })

    return {
      t,
      api: discussionPostType.api,
      editing,
      extraTags,
      isUnread,
      meetingGroup,
      menuItems
    }
  }
})
</script>

<style lang="sass" scoped>
.discussion
  padding: 10px
  border-right: 4px solid rgba(var(--v-border-color), .8)
  &.isUnread
    border-right: 4px solid rgba(var(--v-theme-warning), .4)
  footer
    border-top: 1px solid rgba(var(--v-border-color), .4)
    margin: 0 -10px
    padding: 10px 10px 0

    .context-menu
      margin: -6px

  // .meta
  //   display: flex
  //   margin-bottom: .5em
  //   > div
  //     flex: 0 1 auto
  //   .fill
  //     margin: 0 .5em
  //     flex: 1 0 auto
  p
    margin: .5rem 0
</style>
