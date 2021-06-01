<template>
  <div class="comments mb-2">
    <DiscussionPost :all-tags="allTags" v-for="c in comments" :key="c.pk" :p="c">
      <template v-slot:buttons>
        <ReactionButton v-for="btn in reactions" :key="btn.pk" :button="btn" :relation="{ content_type: 'discussion_post', object_id: c.pk }">{{ btn.title }}</ReactionButton>
      </template>
    </DiscussionPost>
    <AddContent ref="addContentComponent" v-if="commentInput" :name="t('discussion.discussion')"
                :tags="allTags" :handler="submit" :placeholder="t('discussion.postPlaceholder')"
                :submitText="t('post')" submitIcon="mdi-send" v-model="comment" />
  </div>
</template>

<script lang="ts">
import { ComponentPublicInstance, computed, defineComponent, PropType, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery, stripHTML } from '@/utils'
import AddContent from './meeting/AddContent.vue'
import ReactionButton from './meeting/ReactionButton.vue'
import DiscussionPostVue from './widgets/DiscussionPost.vue'

import useAgenda from '@/composables/meeting/useAgenda'
import useMeeting from '@/composables/meeting/useMeeting'
import useReactions from '@/composables/meeting/useReactions'

import { DiscussionPost } from '@/contentTypes/types'
import discussionPostType from '@/contentTypes/discussionPost'

function getTagHTML (tagName?: string): string {
  return tagName ? `<p><span class="mention" data-index="0" data-denotation-char="#" data-id="${tagName}" data-value="${tagName}"><span contenteditable="false"><span class="ql-mention-denotation-char">#</span>${tagName}</span></span>&nbsp;</p>` : ''
}

export default defineComponent({
  inject: ['t'],
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
          // eslint-disable-next-line no-unused-expressions
          comment.value = getTagHTML(props.setTag)
        } catch (err) {
          console.error(err)
        }
        submitting.value = false
      } else {
        if (await dialogQuery(t('content.warnShorterThan', { length: props.warnLength }))) submit(true)
      }
    }

    function focus () {
      if (addContentComponent.value) addContentComponent.value.focus()
    }

    const addContentComponent = ref<null | ComponentPublicInstance<{ focus:() => void }>>(null)
    const reactions = computed(() => getMeetingButtons(meetingId.value, 'discussion_post'))

    return {
      comment,
      disabled,
      focus,
      reactions,
      addContentComponent,
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
