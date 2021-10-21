<template>
  <span class="context-menu" :class="{ float }" ref="elem" v-if="items.length || $slots.top || $slots.bottom || showTransitions">
    <v-badge :model-value="!!currentState?.icon" color="secondary" :icon="currentState?.icon">
      <v-btn v-bind="openerAttrs" @click="isOpen = !isOpen"/>
    </v-badge>
    <v-sheet rounded elevation="4" v-show="isOpen" ref="overlay" :class="{ onTop }">
      <v-list nav density="comfortable">
        <slot name="top"/>
        <template v-for="(item, i) in items" :key="i">
          <v-divider v-if="item === '---'" />
          <v-list-subheader v-else-if="item.subheader">
            {{ item.subheader }}
          </v-list-subheader>
          <v-list-item v-else :prepend-icon="item.icon" :color="item.color" :disabled="item.disabled || working" @click="clickItem(item)" :title="item.title" :subtitle="item.subtitle" />
        </template>
        <template v-if="transitionsAvailable">
          <v-divider v-if="items.length || $slots.top" />
          <v-list-item :prepend-icon="t.icon" :disabled="working" v-for="t in transitionsAvailable" :key="t.name" @click="makeTransition(t)">
            {{ t.title }}
          </v-list-item>
        </template>
        <slot name="bottom"/>
      </v-list>
    </v-sheet>
  </span>
</template>

<script lang="ts">
/* eslint-disable no-unused-expressions */
import { ComponentPublicInstance, computed, defineComponent, nextTick, onBeforeUnmount, onMounted, PropType, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { onClickOutside } from '@vueuse/core'

import ContentType from '@/contentTypes/ContentType'
import { StateContent, Transition } from '@/contentTypes/types'
import { MenuItem, MenuItemOnClick, MenuItemTo } from '@/utils/types'

export default defineComponent({
  props: {
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
    contentType: Object as PropType<ContentType<any>>,
    float: Boolean,
    position: {
      type: String as PropType<'auto' | 'top' | 'bottom'>,
      default: 'auto'
    }
  },
  setup (props) {
    const router = useRouter()
    const isOpen = ref(false)
    const onTop = ref(false)
    const elem = ref<HTMLElement | null>(null)
    const working = ref(false)
    const workflows = props.contentType?.useWorkflows()
    const transitionsAvailable = ref<Transition[] | null>(null)
    if (props.showTransitions && (!props.object || !props.contentType)) {
      console.warn('Menu component needs object and contentType to show transitions.')
    }

    onClickOutside(elem, () => {
      isOpen.value = false
    })

    function focusFirst (where: HTMLElement | null, query = 'button') {
      nextTick(() => {
        where?.querySelector<HTMLElement>(query)?.focus()
      })
    }

    const overlay = ref<ComponentPublicInstance | null>(null)
    watch(isOpen, async (value) => {
      transitionsAvailable.value = null
      if (!value) return
      if (props.showTransitions && props.contentType && props.object) {
        const api = props.contentType.getContentApi()
        working.value = true
        transitionsAvailable.value = await api.getTransitions(props.object.pk)
        working.value = false
      }
      onTop.value = props.position === 'top'
      nextTick(() => {
        if (!overlay.value || props.position !== 'auto') return
        const elem = overlay.value.$el as HTMLElement
        const rect = elem.getBoundingClientRect()
        onTop.value = rect.bottom > window.innerHeight
      })
      focusFirst(overlay.value?.$el, '.v-list-item')
    })

    const openerAttrs = computed(() => {
      return {
        icon: working.value ? 'mdi-loading' : props.icon,
        variant: 'text',
        outlined: isOpen.value,
        color: working.value ? 'secondary' : props.color,
        size: props.size
      }
    })

    async function clickItem (item: MenuItemOnClick | MenuItemTo) {
      if ('to' in item) {
        router.push(item.to)
      } else {
        working.value = true
        await item.onClick()
        working.value = false
      }
      isOpen.value = false
    }

    const currentState = computed(() => {
      if (!workflows || !props.object) return
      return workflows.getState(props.object.state)
    })

    async function makeTransition (t: Transition) {
      if (!props.contentType || !props.object || !t.name) return
      const api = props.contentType.getContentApi()
      working.value = true
      await api.transition(props.object.pk, t.name)
      working.value = false
      isOpen.value = false
      focusFirst(elem.value)
    }

    function focusNextSibling (elem: HTMLElement | null, reverse = false) {
      while (elem) {
        elem = (reverse ? elem.previousElementSibling : elem.nextElementSibling) as HTMLElement
        if (elem && elem.tabIndex >= 0) return elem.focus()
      }
    }

    function keyWatch (evt: KeyboardEvent) {
      if (isOpen.value) {
        const focusEl = overlay.value?.$el.querySelector(':focus')
        if (focusEl) {
          switch (evt.key) {
            case 'Escape':
              isOpen.value = false
              focusFirst(elem.value)
              break
            case 'ArrowUp':
              // (focusedEl.previousElementSibling as HTMLElement)?.focus()
              focusNextSibling(focusEl, true)
              evt.preventDefault()
              break
            case 'ArrowDown':
              focusNextSibling(focusEl)
              evt.preventDefault()
              break
          }
        }
      }
    }
    onMounted(() => {
      elem.value?.addEventListener('keydown', keyWatch)
    })
    onBeforeUnmount(() => {
      elem.value?.removeEventListener('keydown', keyWatch)
    })

    return {
      currentState,
      elem,
      isOpen,
      onTop,
      openerAttrs,
      overlay,
      transitionsAvailable,
      working,
      clickItem,
      makeTransition
    }
  }
})
</script>

<style lang="sass">
@keyframes rotate
  0%
    transform: rotate(45deg)
  100%
    transform: rotate(405deg)

.context-menu
  position: relative
  &.float
    float: right
  display: inline-block
  .v-sheet
    max-height: calc(100vh - 80px)
    overflow-y: auto
    background-color: rgb(var(--v-theme-surface))
    z-index: 100
    position: absolute
    min-width: 200px
    margin-top: .1em
    right: 0
    &.onTop
      bottom: 50px
    .v-list-item
      white-space: nowrap
      .v-icon
        font-size: 16pt
  .mdi-loading
    animation: rotate 2s ease-in-out infinite
</style>
