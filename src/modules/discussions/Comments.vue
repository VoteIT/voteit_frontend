<script setup lang="ts">
import { ComponentPublicInstance, computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import DiscussionPostEditor from './DiscussionPostEditor.vue'
import ReactionButton from '@/modules/reactions/ReactionButton.vue'
import DiscussionPost from '@/modules/discussions/DiscussionPost.vue'

import useAgenda from '@/modules/agendas/useAgenda'
import useMeeting from '@/modules/meetings/useMeeting'
import useReactions from '@/modules/reactions/useReactions'

import { DiscussionPost as IDiscussionPost } from './types'
import { discussionPostType } from './contentTypes'

const props = defineProps<{
  comments: IDiscussionPost[]
  commentInput?: boolean
  setTag?: string
}>()

const { t } = useI18n()
const { meetingId } = useMeeting()
const { agendaId } = useAgenda(meetingId)
const { getMeetingButtons } = useReactions()

async function submit (post: Partial<IDiscussionPost>) {
  await discussionPostType.api.add({
    agenda_item: agendaId.value,
    ...post
  })
}

const addContentComponent = ref<null | ComponentPublicInstance<{ focus:() => void }>>(null)
const reactions = computed(() => getMeetingButtons(meetingId.value, 'discussion_post'))

defineExpose({
  focus: () => addContentComponent.value?.focus()
})
</script>

<template>
  <div class="comments">
    <DiscussionPost v-for="c in comments" :key="c.pk" :p="c" class="mb-4">
      <template #buttons>
        <ReactionButton v-for="btn in reactions" :key="btn.pk" :button="btn" :relation="{ content_type: 'discussion_post', object_id: c.pk }">{{ btn.title }}</ReactionButton>
      </template>
    </DiscussionPost>
    <DiscussionPostEditor
      ref="addContentComponent" v-if="commentInput" :name="t('discussion.discussion')"
      :handler="submit" :placeholder="t('discussion.postPlaceholder')"
      :submitText="t('post')" submitIcon="mdi-comment-text-outline"
      :setTag="setTag"
    />
  </div>
</template>

<style lang="sass">
.comments
  .post-comment
    margin-bottom: 1em
    display: flex
    .richtext-editor
      flex: 1 0 80%
</style>
