<template>
  <v-list :density="density" :bg-color="bgColor">
    <v-list-item @click="$emit('clickItem', pk)" v-for="{ pk, full_name, userid } in users" :key="pk" :class="{ 'px-0': density !== 'default' }" active-color="primary" :active="modelValue === pk">
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
      <slot name="appendItem" :user="pk" />
    </v-list-item>
  </v-list>
</template>

<script lang="ts">
import { orderBy } from 'lodash'
import { computed, defineComponent, PropType } from 'vue'
import { useI18n } from 'vue-i18n'

import useUserDetails from '@/modules/organisations/useUserDetails'

export default defineComponent({
  emits: ['clickItem'],
  props: {
    bgColor: String,
    userIds: {
      type: Array as PropType<number[]>,
      required: true
    },
    modelValue: Number, // Active user pk, makes active list item
    density: {
      type: String as PropType<'default' | 'comfortable' | 'compact'>,
      default: 'comfortable'
    }
  },
  setup (props) {
    const { t } = useI18n()
    const { getUser } = useUserDetails()
    const users = computed(() => {
      return orderBy(
        props.userIds
          .map(pk => getUser(pk) ?? { pk }),
        ['full_name']
      )
    })
    return {
      t,
      users
    }
  }
})
</script>
