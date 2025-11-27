<script setup lang="ts">
import { computed, inject, provide, shallowRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { TreeMenuLink } from '@/utils/types'
import TypedEvent from '@/utils/TypedEvent'
import MenuLevel from './MenuLevel.vue'

const level = inject('menuLevel', 0)
provide('menuLevel', level + 1)

const props = withDefaults(
  defineProps<{
    autoOpen?: boolean
    icon?: string
    links?: TreeMenuLink[]
    modelValue?: boolean
    openEvent?: TypedEvent
    title: string
  }>(),
  { modelValue: false }
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'activated'): void
}>()

const router = useRouter()
const route = useRoute()

const isOpen = shallowRef(props.modelValue)
watch(
  () => props.modelValue,
  (value) => {
    isOpen.value = value
  }
)
watch(isOpen, (value) => emit('update:modelValue', value), { immediate: true })
// Listen to open event if available
props.openEvent?.on(() => (isOpen.value = true))

const hasActiveLink = computed(() => {
  return props.links?.some(
    (item) => router.resolve(item.to).fullPath === route.path
  )
})
watch(
  hasActiveLink,
  (value) => {
    if (props.autoOpen && value) {
      isOpen.value = true
      emit('activated')
    }
  },
  { immediate: true }
)
</script>

<template>
  <a href="#" class="d-flex sub-menu" @click.prevent="isOpen = !isOpen">
    <div class="flex-grow-1">
      <v-icon
        :class="{ isOpen }"
        :size="level ? 'x-small' : 'small'"
        left
        icon="mdi-chevron-right"
      />
      {{ title }}
      <slot name="appendTitle"></slot>
    </div>
    <v-icon v-if="icon" :icon="icon" size="small" />
  </a>
  <!-- @hasActive="childHasActive(i)" -->
  <v-expand-transition>
    <MenuLevel v-show="isOpen">
      <li v-if="$slots.prepend">
        <slot name="prepend"></slot>
      </li>
      <slot
        :isOpen="isOpen"
        :open="
          () => {
            isOpen = true
          }
        "
      >
        <li v-for="(item, i) in links" :key="i" class="link">
          <!-- @click="$emit('navigation')" -->
          <router-link
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
      <li v-if="$slots.append">
        <slot name="append"></slot>
      </li>
    </MenuLevel>
  </v-expand-transition>
</template>

<style lang="sass" scoped>
.mdi
  transition: transform .2s
.mdi-chevron-right.isOpen
  transform: rotate(90deg)

.level-1 .sub-menu
  text-transform: uppercase
  font-size: 8.5pt !important
  letter-spacing: .08em
  margin-left: 4px

li.link
  margin-bottom: 6px
  &:last-child
    margin-bottom: 0

a
  color: rgb(var(--v-theme-on-app-bar))
  text-decoration: none
  padding: 5px 10px 5px 4px
  padding-right: 1em
  border-radius: 5px
  span
    font-size: 10.5pt

.menu-item
  background-color: rgba(var(--v-theme-surface), .08)
  margin: 0 6px 0 32px
  display: flex
  font-size: 10.5pt !important
  transition: background-color .2s
  &.router-link-exact-active,
  &.router-link-active:not(.router-link-exact-only)
    background-color: rgb(var(--v-theme-app-bar-active))
  :first-child
    flex: 1 1 auto
  span
    margin-left: .5em
  &.has-new
    font-weight: bold
</style>
