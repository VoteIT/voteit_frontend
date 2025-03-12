<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery } from '@/utils'
import { MenuItem, ThemeColor } from '@/utils/types'
import Moment from '@/components/Moment.vue'
import Tag from '@/components/Tag.vue'
import DropdownMenu from '@/components/DropdownMenu.vue'
import Richtext from '@/components/Richtext.vue'
import RichtextEditor from '@/components/RichtextEditor.vue'
import TagEdit from '@/components/TagEdit.vue'
import useUnread from '@/composables/useUnread'

import useTags from '../meetings/useTags'
import useMeetingGroups from '../meetings/useMeetingGroups'
import PostAs from '../meetings/PostAs.vue'
import type { Author } from '../meetings/types'
import AuthorName from '../meetings/AuthorName.vue'
import AuthorAvatar from '../meetings/AuthorAvatar.vue'
import useMeetingId from '../meetings/useMeetingId'

import { DiscussionPost } from './types'
import { discussionPostType } from './contentTypes'
import { canChangeDiscussionPost, canDeleteDiscussionPost } from './rules'

const props = defineProps<{
  p: DiscussionPost
  readOnly?: boolean
}>()

const { t } = useI18n()
const { getHTMLTags } = useTags()
const { canPostAs } = useMeetingGroups(useMeetingId())

const editing = ref(false)
const saving = ref(false)
const body = ref(props.p.body)
const author = ref({
  author: props.p.author,
  meeting_group: props.p.meeting_group
} as Author)
const { isUnread } = useUnread(new Date(props.p.created))

watch(
  () => props.p.body,
  (value) => {
    if (!editing.value) body.value = value
  }
)

async function queryDelete() {
  if (
    await dialogQuery({
      title: t('discussion.deletePrompt'),
      theme: ThemeColor.Warning
    })
  )
    discussionPostType.api.delete(props.p.pk)
}

const menuItems = computed<MenuItem[]>(() => {
  const menu: MenuItem[] = []
  if (canChangeDiscussionPost(props.p)) {
    menu.push({
      title: t('edit'),
      prependIcon: 'mdi-pencil',
      onClick: async () => {
        editing.value = true
      }
    })
  }
  if (canDeleteDiscussionPost(props.p)) {
    menu.push({
      title: t('content.delete'),
      prependIcon: 'mdi-delete',
      color: ThemeColor.Warning,
      onClick: queryDelete
    })
  }
  return menu
})

function getExtraTags() {
  const docTags = getHTMLTags(props.p.body)
  return props.p.tags.filter((tag) => !docTags.has(tag))
}
const extraTags = ref(getExtraTags())
watch(
  () => props.p.body,
  () => {
    extraTags.value = getExtraTags()
  }
)

function cancel() {
  editing.value = false
  body.value = props.p.body
  extraTags.value = getExtraTags()
  author.value = {
    author: props.p.author,
    meeting_group: props.p.meeting_group
  } as Author
}

async function save() {
  saving.value = true
  discussionPostType.api.patch(props.p.pk, {
    body: body.value,
    tags: extraTags.value,
    ...author.value
  })
  editing.value = false
  saving.value = false
}
</script>

<template>
  <v-sheet
    rounded
    elevation="4"
    class="discussion rounded-ts-xl"
    :class="{ isUnread }"
  >
    <div class="d-flex">
      <AuthorAvatar :author="p" class="mr-2" />
      <div class="flex-grow-1">
        <AuthorName :author="p">
          <template #appendSecondary>
            <Moment :date="p.created" />
          </template>
        </AuthorName>
      </div>
    </div>
    <div v-if="editing">
      <RichtextEditor v-model="body" />
      <TagEdit v-model="extraTags" />
      <br />
      <PostAs v-show="canPostAs" v-model="author" class="my-2" />
      <div class="d-flex mt-1">
        <v-spacer />
        <v-btn
          size="small"
          :text="$t('cancel')"
          variant="text"
          @click="cancel"
        />
        <v-btn
          color="primary"
          size="small"
          :text="$t('save')"
          type="submit"
          @click="save"
        />
      </div>
    </div>
    <div v-else>
      <Richtext class="my-3" :value="p.body" />
      <div class="mt-6 mb-3" v-if="extraTags.length">
        <Tag v-for="tag in extraTags" :key="tag" :name="tag" class="mr-1" />
      </div>
    </div>
    <footer
      v-if="!readOnly && ($slots.buttons || $slots.preMenu || menuItems.length)"
      class="d-flex flex-wrap ga-1"
    >
      <slot name="buttons"></slot>
      <div class="ml-auto flex-shrink-0 d-flex my-n2 mr-n2">
        <slot name="preMenu"></slot>
        <DropdownMenu :items="menuItems" size="small" />
      </div>
    </footer>
  </v-sheet>
</template>

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

  p
    margin: .5rem 0
</style>
