<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { invitationScopes } from '../organisations/registry'

import { MeetingInvite } from './types'
import { translateInviteType } from './utils'

/** Each value once, for one invite or several */
const props = defineProps<{ invites: readonly MeetingInvite[] }>()

const { t } = useI18n()

const invitedUserdata = computed(() => {
  return invitationScopes
    .getPlugins((scope) =>
      props.invites.some((inv) => scope.id in inv.user_data)
    )
    .flatMap((scope) => {
      const values = new Set(
        props.invites.map((inv) => inv.user_data[scope.id]).filter(Boolean)
      )
      return [...values].map((value) => ({
        icon: scope.icon,
        key: `${scope.id}:${value}`,
        subtitle: translateInviteType(scope.id, t).typeLabel,
        title: scope.transformData?.(value!) || value
      }))
    })
})
</script>

<template>
  <v-list density="compact">
    <v-list-subheader> {{ $t('invites.invitedAs') }}: </v-list-subheader>
    <v-list-item
      v-for="{ icon, key, subtitle, title } in invitedUserdata"
      :key="key"
      :prepend-icon="icon"
      :subtitle="subtitle"
      :title="title"
    />
  </v-list>
</template>
