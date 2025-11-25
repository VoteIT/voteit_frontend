<script setup lang="ts">
import { isEqual } from 'lodash'
import { computed, reactive, watch } from 'vue'

import Richtext from '@/components/Richtext.vue'
import useDefaults from '@/composables/useDefaults'
import WorkflowState from '@/components/WorkflowState.vue'
import TagEdit from '@/components/TagEdit.vue'
import RichtextEditor from '@/components/RichtextEditor.vue'
import Headline from '@/components/Headline.vue'

import { getHTMLTags } from '../meetings/useTags'
import { AgendaItem } from './types'
import { agendaItemType } from './contentTypes'

const props = defineProps<{
  agendaItem: AgendaItem
  body?: string // May load later
  canEdit?: boolean
  editing?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:editing', value: boolean): void
}>()

const { collapsedBodyHeight } = useDefaults()

const extraTags = computed(() => {
  if (!props.body) return []
  const docTags = getHTMLTags(props.body)
  return props.agendaItem.tags.filter((tag) => !docTags.has(tag))
})

const article = computed(() => ({
  body: props.body ?? '',
  tags: extraTags.value,
  title: props.agendaItem.title
}))

const form = reactive({
  submitting: false,
  ...article.value
})

watch(article, (value) => {
  Object.assign(form, value)
})

const articleModified = computed(
  () =>
    form.title !== props.agendaItem.title ||
    form.body !== props.body ||
    !isEqual(form.tags, props.agendaItem.tags)
)

function cancelEdit() {
  emit('update:editing', false)
  form.body = props.body ?? ''
  form.tags = extraTags.value
  form.title = props.agendaItem.title
}

async function save() {
  if (!articleModified.value) return
  form.submitting = true
  const { submitting, ...content } = form
  try {
    await agendaItemType.update(props.agendaItem.pk, { ...content })
    emit('update:editing', false)
  } catch {} // TODO
  form.submitting = false
}
</script>

<template>
  <div v-if="editing" class="mt-6 mb-8">
    <Headline v-model="form.title" class="mb-2" editing @submit="save" />
    <RichtextEditor
      v-model="form.body"
      class="mb-2"
      variant="full"
      @keydown.ctrl.enter="save"
    />
    <TagEdit
      v-model="form.tags"
      class="mb-2"
      :label="$t('agenda.tagEditInfo')"
    />
    <div class="text-right">
      <v-btn variant="text" :text="$t('cancel')" @click="cancelEdit" />
      <v-btn
        color="primary"
        :disabled="!articleModified"
        :loading="form.submitting"
        :text="$t('save')"
        @click="save"
      />
    </div>
  </div>
  <div v-else class="mb-8">
    <div class="d-flex">
      <div class="flex-grow-1">
        <WorkflowState
          :admin="canEdit"
          :content-type="agendaItemType"
          :object="agendaItem"
        />
        <h1>{{ agendaItem.title }}</h1>
      </div>
      <slot name="appendTitle"></slot>
    </div>
    <Richtext v-if="body" :value="body" :maxHeight="collapsedBodyHeight" />
  </div>
</template>
