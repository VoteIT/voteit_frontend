<template>
  <v-list :density="density" :bg-color="bgColor" active-color="primary">
    <v-item-group :multiple="multiple" :modelValue="modelValue" @update:modelValue="$emit('update:modelValue', $event)">
      <v-item v-for="{ pk, full_name, userid } in users" :key="pk" :value="pk" v-slot="{ isSelected, toggle }">
      <v-list-item  @click="toggle()" :active="isSelected">
        <v-list-item-avatar class="mr-2">
          <UserAvatar :pk="pk" />
        </v-list-item-avatar>
        <div class="flex-grow-1">
          <v-list-item-title :class="{ 'text-secondary': !full_name }">
            {{ full_name ?? `- ${t('unknownUser')} (${pk}) -` }}
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ userid }}
          </v-list-item-subtitle>
        </div>
        <slot name="appendItem" :user="pk" :isSelected="isSelected" />
      </v-list-item>
      </v-item>
    </v-item-group>
  </v-list>
</template>

<script lang="ts">
import { orderBy } from 'lodash'
import { computed, defineComponent, PropType } from 'vue'
import { useI18n } from 'vue-i18n'

import useUserDetails from '@/modules/organisations/useUserDetails'

export default defineComponent({
  emits: ['update:modelValue'],
  props: {
    bgColor: String,
    userIds: {
      type: Array as PropType<number[]>,
      required: true
    },
    multiple: Boolean,
    modelValue: [Number, Array] as PropType<number[] | number>, // Active user(s) pk, makes active list item
    density: {
      type: String as PropType<'default' | 'comfortable' | 'compact'>,
      default: 'comfortable'
    }
  },
  setup (props) {
    if (props.multiple && typeof props.modelValue === 'number') throw new Error('Got multiple select but modelValue is not an array')
    if (!props.multiple && typeof props.modelValue === 'object') throw new Error('Got single select but modelValue is not a number')
    const { t } = useI18n()
    const { getUser } = useUserDetails()
    const users = computed(() => {
      return orderBy(
        props.userIds
          .map(pk => getUser(pk) ?? { pk }),
        ['full_name']
      )
    })

    // function isSelected (pk: number) {
    //   if (typeof props.modelValue === 'number') return pk === props.modelValue
    //   return props.modelValue?.includes(pk)
    // }

    // function itemClick (pk: number) {
    //   const isArray = typeof props.modelValue === 'object'
    //   emit(
    //     'update:modelValue',
    //     isSelected(pk)
    //       ? isArray
    //         ? props.modelValue?.filter(n => n !== pk)
    //         : undefined
    //       : isArray
    //         ? [...props.modelValue, pk]
    //         : pk
    //   )
    // }

    return {
      t,
      users
      // isSelected,
      // itemClick
    }
  }
})
</script>
