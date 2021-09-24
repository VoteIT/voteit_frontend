<template>
  <Widget class="discussion" :class="{ isUnread }">
    <div class="meta">
      <div>
        <UserAvatar :pk="p.author" />
      </div>
      <div class="fill">
        <user :pk="p.author" /><br/>
        <Moment :date="p.created" />
      </div>
      <div class="tags" v-if="false">
        <Tag v-for="tag in p.tags" :key="tag" :name="tag" />
      </div>
    </div>
    <Richtext submit :editing="editing" :api="api" :object="p" @edit-done="editing = false" />
    <footer v-if="!readOnly && ($slots.buttons || menuItems.length)">
      <div>
        <slot name="buttons"/>
      </div>
      <Menu :items="menuItems"/>
    </footer>
  </Widget>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue'

import Moment from '@/components/Moment.vue'
import Richtext from '@/components/Richtext.vue'

import { dialogQuery } from '@/utils'
import discussionPostType from '@/contentTypes/discussionPost'
import { DiscussionPost, Predicate } from '@/contentTypes/types'
import { useI18n } from 'vue-i18n'
import { MenuItem, ThemeColor } from '@/utils/types'
import useUnread from '@/composables/useUnread'

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
    const api = discussionPostType.getContentApi()
    const { canDelete, canChange } = discussionPostType.rules as Record<string, Predicate>

    const editing = ref(false)
    const { isUnread } = useUnread(props.p.created as Date)

    async function queryDelete () {
      if (await dialogQuery({
        title: t('discussion.deletePrompt'),
        theme: ThemeColor.Warning
      })) api.delete(props.p.pk)
    }

    const menuItems = computed<MenuItem[]>(() => {
      const menu: MenuItem[] = []
      if (canChange(props.p)) {
        menu.push({
          title: t('edit'),
          icon: 'mdi-pencil',
          onClick: async () => { editing.value = true }
        })
      }
      if (canDelete(props.p)) {
        menu.push({
          title: t('delete'),
          icon: 'mdi-delete',
          color: ThemeColor.Warning,
          onClick: queryDelete
        })
      }
      return menu
    })

    return {
      api,
      editing,
      isUnread,
      menuItems
    }
  }
})
</script>

<style lang="sass">
.discussion
  footer
    border-top: 1px solid rgb(var(--v-border-color))
    margin: 0 -10px
    padding: 10px 10px 0
    display: flex
    justify-content: space-between

    .context-menu
      margin: -10px

  .meta
    display: flex
    margin-bottom: .5em
    > div
      flex: 0 1 auto
      // &:last-child
      //   text-align: right
    .fill
      margin: 0 .5em
      flex: 1 0 auto
  p
    margin: .5rem 0
    white-space: pre-wrap

  .tags
    .tag
      margin-left: .2em
      &:first-child
        margin-left: 0

.richtext,
.ql-editor
  .mention
    white-space: nowrap
    padding: .2em .6em
    border-radius: 4px
    font-size: 10pt
</style>
