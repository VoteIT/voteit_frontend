<template>
  <ul class="menu-tree" :class="`level-${level}`">
    <li v-for="(item, i) in items" :key="i" :class="{ open: openMenus.has(i), link: item.to }">
      <router-link class="menu-item" :class="{ 'has-new': item.hasNewItems }" v-if="item.to" :to="item.to" v-ripple>
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
          <template v-if="item.showCount">({{ item.items.length }})</template>
        </div>
        <span v-if="item.count">{{ item.count }}</span>
        <v-icon v-if="item.icon" :icon="item.icon" size="small"/>
      </a>
      <transition name="slide-down">
        <MenuTree v-if="item.items" :level="level + 1" :parent="item" :items="item.items" v-show="openMenus.has(i)" />
      </transition>
    </li>
  </ul>
</template>

<script lang="ts">
import { defineComponent, PropType, reactive, watch } from 'vue'
import { TreeMenu, TreeMenuItem } from '@/utils/types'

export default defineComponent({
  props: {
    items: {
      type: Array as PropType<TreeMenuItem[]>,
      required: true
    },
    level: {
      type: Number,
      default: 0
    },
    parent: Object as PropType<TreeMenu>
  },
  setup (props) {
    const openMenus = reactive<Set<number>>(new Set())

    // Menus can be set to open by default
    props.items.forEach((item, index) => {
      if ('defaultOpen' in item && item.defaultOpen) openMenus.add(index)
    })
    function toggleMenu (index: number) {
      if (openMenus.has(index)) return openMenus.delete(index)
      openMenus.add(index)
    }

    // Open first non-empty submenu dynamically once (data is loaded async)
    let initialized = false
    watch(() => props.items, items => {
      if (initialized || !props.parent?.openFirstNonEmpty || openMenus.size) return // If user has a submenu open, don't meddle
      items.some((item, index) => {
        if ('items' in item && item.items.length) {
          initialized = true
          openMenus.add(index)
          return true
        }
      })
    })

    return {
      openMenus,
      toggleMenu
    }
  }
})
</script>

<style lang="sass">
.slide-down-enter-active
  transition: max-height .2s ease-in
.slide-down-leave-active
  transition: max-height .1s ease-out

.slide-down-enter-from,
.slide-down-leave-to
  max-height: 0 !important

ul.menu-tree
  &:not(.level-0)
    max-height: 2000px
    overflow: hidden
  padding: 0 0 .8em !important
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
      flex: 1 0 auto
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
      flex: 1 0 auto
    span
      margin-left: .5em
    &.has-new
      font-weight: bold

  &.level-0 > li
    border-top: 1px solid rgb(var(--v-theme-app-bar-divider))
    font-size: 12pt
    &:last-child
      border-bottom: 1px solid rgb(var(--v-theme-app-bar-divider))
    > a
      padding-top: 7px
      padding-bottom: 7px

  .level-1 .sub-menu
    text-transform: uppercase
    font-size: 8.5pt !important
    letter-spacing: .08em
    margin-left: 4px
</style>
