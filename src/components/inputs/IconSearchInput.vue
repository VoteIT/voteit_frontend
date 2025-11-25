<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    label?: string
    rules?: ((value: any) => true | string)[]
    modelValue?: string
    suggestions?: string[]
  }>(),
  {
    suggestions: () => [
      'thumb-up',
      'thumb-down',
      'star',
      'heart',
      'forum',
      'check',
      'cancel',
      'wheelchair-accessibility',
      'alert',
      'attachment',
      'pencil',
      'currency-eur'
    ]
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value?: string): void
}>()

const selectedIcon = shallowRef(props.modelValue?.slice(4))
const mdiIcon = computed(() =>
  selectedIcon.value ? 'mdi-' + selectedIcon.value : undefined
)
watch(mdiIcon, (value) => emit('update:modelValue', value))

const searchQuery = shallowRef<string>()

function hasSelectorText(
  rule: CSSRule
): rule is CSSRule & { selectorText: string } {
  return 'selectorText' in rule
}

function* iterMdiRules() {
  const regex = /^mdi-([\w\-]+)::before$/

  for (const sheet of document.styleSheets) {
    // Some stylesheets may be cross-origin and throw if accessed
    try {
      for (const rule of sheet.cssRules) {
        if (!hasSelectorText(rule) || !rule.selectorText) continue
        const selectors = rule.selectorText.split(',')
        for (const selector of selectors) {
          for (const part of selector.trim().split(/\s+/)) {
            if (!part.startsWith('.')) continue
            const className = part.slice(1)
            const search = regex.exec(className)
            if (search) yield search[1]
          }
        }
      }
    } catch (e) {
      // Ignore cross-origin errors
    }
  }
}

const allAvailable = [...iterMdiRules()]

const iconList = computed(() => {
  const query = searchQuery.value?.toLocaleLowerCase() ?? ''
  if (query.length >= 3)
    return allAvailable.filter((name) => name.includes(query))
  return props.suggestions
})
</script>

<template>
  <div>
    <v-label v-if="label" :text="label" />
    <v-autocomplete
      class="mb-2"
      clearable
      :items="iconList"
      hide-details
      label="Sök ikoner"
      density="comfortable"
      prepend-inner-icon="mdi-magnify"
      variant="solo-filled"
      v-model="selectedIcon"
      v-model:search="searchQuery"
      :rules="rules"
    >
      <template #prepend>
        <slot name="icon" :icon="mdiIcon">
          <v-sheet class="pa-2" color="grey-darken-3" rounded>
            <v-icon :icon="mdiIcon" size="x-large" />
          </v-sheet>
        </slot>
      </template>
      <template #item="{ props }">
        <v-list-item :prepend-icon="'mdi-' + props.value" v-bind="props" />
      </template>
    </v-autocomplete>
    <div class="d-flex flex-wrap ga-1">
      <p class="mr-4">{{ $t('content.suggestions') }}:</p>
      <v-icon
        v-for="icon in suggestions"
        :icon="'mdi-' + icon"
        @click="selectedIcon = icon"
      />
    </div>
  </div>
</template>
