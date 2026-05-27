<script setup lang="ts">
import { isEqual } from 'lodash'
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { parseRestError } from '@/utils/restApi'
import { RestError } from '@/utils/types'
import useDefaults from '@/composables/useDefaults'
import useRules from '@/composables/useRules'
import Richtext from '@/components/Richtext.vue'
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

const { t } = useI18n()
const rules = useRules(t)
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
  errors: null as RestError<(typeof article)['value']> | null,
  submitting: false,
  ...article.value
})

watch(
  article,
  (value) => {
    Object.assign(form, value)
  },
  { deep: true }
)

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
  form.errors = null
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { errors, submitting, ...content } = form
  try {
    await agendaItemType.api.patch(props.agendaItem.pk, { ...content })
    emit('update:editing', false)
  } catch (e) {
    form.errors = parseRestError(e)
  } finally {
    form.submitting = false
  }
}
</script>

<template>
  <div v-if="editing" class="mt-6 mb-8">
    <Headline
      v-model="form.title"
      editing
      :error-messages="form.errors?.title"
      :rules="[rules.required]"
      @submit="save"
    />
    <RichtextEditor
      :error-messages="form.errors?.body"
      variant="full"
      v-model="form.body"
      @keydown.ctrl.enter="save"
    />
    <TagEdit
      :error-messages="form.errors?.tags"
      :label="$t('agenda.tagEditInfo')"
      v-model="form.tags"
    />
    <v-expand-transition>
      <div v-if="form.errors?.non_field_errors">
        <v-alert
          class="mb-3"
          :text="form.errors.non_field_errors.join(', ')"
          type="error"
        />
      </div>
    </v-expand-transition>
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
