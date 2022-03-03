<template>
  <DiscussionPost :p="d" v-for="d in discussionPosts" :key="d.pk" class="mb-4">
    <template #buttons>
      <ReactionButton v-for="btn in reactions" :key="btn.pk" :button="btn" :relation="{ content_type: 'discussion_post', object_id: d.pk }">{{ btn.title }}</ReactionButton>
    </template>
  </DiscussionPost>
  <AddContent v-if="canAddDiscussionPost" :name="t('discussion.discussion')"
              :handler="submit" :placeholder="t('discussion.postPlaceholder')"
              :submitText="t('post')" :submitIcon="submitIcon" ref="addComponent"/>
</template>

<script lang="ts">
import { ComponentPublicInstance, computed, defineComponent, PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AddContent from '@/components/AddContent.vue'
import ReactionButton from '../reactions/ReactionButton.vue'
import useReactions from '../reactions/useReactions'
import useAgendaItem from '../agendas/useAgendaItem'
import useMeeting from '../meetings/useMeeting'

import DiscussionPostVue from './DiscussionPost.vue'
import { DiscussionPost } from './types'
import { discussionPostType } from './contentTypes'

export default defineComponent({
  components: {
    AddContent,
    DiscussionPost: DiscussionPostVue,
    ReactionButton
  },
  props: {
    discussionPosts: {
      type: Array as PropType<DiscussionPost[]>,
      required: true
    }
  },
  setup () {
    const { t } = useI18n()
    const { agendaId, canAddDiscussionPost, agendaItem } = useAgendaItem()
    const { meetingId } = useMeeting()
    const { getMeetingButtons } = useReactions()

    const submitIcon = computed(() => agendaItem.value?.block_discussion ? 'mdi-lock-outline' : 'mdi-comment-text-outline')
    async function submit (body: string, tags: string[]) {
      await discussionPostType.api.add({
        agenda_item: agendaId.value,
        body,
        tags
      })
    }

    const addComponent = ref<null | ComponentPublicInstance<{ focus:() => void }>>(null)
    const reactions = computed(() => getMeetingButtons(meetingId.value, 'discussion_post'))

    return {
      t,
      addComponent,
      canAddDiscussionPost,
      reactions,
      submitIcon,
      submit
    }
  }
})
</script>
