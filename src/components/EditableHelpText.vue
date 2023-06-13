<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { stripHTML } from '@/utils'
import Richtext from './Richtext.vue'

const props = defineProps<{
  editable?: boolean
  handler?:(value: string) => Promise<any>
  placeholder?: string
  modelValue?: string
}>()
if (props.editable && !props.handler) throw new Error('EditableHelpText: handler required with editable property')

const { t } = useI18n()

const model = ref(props.modelValue ?? '')
const editing = ref(false)

const hasValue = computed(() => !!stripHTML(model.value))
const visible = computed(() => props.editable || hasValue.value)

watch(() => props.modelValue, v => {
  if (editing.value) return
  model.value = v ?? ''
})

async function save () {
  if (!props.handler) return
  await props.handler(
    stripHTML(model.value).trim()
      ? model.value
      : ''
  )
  editing.value = false
}
</script>

<template>
  <v-alert v-if="visible">
    <p v-if="!hasValue && !editing" class="my-1">
      <em>
        {{ placeholder || t('helpText.defaultPlaceholder') }}
      </em>
    </p>
    <Richtext
      v-if="hasValue || editing"
      v-model="model"
      variant="full"
      :editing="editing"
      :placeholder="placeholder || t('helpText.defaultPlaceholder')"
      @edit-done="save"
    />
    <div class="text-right mt-2">
      <v-btn
        v-if="editable && !editing"
        size="small"
        variant="tonal"
        @click="editing = true"
      >
        Ändra
      </v-btn>
    </div>
  </v-alert>
</template>

<style scoped lang="sass">
:deep(.richtext-editor)
  color: black
</style>
