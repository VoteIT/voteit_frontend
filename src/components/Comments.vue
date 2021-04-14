<template>
  <div class="comments">
    <div class="post-comment" v-if="commentInput">
      <UserAvatar class="mr-2" size="small" />
      <RichtextEditor ref="editorComponent" @submit="submit()" submit :disabled="disabled" :tags="allTags" v-model="comment" :submit-text="t('post')" submit-icon="mdi-send" />
    </div>
    <DiscussionPost :all-tags="allTags" v-for="c in comments" :key="c.pk" :p="c">
      <template v-slot:buttons>
        <ReactionButton v-for="btn in reactions" :key="btn.pk" :button="btn" :relation="{ content_type: 'discussion_post', object_id: c.pk }">{{ btn.title }}</ReactionButton>
      </template>
    </DiscussionPost>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref, watch } from 'vue'

import ReactionButton from './meeting/ReactionButton.vue'
import RichtextEditor from './widgets/RichtextEditor.vue'
import DiscussionPostVue from './widgets/DiscussionPost.vue'

import { DiscussionPost } from '@/contentTypes/types'
import discussionPostType from '@/contentTypes/discussionPost'
import { useI18n } from 'vue-i18n'
import { dialogQuery, stripHTML } from '@/utils'
import useAgenda from '@/composables/meeting/useAgenda'
import useMeeting from '@/composables/meeting/useMeeting'
import useReactions from '@/composables/meeting/useReactions'

function getTagHTML (tagName?: string): string {
  return tagName ? `<p><span class="mention" data-index="0" data-denotation-char="#" data-id="${tagName}" data-value="${tagName}"><span contenteditable="false"><span class="ql-mention-denotation-char">#</span>${tagName}</span></span>&nbsp;</p>` : ''
}

export default defineComponent({
  inject: ['t'],
  components: {
    DiscussionPost: DiscussionPostVue,
    ReactionButton,
    RichtextEditor
  },
  props: {
    comments: {
      type: Array as PropType<DiscussionPost[]>,
      required: true
    },
    commentInput: Boolean,
    setTag: String,
    allTags: Set as PropType<Set<string>>,
    minLength: {
      type: Number,
      default: 1
    },
    warnLength: {
      type: Number,
      default: 10
    }
  },
  setup (props) {
    const { t } = useI18n()
    const { agendaId } = useAgenda()
    const { meetingId } = useMeeting()
    const { getMeetingButtons } = useReactions()

    const comment = ref(getTagHTML(props.setTag))
    const submitting = ref(false)
    const api = discussionPostType.getContentApi()

    watch(() => props.setTag, value => {
      comment.value = getTagHTML(value)
    })

    const textLength = computed(() => stripHTML(comment.value).length)
    const disabled = computed(() => submitting.value || textLength.value < props.minLength)

    async function submit (override = false) {
      if (disabled.value) return
      if (override || textLength.value >= props.warnLength) {
        submitting.value = true
        try {
          await api.add({
            body: comment.value,
            agenda_item: agendaId.value
          })
          editorComponent.value.setText(getTagHTML(props.setTag))
        } catch (err) {
          console.error(err)
        }
        submitting.value = false
      } else {
        if (await dialogQuery(t('content.warnShorterThan', { length: props.warnLength }))) submit(true)
      }
    }

    const editorComponent = ref<any>(null)
    const reactions = computed(() => getMeetingButtons(meetingId.value, 'discussion_post'))

    return {
      comment,
      disabled,
      reactions,
      editorComponent,
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
