<template>
  <span class="context-menu" :class="{ float }" ref="elem" v-if="items.length || $slots.top || $slots.bottom || showTransitions">
    <v-btn :outlined="isOpen" :color="working ? 'secondary' : color" :icon="working ? 'mdi-loading' : 'mdi-dots-horizontal'" @click="isOpen = !isOpen"/>
    <v-sheet rounded elevation="4" v-show="isOpen" ref="overlay" :class="{ onTop }">
      <slot name="top"/>
      <template v-for="(item, i) in items" :key="i">
        <v-divider v-if="item === '---'" />
        <v-btn v-else :color="item.color || 'accent'" plain block :disabled="item.disabled || working" @click="clickItem(item)">
          <v-icon v-if="item.icon" left :icon="item.icon"/>
          {{ item.text }}
        </v-btn>
      </template>
      <template v-if="statesAvailable">
        <v-divider v-if="items.length || $slots.top" />
        <v-btn plain block color="accent" :disabled="working" v-for="s in statesAvailable" :key="s.state" @click="makeTransition(s)">
          <v-icon left :icon="s.icon" />
          {{ t(`workflowState.${s.state}`) }}
        </v-btn>
      </template>
      <slot name="bottom"/>
    </v-sheet>
  </span>
</template>

<script lang="ts">
import useClickControl from '@/composables/useClickControl'
import ContentType from '@/contentTypes/ContentType'
import { WorkflowState } from '@/contentTypes/types'
import { MenuItem, MenuDescriptor } from '@/utils/types'
import { ComponentPublicInstance, defineComponent, nextTick, PropType, ref, watch } from 'vue'

export default defineComponent({
  inject: ['t'],
  props: {
    items: {
      type: Array as PropType<MenuItem[]>,
      default: () => []
    },
    color: {
      type: String,
      default: 'primary'
    },
    showTransitions: Boolean,
    contentType: Object as PropType<ContentType<any>>,
    contentPk: Number,
    float: Boolean
  },
  setup (props) {
    const isOpen = ref(false)
    const onTop = ref(false)
    const elem = ref<HTMLElement | null>(null)
    const working = ref(false)
    const statesAvailable = ref<WorkflowState[] | null>(null)

    useClickControl({
      element: elem,
      callback: () => {
        isOpen.value = false
      }
    })

    const overlay = ref<ComponentPublicInstance | null>(null)
    watch(isOpen, async (value) => {
      if (!value) return
      if (props.showTransitions && props.contentType && props.contentPk && !statesAvailable.value) {
        const api = props.contentType.getContentApi()
        working.value = true
        statesAvailable.value = await api.getTransitions(props.contentPk)
        working.value = false
      }
      onTop.value = false
      nextTick(() => {
        if (!overlay.value) return
        const elem = overlay.value.$el as HTMLElement
        const rect = elem.getBoundingClientRect()
        onTop.value = rect.bottom > window.innerHeight
      })
    })

    async function clickItem (item: MenuDescriptor) {
      working.value = true
      await item.onClick()
      working.value = false
      isOpen.value = false
    }

    async function makeTransition (s: WorkflowState) {
      if (!props.contentType || !props.contentPk || !s.transition) return
      const api = props.contentType.getContentApi()
      working.value = true
      await api.transition(props.contentPk, s.transition)
      statesAvailable.value = null
      working.value = false
      isOpen.value = false
    }

    return {
      onTop,
      clickItem,
      elem,
      isOpen,
      makeTransition,
      overlay,
      statesAvailable,
      working
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
    z-index: 99
    position: absolute
    min-width: 200px
    top: 50px
    right: 0
    background-color: rgb(var(--v-theme-surface))
    &.onTop
      top: unset
      bottom: 50px
    button
      justify-content: left
      white-space: nowrap
  .mdi-loading
    animation: rotate 2s ease-in-out infinite
</style>
