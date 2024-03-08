<script setup lang="ts" generic="Value extends number[] | number">
import { orderBy } from 'lodash'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { getFullName } from '@/utils'
import useUserDetails from '@/modules/organisations/useUserDetails'

defineEmits<{
  (e: 'update:modelValue', value: Value): void
}>()

const props = withDefaults(
  defineProps<{
    bgColor?: string
    userIds: number[]
    multiple?: boolean
    modelValue?: Value // Active user(s) pk, makes active list item
    density?: 'default' | 'comfortable' | 'compact'
  }>(),
  {
    density: 'comfortable'
  }
)

if (props.multiple && typeof props.modelValue === 'number')
  throw new Error('Got multiple select but modelValue is not an array')
if (!props.multiple && typeof props.modelValue === 'object')
  throw new Error('Got single select but modelValue is not a number')
const { t } = useI18n()
const { getUser } = useUserDetails()
const users = computed(() => {
  return orderBy(
    props.userIds.map(
      (pk) => getUser(pk) ?? { pk, first_name: '', last_name: '', userid: '' }
    ),
    (u) => getFullName(u).toLocaleLowerCase()
  )
})
</script>

<template>
  <v-list :density="density" :bg-color="bgColor">
    <v-item-group
      :multiple="multiple"
      :modelValue="modelValue"
      @update:modelValue="$emit('update:modelValue', $event as Value)"
    >
      <v-item
        v-for="user in users"
        :key="user.pk"
        :value="user.pk"
        v-slot="{ isSelected, toggle }"
      >
        <v-list-item @click="toggle?.()" :active="isSelected">
          <template #prepend>
            <UserAvatar popup :pk="user.pk" />
          </template>
          <v-list-item-title :class="{ 'text-secondary': !getFullName(user) }">
            {{ getFullName(user) ?? `- ${t('unknownUser')} (${user.pk}) -` }}
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ user.userid }}
          </v-list-item-subtitle>
          <template #append>
            <slot
              name="appendItem"
              :user="user.pk"
              :isSelected="isSelected"
            ></slot>
          </template>
        </v-list-item>
      </v-item>
    </v-item-group>
  </v-list>
</template>
