<template>
  <span class="text-no-wrap">
    <v-btn :prepend-icon="button.icon" size="small" :variant="variant" :color="modelValue ? button.color : 'secondary'" :disabled="disabled" @click="emit('update:modelValue', !modelValue)">
      {{ button.title }}
    </v-btn>
    <DefaultDialog @update:modelValue="$event && emit('listOpen')" :title="t('reaction.peopleReacted')">
      <template #activator="{ props }">
        <v-btn variant="text" flat size="small" v-bind="props" :disabled="listDisabled || !count" class="reaction-count">
          {{ count }}
        </v-btn>
      </template>
      <slot name="userList" />
    </DefaultDialog>
  </span>
</template>

<script lang="ts" setup>
import { computed, PropType } from 'vue'
import { useI18n } from 'vue-i18n'

import DefaultDialog from '@/components/DefaultDialog.vue'
import { ReactionButton } from './types'

const props = defineProps({
  button: {
    type: Object as PropType<ReactionButton>,
    required: true
  },
  count: {
    type: Number,
    required: true
  },
  disabled: Boolean,
  listDisabled: Boolean,
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'listOpen'])

const { t } = useI18n()

const meetsTarget = computed(() => !!props.button.target && props.count >= props.button.target)
const variant = computed(() => {
  return meetsTarget.value
    ? 'flat'
    : props.disabled
      ? 'tonal'
      : 'text'
})
</script>

<style lang="sass" scoped>
.reaction-count
  min-width: unset !important
</style>
