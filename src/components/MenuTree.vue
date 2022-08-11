<template>
  <ul class="menu-tree" :class="`level-${level}`">
    <li v-if="slotBefore && $slots[slotBefore]">
      <slot :name="slotBefore" />
    </li>
    <li v-for="(item, i) in items" :key="i" :class="{ open: openMenus.has(i), link: item.to }">
      <router-link @click="$emit('navigation')" class="menu-item" :class="{ 'has-new': item.hasNewItems }" v-if="item.to" :to="item.to" v-ripple>
        <div>
          {{ item.title }}
        </div>
        <span class="icons" v-if="item.icons">
          <v-icon v-for="icon in item.icons" :key="icon" :icon="icon" size="x-small" />
        </span>
        <span class="count" v-if="typeof item.count === 'number'">
          {{ item.count }}
        </span>
      </router-link>
      <a href="#" v-else class="sub-menu" @click.prevent="toggleMenu(i)">
        <div>
          <v-icon :size="level ? 'x-small' : 'small'" left icon="mdi-chevron-right"/>
          {{ item.title }}
          <template v-if="item.showCount && item.showCountTotal !== undefined && item.showCountTotal !== item.items.length">({{ item.items.length }}/{{ item.showCountTotal }})</template>
          <template v-else-if="item.showCount">({{ item.items.length }})</template>
        </div>
        <span v-if="item.count">{{ item.count }}</span>
        <v-icon v-if="item.icon" :icon="item.icon" size="small"/>
      </a>
      <v-expand-transition>
        <MenuTree v-if="item.items" @hasActive="childHasActive(i)" @navigation="$emit('navigation')" :level="level + 1" v-bind="item" v-show="openMenus.has(i)">
          <template v-for="component, slot in $slots" :key="slot" v-slot:[slot]>
            <component :is="component" />
          </template>
        </MenuTree>
      </v-expand-transition>
    </li>
    <li v-if="slotAfter">
      <slot :name="slotAfter" />
    </li>
  </ul>
</template>

<script lang="ts">
import { defer } from 'lodash'
import { computed, defineComponent, PropType, reactive, watch } from 'vue'
import { useRoute } from 'vue-router'

import { TreeMenu, TreeMenuItem } from '@/utils/types'
import TypedEvent from '@/utils/TypedEvent'

export default defineComponent({
  emits: ['navigation', 'hasActive'],
  props: {
    title: String,
    items: {
      type: Array as PropType<TreeMenuItem[]>,
      required: true
    },
    defaultOpen: Boolean,
    openFirstNonEmpty: Boolean,
    showCount: Boolean,
    icon: String,
    openEvent: Object as PropType<TypedEvent>,
    loadedEvent: Object as PropType<TypedEvent>,
    slotAfter: String,
    slotBefore: String,
    level: {
      type: Number,
      default: 0
    }
  },
  setup (props, { emit }) {
    const route = useRoute()
    const openMenus = reactive<Set<number>>(new Set())

    // Typescript-check if item is a submenu
    const isSubMenu = (item: TreeMenuItem): item is TreeMenu => 'items' in item

    // Menus can be set to open by default
    props.items.forEach((item, index) => {
      if (!isSubMenu(item)) return
      if (item.defaultOpen) openMenus.add(index)
      // Listen to opening events
      item.openEvent?.on(() => openMenus.add(index))
    })
    props.loadedEvent?.on(() => {
      if (props.openFirstNonEmpty) defer(openFirstNonEmpty)
    })
    // Default open on new items?
    watch(() => props.items, (items, oldItems) => {
      items.forEach((item, index) => {
        if (isSubMenu(item) && !oldItems.includes(item) && item.defaultOpen) openMenus.add(index)
      })
    })
    function toggleMenu (index: number) {
      if (openMenus.has(index)) return openMenus.delete(index)
      openMenus.add(index)
    }

    function openFirstNonEmpty () {
      // Only if none open already
      if (openMenus.size) return
      for (const [index, item] of props.items.entries()) {
        if ('items' in item && item.items.length) return openMenus.add(index)
      }
    }

    const hasActive = computed(() => props.items.some(item => 'to' in item && item.to === route.path))
    watch(hasActive, value => {
      if (value) emit('hasActive')
    }, { immediate: true })

    function childHasActive (index: number) {
      openMenus.add(index)
      emit('hasActive')
    }

    return {
      openMenus,
      childHasActive,
      toggleMenu
    }
  }
})
</script>

<style lang="sass">
ul.menu-tree
  margin-bottom: 8px
  .mdi
    transition: transform .2s
  li.open > a .mdi-chevron-right
    transform: rotate(90deg)
  li.link
    margin-bottom: 6px
    &:last-child
      margin-bottom: 0

  a
    color: rgb(var(--v-theme-on-app-bar))
    display: flex
    text-decoration: none
    padding: 5px 10px 5px 4px
    padding-right: 1em
    border-radius: 5px
    div
      flex: 1 1 auto
    span
      font-size: 10.5pt

  .menu-item
    background-color: rgba(var(--v-theme-surface), .08)
    margin: 0 6px 0 32px
    display: flex
    font-size: 10.5pt !important
    transition: background-color .2s
    &.router-link-exact-active
      background-color: rgb(var(--v-theme-app-bar-active))
    :first-child
      flex: 1 1 auto
    span
      margin-left: .5em
    &.has-new
      font-weight: bold

  &.level-0 > li
    border-top: 1px solid rgb(var(--v-theme-app-bar-divider))
    &:first-child
      border-top: 0
    font-size: 12pt
    > a
      padding-top: 7px
      padding-bottom: 7px

  .level-1 .sub-menu
    text-transform: uppercase
    font-size: 8.5pt !important
    letter-spacing: .08em
    margin-left: 4px
</style>
