<template>
  <v-btn-group
    :color="modelValue ? button.color : 'secondary'"
    :variant="variant"
    class="btn-group"
  >
    <v-btn
      size="small"
      class="pr-2"
      :disabled="disabled"
      :prepend-icon="button.icon"
      @click.prevent="emit('update:modelValue', !modelValue)"
    >
      {{ button.title }}
    </v-btn>
    <DefaultDialog @update:modelValue="$event && emit('listOpen')" :title="t('reaction.peopleReacted')">
      <template #activator="{ props }">
        <v-btn
          v-bind="props"
          class="reaction-count pl-2"
          size="small"
          :disabled="disabled || listDisabled"
          @click.prevent
        >
          {{ count }}
        </v-btn>
      </template>
      <slot name="userList"></slot>
    </DefaultDialog>
  </v-btn-group>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import DefaultDialog from '@/components/DefaultDialog.vue'
import { ReactionButton } from './types'

interface Props {
  button: ReactionButton
  count: number
  disabled?: boolean,
  listDisabled?: boolean,
  modelValue?: boolean
}
const props = defineProps<Props>()

const emit = defineEmits(['update:modelValue', 'listOpen'])

const { t } = useI18n()

const meetsTarget = computed(() => !!props.button.target && props.count >= props.button.target)
const variant = computed(() => {
  return meetsTarget.value
      ? 'flat'
      : 'tonal'
})
</script>

<style lang="sass" scoped>
.reaction-count
  min-width: unset !important

.btn-group
  height: 28px !important
</style>
