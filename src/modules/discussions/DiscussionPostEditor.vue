<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { dialogQuery, stripHTML } from '@/utils'

import RichtextEditor from '@/components/RichtextEditor.vue'
import TagEdit from '@/components/TagEdit.vue'
import type { EditorComponent } from '@/components/types'

import useMeetingGroups from '../meetings/useMeetingGroups'
import PostAs from '../meetings/PostAs.vue'
import useMeeting from '../meetings/useMeeting'
import type { Author } from '../meetings/types'

import type { DiscussionPost } from './types'

const props = withDefaults(
  defineProps<{
    name?: string
    handler (post: Partial<DiscussionPost>): Promise<void>
    modelValue?: string
    submitIcon?: string
    submitText?: string
    placeholder?: string
    minLength?: number
    warnLength?: number
    setTag?: string
  }>(), {
  modelValue: '',
  minLength: 1,
  warnLength: 10
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const { meetingId } = useMeeting()

const active = ref(false)
const author = ref<Author>()
const postAsExpanded = ref(false)
const submitting = ref(false)
const tags = ref(props.setTag ? [props.setTag] : [])
const text = ref(props.modelValue)

const disabled = computed(() => submitting.value || textLength.value < props.minLength)
const textLength = computed(() => stripHTML(text.value).length)

if (!meetingId) throw new Error('AddContent requires provided meetingId')
const { canPostAs } = useMeetingGroups(meetingId)

function reset () {
  active.value = false
  postAsExpanded.value = false
  editorComponent.value?.setText('')
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
    reset()
  } catch (err) {
    console.error(err)
  }
  submitting.value = false
}

const editorComponent = ref<null | EditorComponent>(null)
watch(text, value => {
  emit('update:modelValue', value)
})

function textHasMention (id: number) {
  const div = document.createElement('div')
  div.innerHTML = text.value
  return !!div.querySelector(`[data-id='${id}']`)
}

defineExpose({
  focus: () => editorComponent.value?.focus(),
  addTag (...addTags: string[]) {
    for (const tag of addTags) {
      if (tags.value.includes(tag)) continue
      tags.value = [...tags.value, tag]
    }
  },
  setMention ({ id, value }: { id: number, value: string }) {
    if (textHasMention(id)) return
    const mention = document.createElement('span')
    mention.classList.add('mention')
    Object.assign(mention.dataset, {
      id,
      index: 0,
      denotationChar: '@',
      value,
    })
    // No need to add inner span w contentEditable="false".
    // Quill Mention will do that automatically.
    mention.textContent = '@' + value
    editorComponent.value?.setText(
      textLength.value
        ? `<p>${mention.outerHTML}</p>${text.value}`
        : `<p>${mention.outerHTML} </p>`
    )
  }
})
</script>

<template>
  <div class="d-flex">
    <v-avatar v-if="author?.meeting_group" icon="mdi-account-multiple" color="secondary" size="small" class="mr-1" />
    <UserAvatar v-else size="small" class="mr-1" :pk="author?.author" />
    <RichtextEditor ref="editorComponent"
      :placeholder="placeholder"
      :disabled="disabled" v-model="text" submit @submit="submit"
      @focus="active = true"
      class="flex-grow-1"
      >
      <template #controls>
        <v-expand-transition>
          <TagEdit v-show="active" :setTag="setTag" v-model="tags" class="mt-1" />
        </v-expand-transition>
        <br/>
        <PostAs v-show="active && canPostAs" v-model="author" class="mt-1" />
        <div class="d-flex mt-1">
          <v-spacer />
          <v-btn v-if="active" variant="text" @click="reset" size="small">
            {{ t('cancel') }}
          </v-btn>
          <v-btn color="primary" :loading="submitting" :disabled="disabled" :prepend-icon="submitIcon" size="small" @click="submit">
            {{ submitText }}
          </v-btn>
        </div>
      </template>
    </RichtextEditor>
  </div>
</template>
