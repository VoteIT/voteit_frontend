<script setup lang="ts">
import { ComponentPublicInstance, computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import ReactionButton from '../reactions/ReactionButton.vue'
import useReactions from '../reactions/useReactions'
import useAgendaItem from '../agendas/useAgendaItem'
import useAgenda from '../agendas/useAgenda'
import useMeeting from '../meetings/useMeeting'

import DiscussionPost from './DiscussionPost.vue'
import DiscussionPostEditor from './DiscussionPostEditor.vue'
import { discussionPostType } from './contentTypes'
import type { DiscussionPost as IDiscussionPost } from './types'

defineProps<{
  discussionPosts: IDiscussionPost[]
}>()

const { t } = useI18n()
const { meetingId } = useMeeting()
const { agendaId } = useAgenda(meetingId)
const { canAddDiscussionPost, agendaItem } = useAgendaItem(agendaId)
const { getMeetingButtons } = useReactions()

const submitIcon = computed(() => agendaItem.value?.block_discussion ? 'mdi-lock-outline' : 'mdi-comment-text-outline')
async function submit (post: Partial<IDiscussionPost>) {
  await discussionPostType.api.add({
    agenda_item: agendaId.value,
    ...post
  })
}

const addComponent = ref<null | ComponentPublicInstance<{ focus:() => void }>>(null)
const reactions = computed(() => getMeetingButtons(meetingId.value, 'discussion_post'))
</script>

<template>
  <DiscussionPost :p="d" v-for="d in discussionPosts" :key="d.pk" class="mb-4">
    <template #buttons>
      <ReactionButton v-for="btn in reactions" :key="btn.pk" :button="btn" :relation="{ content_type: 'discussion_post', object_id: d.pk }" class="mr-1">
        {{ btn.title }}
      </ReactionButton>
    </template>
  </DiscussionPost>
  <DiscussionPostEditor
    v-if="canAddDiscussionPost"
    ref="addComponent"
    :handler="submit"
    :name="t('discussion.discussion')"
    :placeholder="t('discussion.postPlaceholder')"
    :submitIcon="submitIcon"
    :submitText="t('post')"
  />
</template>
