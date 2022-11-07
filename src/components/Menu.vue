<template>
  <div class="context-menu">
    <v-menu v-if="items.length || $slots.top || $slots.bottom || showTransitions" location="bottom end" v-model="isOpen">
      <template #activator="{ props }">
        <v-badge :model-value="!!currentState?.icon" color="secondary" :icon="currentState?.icon">
          <v-btn v-bind="{ ...props, ...openerAttrs }" />
        </v-badge>
      </template>
      <v-list density="comfortable">
        <slot name="top" />
        <template v-for="(item, i) in items" :key="i">
          <v-divider v-if="item === '---'" />
          <v-list-subheader v-else-if="isSubheader(item)">
            {{ item.subheader }}
          </v-list-subheader>
          <v-list-item v-else link v-bind="item" />
        </template>
        <template v-if="transitionsAvailable">
          <v-divider v-if="items.length || $slots.top" />
          <v-list-item link :prepend-icon="t.icon" :disabled="working" v-for="t in transitionsAvailable" :key="t.name" @click="makeTransition(t)" :title="t.title" />
        </template>
        <slot name="bottom" />
      </v-list>
    </v-menu>
  </div>
</template>

<script lang="ts" setup>
import { computed, PropType, ref, watch } from 'vue'

import ContentType from '@/contentTypes/ContentType'
import { StateContent, Transition } from '@/contentTypes/types'
import { MenuItem, MenuSubheader } from '@/utils/types'

const props = defineProps({
  items: {
    type: Array as PropType<MenuItem[]>,
    default: () => []
  },
  color: String,
  icon: {
    type: String,
    default: 'mdi-dots-vertical'
  },
  size: String as PropType<'small' | 'x-small'>,
  showTransitions: Boolean,
  object: Object as PropType<StateContent>,
  contentType: Object as PropType<ContentType>,
  float: Boolean,
  position: {
    type: String as PropType<'auto' | 'top' | 'bottom'>,
    default: 'auto'
  }
})

const isOpen = ref(false)
const working = ref(false)
const workflows = props.contentType?.useWorkflows()
const transitionsAvailable = ref<Transition[] | null>(null)
if (props.showTransitions && (!props.object || !props.contentType)) {
  console.warn('Menu component needs object and contentType to show transitions.')
}

watch(isOpen, async (value) => {
  transitionsAvailable.value = null
  if (!value) return
  if (props.showTransitions && props.contentType && props.object) {
    working.value = true
    transitionsAvailable.value = await props.contentType.api.getTransitions(props.object.pk)
    working.value = false
  }
})

const openerAttrs = computed(() => {
  return {
    icon: working.value ? 'mdi-loading' : props.icon,
    variant: 'text',
    color: working.value ? 'secondary' : props.color,
    size: props.size
  }
})

const currentState = computed(() => {
  if (!workflows || !props.object) return
  return workflows.getState(props.object.state)
})

async function makeTransition (t: Transition) {
  if (!props.contentType || !props.object || !t.name) return
  working.value = true
  await props.contentType.api.transition(props.object.pk, t.name)
  working.value = false
  isOpen.value = false
}

function isSubheader (item: MenuItem): item is MenuSubheader {
  return item !== '---' && 'subheader' in item
}
</script>

<style lang="sass" scoped>
@keyframes rotate
  0%
    transform: rotate(45deg)
  100%
    transform: rotate(405deg)

.mdi-loading
  animation: rotate 2s ease-in-out infinite
</style>
