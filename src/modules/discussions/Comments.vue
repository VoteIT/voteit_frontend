<template>
  <div class="comments">
    <DiscussionPost v-for="c in comments" :key="c.pk" :p="c" class="mb-4">
      <template v-slot:buttons>
        <ReactionButton v-for="btn in reactions" :key="btn.pk" :button="btn" :relation="{ content_type: 'discussion_post', object_id: c.pk }">{{ btn.title }}</ReactionButton>
      </template>
    </DiscussionPost>
    <AddContent ref="addContentComponent" v-if="commentInput" :name="t('discussion.discussion')"
                :handler="submit" :placeholder="t('discussion.postPlaceholder')"
                :submitText="t('post')" submitIcon="mdi-comment-text-outline"
                :setTag="setTag" />
  </div>
</template>

<script lang="ts">
import { ComponentPublicInstance, computed, defineComponent, PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AddContent from '@/components/AddContent.vue'
import ReactionButton from '@/modules/reactions/ReactionButton.vue'
import DiscussionPostVue from '@/modules/discussions/DiscussionPost.vue'

import useAgenda from '@/modules/agendas/useAgenda'
import useMeeting from '@/modules/meetings/useMeeting'
import useReactions from '@/modules/reactions/useReactions'

import { DiscussionPost } from './types'
import { discussionPostType } from './contentTypes'

export default defineComponent({
  components: {
    AddContent,
    DiscussionPost: DiscussionPostVue,
    ReactionButton
  },
  props: {
    comments: {
      type: Array as PropType<DiscussionPost[]>,
      required: true
    },
    commentInput: Boolean,
    setTag: String
  },
  setup () {
    const { t } = useI18n()
    const { meetingId } = useMeeting()
    const { agendaId } = useAgenda(meetingId)
    const { getMeetingButtons } = useReactions()

    const api = discussionPostType.getContentApi()

    async function submit (body: string, tags: string[]) {
      await api.add({
        agenda_item: agendaId.value,
        body,
        tags
      })
    }

    function focus () {
      addContentComponent.value?.focus()
    }

    const addContentComponent = ref<null | ComponentPublicInstance<{ focus:() => void }>>(null)
    const reactions = computed(() => getMeetingButtons(meetingId.value, 'discussion_post'))

    return {
      t,
      reactions,
      addContentComponent,
      focus,
      submit
    }
  }
})
</script>

<style lang="sass">
.comments
  .post-comment
    margin-bottom: 1em
    display: flex
    .richtext-editor
      flex: 1 0 80%
</style>
