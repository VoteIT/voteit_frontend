<script
  setup
  lang="ts"
  generic="
    Item extends { text?: string; title?: string; value: Value },
    Value extends string | number
  "
>
withDefaults(
  defineProps<{
    color?: string
    items: Item[]
    modelValue?: Value | null
    loading?: boolean
  }>(),
  {
    color: 'info'
  }
)

defineEmits<{
  (e: 'update:modelValue', value: Value): void
}>()
</script>

<template>
  <v-item-group
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event as Value)"
  >
    <v-item
      v-for="item in items"
      :key="item.value"
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
</template>
