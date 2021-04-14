<template>
  <ul class="menu-tree" :class="`level-${level}`">
    <li v-for="(item, i) in items" :key="i" :class="{ open: openMenus.has(i) }">
      <router-link class="menu-item" v-if="item.to" :to="item.to">
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
      </a>
      <transition name="slide-down">
        <MenuTree v-if="item.items" :level="level + 1" :items="item.items" v-show="openMenus.has(i)" />
      </transition>
    </li>
  </ul>
</template>

<script lang="ts">
import { defineComponent, PropType, reactive } from 'vue'

interface MenuItem {
  title: string
  to: string
  icons?: string[]
  count?: number
}

interface Menu {
  title: string
  items: (MenuItem | Menu)[]
  defaultOpen?: boolean
  showCount?: boolean
}

export default defineComponent({
  props: {
    items: {
      type: Array as PropType<(MenuItem | Menu)[]>,
      required: true
    },
    level: {
      type: Number,
      default: 0
    }
  },
  setup (props) {
    const openMenus = reactive<Set<number>>(new Set())
    props.items.forEach((item, index) => {
      if ('defaultOpen' in item && item.defaultOpen) openMenus.add(index)
    })
    function toggleMenu (index: number) {
      if (openMenus.has(index)) return openMenus.delete(index)
      openMenus.add(index)
    }

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
  li.open > a .mdi
    transform: rotate(90deg)

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
    &.router-link-exact-active
      background-color: rgb(var(--v-theme-app-bar-active))

  .menu-item
    margin: 0 6px 0 32px
    display: flex
    font-size: 10.5pt !important
    :first-child
      flex: 1 0 auto
    span
      margin-left: .5em

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
