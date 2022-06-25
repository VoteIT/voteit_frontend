<template>
  <div class="add-content">
    <v-avatar v-if="author?.meeting_group" icon="mdi-account-multiple" color="secondary" size="small" class="mr-1" />
    <UserAvatar v-else size="small" class="mr-1" :pk="author?.author" />
    <RichtextEditor ref="editorComponent"
      :placeholder="placeholder"
      :disabled="disabled" v-model="text" submit @submit="submit()"
      @focus="active = true"
      >
      <template v-slot:controls>
        <v-expand-transition>
          <TagEdit v-show="active" :setTag="setTag" v-model="tags" class="mt-1" />
        </v-expand-transition>
        <div class="d-flex mt-1">
          <v-spacer />
          <v-btn v-if="active && canPostAs" variant="text" :append-icon="`mdi-chevron-${postAsExpanded ? 'up' : 'down'}`" @click="postAsExpanded = !postAsExpanded" size="small">
            {{ t('proposal.postAs') }}
          </v-btn>
          <v-btn v-if="active" variant="text" @click="reset()" size="small">
            {{ t('cancel') }}
          </v-btn>
          <v-btn color="primary" :disabled="disabled" :prepend-icon="submitIcon" size="small" @click="submit()">
            {{ submitText }}
          </v-btn>
        </div>
        <v-expand-transition>
          <PostAs v-show="active && canPostAs && postAsExpanded" v-model="author" class="mt-1" />
        </v-expand-transition>
      </template>
    </RichtextEditor>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject, PropType, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery, stripHTML } from '@/utils'

import { meetingIdKey } from '@/modules/meetings/injectionKeys'
import useMeetingGroups from '@/modules/meetings/useMeetingGroups'
import PostAs from '@/modules/meetings/PostAs.vue'
import type { Author } from '@/modules/meetings/types'
import { DiscussionPost } from '@/modules/discussions/types'

import RichtextEditor from './RichtextEditor.vue'
import { EditorComponent } from './types'
import TagEdit from './TagEdit.vue'

export default defineComponent({
  name: 'AddContent',
  components: {
    RichtextEditor,
    TagEdit,
    PostAs
},
  props: {
    name: String,
    handler: {
      type: Function as PropType<(post: Partial<DiscussionPost>) => Promise<void>>,
      required: true
    },
    modelValue: {
      type: String,
      default: ''
    },
    submitText: String,
    submitIcon: String,
    placeholder: String,
    minLength: {
      type: Number,
      default: 1
    },
    warnLength: {
      type: Number,
      default: 10
    },
    setTag: String
  },
  setup (props, { emit }) {
    const { t } = useI18n()
    const text = ref(props.modelValue)
    const active = ref(false)
    const submitting = ref(false)

    const tags = ref(props.setTag ? [props.setTag] : [])

    const textLength = computed(() => stripHTML(text.value).length)
    const disabled = computed(() => submitting.value || textLength.value < props.minLength)

    const postAsExpanded = ref(false)
    const author = ref<Author>()

    const meetingId = inject(meetingIdKey)
    if (!meetingId) throw new Error('AddContent requires provided meetingId')
    const { canPostAs } = useMeetingGroups(meetingId)

    function reset (soft = false) {
      if (soft && stripHTML(text.value).length) return // For blur event, only reset if text is empty.
      active.value = false
      postAsExpanded.value = false
      text.value = ''
      tags.value = props.setTag
        ? [props.setTag]
        : []
    }

    async function submit () {
      if (disabled.value) return
      if (textLength.value < props.warnLength) {
        if (!await dialogQuery(t('content.warnShorterThan', { length: props.warnLength }))) return
      }
      submitting.value = true
      try {
        await props.handler({
          body: text.value,
          tags: tags.value,
          ...(author.value || {})
        })
        editorComponent.value?.setText(props.modelValue)
      } catch (err) {
        console.error(err)
      }
      submitting.value = false
      reset()
    }

    function focus () {
      editorComponent.value?.focus()
    }

    const editorComponent = ref<null | EditorComponent>(null)
    watch(text, value => {
      emit('update:modelValue', value)
    })

    return {
      t,
      active,
      author,
      canPostAs,
      disabled,
      editorComponent,
      postAsExpanded,
      tags,
      text,
      focus,
      open,
      reset,
      submit
    }
  }
})
</script>

<style lang="sass">
.add-content
  display: flex
  .richtext-editor
    flex: 1 1 auto
</style>
