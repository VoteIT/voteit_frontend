<template>
  <v-tooltip
    :disabled="!button.description"
    :text="button.description"
    location="top center"
  >
    <template #activator="{ props }">
      <v-btn-group
        v-bind="{ ...props, ...$attrs }"
        :color="button.color"
        :variant="variant"
        class="btn-group"
      >
        <v-btn
          size="small"
          class="pr-2"
          :disabled="disabled"
          :loading="working"
          :prepend-icon="button.icon"
          @click.prevent="emit('update:modelValue', !modelValue)"
        >
          {{ button.title }}
        </v-btn>
        <DefaultDialog
          @update:modelValue="$event && emit('listOpen')"
          :title="$t('reaction.peopleReacted')"
        >
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              class="reaction-count pl-1 pr-2"
              size="small"
              :disabled="listDisabled"
              @click.prevent
            >
              {{ countText }}
              <v-icon v-if="meetsTarget" icon="mdi-check" />
            </v-btn>
          </template>
          <slot name="userList"></slot>
        </DefaultDialog>
      </v-btn-group>
    </template>
  </v-tooltip>
</template>

<script lang="ts" setup>
import { computed } from 'vue'

import DefaultDialog from '@/components/DefaultDialog.vue'
import { ReactionButton } from './types'

const props = defineProps<{
  button: ReactionButton
  count: number
  disabled?: boolean
  listDisabled?: boolean
  working?: boolean
  modelValue?: boolean
}>()

const emit = defineEmits(['update:modelValue', 'listOpen'])

const meetsTarget = computed(() => {
  if (!props.button.target) return
  return props.count >= props.button.target
})
const variant = computed(() => {
  return props.modelValue ? 'flat' : 'tonal'
})
const countText = computed(() => {
  if (!props.button.target || meetsTarget.value) return String(props.count)
  return `${props.count}/${props.button.target}`
})
</script>

<style lang="sass" scoped>
.reaction-count
  min-width: unset !important

.btn-group
  height: 28px !important
</style>
