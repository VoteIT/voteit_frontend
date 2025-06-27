<script setup lang="ts">
import { ComponentPublicInstance, computed, ref } from 'vue'

import { getDisplayName } from '@/utils'

import useAgenda from '../agendas/useAgenda'
import useAgendaItem from '../agendas/useAgendaItem'
import { isGroupAuthor } from '../meetings/types'
import useMeetingId from '../meetings/useMeetingId'
import useUserDetails from '../organisations/useUserDetails'
import useReactions from '../reactions/useReactions'
import ReactionButton from '../reactions/ReactionButton.vue'

import DiscussionPost from './DiscussionPost.vue'
import DiscussionPostEditor from './DiscussionPostEditor.vue'
import { discussionPostType } from './contentTypes'
import type { DiscussionPost as IDiscussionPost } from './types'

defineProps<{
  comments: IDiscussionPost[]
  setTag?: string
}>()

const meetingId = useMeetingId()
const { agendaId } = useAgenda(meetingId)
const { getUser } = useUserDetails()
const { canAddDiscussionPost, agendaItem } = useAgendaItem(agendaId)
const { getMeetingButtons } = useReactions()

const submitIcon = computed(() =>
  agendaItem.value?.block_discussion
    ? 'mdi-lock-outline'
    : 'mdi-comment-text-outline'
)
async function submit(post: Partial<IDiscussionPost>) {
  await discussionPostType.api.add({
    agenda_item: agendaId.value,
    ...post
  })
}

const addContentComponent = ref<null | ComponentPublicInstance<{
  focus(): void
  setMention(user: { id: number; value: string }): void
  addTag(...tags: string[]): void
}>>(null)
const reactions = computed(() =>
  getMeetingButtons(meetingId.value, 'discussion_post')
)

function replyTo(post: IDiscussionPost) {
  if (!isGroupAuthor(post)) {
    const user = getUser(post.author)
    if (user)
      addContentComponent.value?.setMention({
        id: user.pk,
        value: getDisplayName(user)
      })
  }
  addContentComponent.value?.addTag(...post.tags)
  addContentComponent.value?.focus()
}

defineExpose({
  focus: () => addContentComponent.value?.focus()
})
</script>

<template>
  <div class="comments">
    <v-slide-x-transition group>
      <DiscussionPost v-for="c in comments" :key="c.pk" :p="c" class="mb-4">
        <template #buttons>
          <ReactionButton
            v-for="btn in reactions"
            :key="btn.pk"
            :button="btn"
            :relation="{ content_type: 'discussion_post', object_id: c.pk }"
          >
            {{ btn.title }}
          </ReactionButton>
        </template>
        <template #preMenu v-if="canAddDiscussionPost">
          <v-btn
            icon="mdi-reply"
            size="small"
            variant="text"
            @click="replyTo(c)"
            class="reply-button"
          />
        </template>
      </DiscussionPost>
    </v-slide-x-transition>
    <DiscussionPostEditor
      v-if="canAddDiscussionPost"
      ref="addContentComponent"
      :name="$t('discussion.discussion')"
      :handler="submit"
      :placeholder="$t('discussion.postPlaceholder')"
      :setTag="setTag"
      :submitIcon="submitIcon"
      :submitText="$t('post')"
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
