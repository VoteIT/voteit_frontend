<script
  setup
  lang="ts"
  generic="
    Item extends { text?: string; title?: string; value: Value | null },
    Value extends string | number
  "
>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    color?: string
    items: Item[]
    modelValue?: Value | null
    loading?: boolean
    required?: boolean
  }>(),
  {
    color: 'info'
  }
)

defineEmits<{
  (e: 'update:modelValue', value: Value | null): void
}>()

const { t } = useI18n()

// Null means nothing selected, so items should use another value for "none"
const rules = computed(() =>
  props.required
    ? [(value: Value | null) => value !== null || t('rules.required')]
    : []
)
</script>

<template>
  <v-input :model-value="modelValue" :rules="rules" hide-details="auto">
    <v-item-group
      class="w-100"
      :mandatory="required"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event as Value)"
    >
      <v-item
        v-for="item in items"
        :key="item.value ?? ''"
        :value="item.value"
        v-slot="{ isSelected, toggle }"
      >
        <v-card
          class="my-4"
          :class="{ 'pa-4': isSelected }"
          :color="isSelected ? color : undefined"
          :elevation="isSelected ? 6 : undefined"
          :disabled="loading"
          :title="item.title"
          :text="item.text"
          @click="toggle"
        >
          <template #actions v-if="$slots.actions">
            <slot name="actions" :item="item"></slot>
          </template>
        </v-card>
      </v-item>
    </v-item-group>
  </v-input>
</template>
