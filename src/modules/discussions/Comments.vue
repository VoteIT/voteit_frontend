<script setup lang="ts">
import { ComponentPublicInstance, computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { getDisplayName } from '@/utils'

import ReactionButton from '../reactions/ReactionButton.vue'
import useAgenda from '../agendas/useAgenda'
import useMeeting from '../meetings/useMeeting'
import useReactions from '../reactions/useReactions'
import useAgendaItem from '../agendas/useAgendaItem'
import useUserDetails from '../organisations/useUserDetails'

import DiscussionPost from './DiscussionPost.vue'
import DiscussionPostEditor from './DiscussionPostEditor.vue'
import { discussionPostType } from './contentTypes'
import type { DiscussionPost as IDiscussionPost } from './types'
import { isGroupAuthor } from '../meetings/types'

defineProps<{
  comments: IDiscussionPost[]
  setTag?: string
}>()

const { t } = useI18n()
const { meetingId } = useMeeting()
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
  // eslint-disable-next-line func-call-spacing
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
            class="mr-1"
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
            class="mx-2 reply-button"
          />
        </template>
      </DiscussionPost>
    </v-slide-x-transition>
    <DiscussionPostEditor
      v-if="canAddDiscussionPost"
      ref="addContentComponent"
      :name="t('discussion.discussion')"
      :handler="submit"
      :placeholder="t('discussion.postPlaceholder')"
      :setTag="setTag"
      :submitIcon="submitIcon"
      :submitText="t('post')"
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

<style scoped lang="sass">
.reply-button
  margin-top: -6px
  margin-bottom: -6px
</style>
