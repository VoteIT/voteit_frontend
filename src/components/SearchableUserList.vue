<script setup lang="ts" generic="T extends { user: number }">
/**
 * List of users, always in alphabetical order.
 * Shows a search field (name or userid) when there are more items than threshold.
 */
import { computed, shallowRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { getFullName } from '@/utils'
import useMeetingId from '@/modules/meetings/useMeetingId'
import useUserDetails from '@/modules/organisations/useUserDetails'

import User from './User.vue'

const props = withDefaults(
  defineProps<{
    autofocus?: boolean
    items: T[]
    threshold?: number
  }>(),
  {
    threshold: 5
  }
)

defineSlots<{
  item(props: { item: T }): unknown
  prepend(): unknown
}>()

const { getUser } = useUserDetails(useMeetingId())
const { locale } = useI18n()

const search = shallowRef<string | null>('')
const searchable = computed(() => props.items.length > props.threshold)

function getName(item: T) {
  const user = getUser(item.user)
  return user ? getFullName(user).toLocaleLowerCase() : ''
}

function getUserid(item: T) {
  return getUser(item.user)?.userid?.toLocaleLowerCase() ?? ''
}

function matches(item: T, query: string) {
  return getName(item).includes(query) || getUserid(item).includes(query)
}

const filteredItems = computed(() => {
  const query = searchable.value
    ? (search.value ?? '').trim().toLocaleLowerCase()
    : ''
  const items = query
    ? props.items.filter((item) => matches(item, query))
    : props.items
  return [...items].sort(
    (a, b) =>
      getName(a).localeCompare(getName(b), locale.value) ||
      getUserid(a).localeCompare(getUserid(b), locale.value)
  )
})
</script>

<template>
  <v-list>
    <slot name="prepend" />
    <div v-if="searchable" class="search px-2 pb-2 bg-surface">
      <v-text-field
        v-model="search"
        :autofocus="autofocus"
        clearable
        density="compact"
        hide-details
        :label="$t('search')"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        @click.stop
        @keydown.stop
      />
    </div>
    <template v-for="item in filteredItems" :key="item.user">
      <slot name="item" :item="item">
        <v-list-item>
          <template #title>
            <User :pk="item.user" userid no-popup />
          </template>
        </v-list-item>
      </slot>
    </template>
  </v-list>
</template>

<style scoped>
.search {
  position: sticky;
  top: 0;
  z-index: 1;
}
</style>
