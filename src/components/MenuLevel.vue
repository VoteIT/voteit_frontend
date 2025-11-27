<script setup lang="ts">
import { inject } from 'vue'
import { TreeMenuLink } from '@/utils/types'

const level = inject('menuLevel', 0)

defineProps<{
  links?: TreeMenuLink[]
}>()
</script>

<template>
  <ul class="menu-tree" :class="`level-${level}`">
    <slot>
      <li v-for="(item, i) in links" :key="i" class="link">
        <router-link
          @click="$emit('navigation')"
          class="menu-item"
          :class="{
            'has-new': item.hasNewItems,
            'router-link-exact-only': item.exactActive
          }"
          :to="item.to"
          v-ripple
        >
          <div>
            {{ item.title }}
          </div>
          <span class="icons" v-if="item.icons">
            <v-icon
              v-for="icon in item.icons"
              :key="icon"
              :icon="icon"
              size="x-small"
            />
          </span>
          <span class="count" v-if="typeof item.count === 'number'">
            {{ item.count }}
          </span>
        </router-link>
      </li>
    </slot>
  </ul>
</template>

<style lang="sass" scoped>
ul
  margin-bottom: 8px
  list-style: none

.level-0 > :deep(li)
  border-top: 1px solid rgb(var(--v-theme-app-bar-divider))
  &:first-child
    border-top: 0
  font-size: 12pt
  > a
    padding-top: 7px
    padding-bottom: 7px
</style>
