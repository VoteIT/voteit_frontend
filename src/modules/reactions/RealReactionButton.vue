<template>
  <span class="text-no-wrap">
    <v-btn :prepend-icon="button.icon" size="small" :variant="disabled ? 'tonal' : 'text'" :color="modelValue ? button.color : 'secondary'" :disabled="disabled" @click="emit('update:modelValue', !modelValue)">
      {{ button.title }}
    </v-btn>
    <v-dialog @update:modelValue="$event && emit('listOpen')">
      <template #activator="{ props }">
        <v-btn variant="text" flat size="small" v-bind="props" :disabled="listDisabled || !count" class="reaction-count">
          {{ count }}
        </v-btn>
      </template>
      <template v-slot="{ isActive }">
        <v-sheet class="pa-4">
          <div class="d-flex mb-2">
            <h2 class="flex-grow-1">
              {{ t('reaction.peopleReacted') }}
            </h2>
            <v-btn icon="mdi-close" flat @click="isActive.value = false" class="mt-n2 mr-n2" />
          </div>
          <slot name="userList" />
        </v-sheet>
      </template>
    </v-dialog>
  </span>
</template>

<script lang="ts" setup>
import { PropType } from 'vue'
import { useI18n } from 'vue-i18n'

import { ReactionButton } from './types'

defineProps({
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
</script>

<style lang="sass" scoped>
.reaction-count
  min-width: unset !important
</style>
