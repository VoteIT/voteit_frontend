<script
  lang="ts"
  setup
  generic="T extends StateContent, CT extends ContentType<T, any, any>"
>
import { computed, Ref, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { MenuItem, MenuSubheader } from '@/utils/types'
import ContentType from '@/contentTypes/ContentType'
import { Transition as ITransition, StateContent } from '@/contentTypes/types'

type Transition = CT extends ContentType<any, infer T, any> ? T : never

const props = withDefaults(
  defineProps<{
    color?: string
    contentType?: CT
    float?: boolean
    icon?: string
    items?: MenuItem[]
    object?: T
    position?: 'auto' | 'top' | 'bottom'
    showTransitions?: boolean
    size?: 'small' | 'x-small'
  }>(),
  {
    icon: 'mdi-dots-vertical',
    items() {
      return []
    },
    position: 'auto'
  }
)

const { t } = useI18n()

const isOpen = ref(false)
const working = ref(false)
const workflows = props.contentType?.useWorkflows()
const transitionsAvailable: Ref<ITransition<Transition>[] | null> = ref(null)
if (props.showTransitions && (!props.object || !props.contentType)) {
  console.warn(
    'Menu component needs object and contentType to show transitions.'
  )
}

async function makeTransition(transition: Transition) {
  if (!props.contentType || !props.object) return
  working.value = true
  await props.contentType.transitions.make(props.object, transition, t)
  working.value = false
  isOpen.value = false
}

watch(isOpen, async (value) => {
  transitionsAvailable.value = null
  if (!value) return
  if (props.showTransitions && props.contentType && props.object) {
    working.value = true
    transitionsAvailable.value = await props.contentType.transitions.get(
      props.object.pk
    )
    working.value = false
  }
})

const openerAttrs = computed(() => ({
  icon: working.value ? 'mdi-loading' : props.icon,
  color: working.value ? 'secondary' : props.color,
  size: props.size
}))

const currentState = computed(() => {
  if (!workflows || !props.object) return
  return workflows.getState(props.object.state)
})

function isSubheader(item: MenuItem): item is MenuSubheader {
  return item !== '---' && 'subheader' in item
}
</script>

<template>
  <div class="context-menu">
    <v-menu
      v-if="items.length || $slots.top || $slots.bottom || showTransitions"
      location="bottom end"
      v-model="isOpen"
    >
      <template #activator="{ props }">
        <v-badge
          :model-value="!!currentState?.icon"
          color="secondary"
          :icon="currentState?.icon"
        >
          <v-btn v-bind="{ ...props, ...openerAttrs }" variant="text" />
        </v-badge>
      </template>
      <v-list density="comfortable">
        <slot name="top"></slot>
        <template v-for="(item, i) in items" :key="i">
          <v-divider v-if="item === '---'" />
          <v-list-subheader v-else-if="isSubheader(item)">
            {{ item.subheader }}
          </v-list-subheader>
          <v-list-item v-else link v-bind="item" />
        </template>
        <template v-if="transitionsAvailable">
          <v-divider v-if="items.length || $slots.top" />
          <v-list-item
            v-for="t in transitionsAvailable"
            :key="t.name"
            link
            :prepend-icon="t.icon"
            :disabled="working"
            :title="t.title"
            v-bind="props"
            @click="makeTransition(t.name)"
          />
        </template>
        <slot name="bottom"></slot>
      </v-list>
    </v-menu>
  </div>
</template>

<style lang="sass" scoped>
@keyframes rotate
  0%
    transform: rotate(45deg)
  100%
    transform: rotate(405deg)

.mdi-loading
  animation: rotate 2s ease-in-out infinite
</style>
