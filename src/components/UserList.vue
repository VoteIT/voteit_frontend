<template>
  <v-list density="comfortable">
    <v-list-item v-for="{ pk, full_name, userid } in users" :key="pk" class="px-0">
      <v-list-item-avatar class="mr-2">
        <UserAvatar :pk="pk" />
      </v-list-item-avatar>
      <div>
        <v-list-item-title :class="{ 'text-secondary': !full_name }">
          {{ full_name ?? `- ${t('unknownUser')} -` }}
        </v-list-item-title>
        <v-list-item-subtitle>
          {{ userid }}
        </v-list-item-subtitle>
      </div>
    </v-list-item>
  </v-list>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue'

import useMeeting from '@/modules/meetings/useMeeting'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  props: {
    userIds: {
      type: Array as PropType<number[]>,
      required: true
    }
  },
  setup (props) {
    const { t } = useI18n()
    const { getUser } = useMeeting()
    const users = computed(() => {
      return props.userIds
        .map(pk => getUser(pk) ?? { pk })
    })
    return {
      t,
      users
    }
  }
})
</script>
