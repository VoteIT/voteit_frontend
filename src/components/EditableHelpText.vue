<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import { stripHTML } from '@/utils'
import Richtext from './Richtext.vue'
import RichtextEditor from './RichtextEditor.vue'

const props = defineProps<{
  editable?: boolean
  handler?: (value: string) => Promise<any>
  placeholder?: string
  modelValue?: string
}>()
if (props.editable && !props.handler)
  throw new Error('EditableHelpText: handler required with editable property')

const model = ref(props.modelValue ?? '')
const editing = ref(false)

const hasValue = computed(() => !!stripHTML(model.value))
const visible = computed(() => props.editable || hasValue.value)

watch(
  () => props.modelValue,
  (v) => {
    if (editing.value) return
    model.value = v ?? ''
  }
)

async function save() {
  if (!props.handler) return
  await props.handler(stripHTML(model.value).trim() ? model.value : '')
  editing.value = false
}
</script>

<template>
  <v-alert v-if="visible">
    <p v-if="!hasValue && !editing" class="my-1">
      <em>
        {{ placeholder || $t('helpText.defaultPlaceholder') }}
      </em>
    </p>
    <RichtextEditor
      v-if="editing"
      v-model="model"
      variant="full"
      :placeholder="placeholder ?? $t('helpText.defaultPlaceholder')"
      @submit="save"
    />
    <Richtext v-else-if="modelValue" :model-value="modelValue" />
    <div v-if="editable" class="text-right mt-2">
      <v-btn
        v-if="editing"
        size="small"
        :text="$t('cancel')"
        variant="text"
        @click="editing = false"
      />
      <v-btn
        v-if="editing"
        color="primary"
        :disabled="model === modelValue"
        size="small"
        :text="$t('save')"
        @click="save"
      />
      <v-btn
        v-else
        size="small"
        :text="$t('edit')"
        variant="tonal"
        @click="editing = true"
      />
    </div>
  </v-alert>
</template>

<style scoped lang="sass">
:deep(.richtext-editor)
  color: black
</style>
