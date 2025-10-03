<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { dialogQuery, sleep, slugify } from '@/utils'
import { openAlertEvent } from '@/utils/events'
import { ThemeColor } from '@/utils/types'
import { invitationScopes } from '../organisations/registry'

import { matchedInviteType } from './contentTypes'
import { MeetingInvite } from './types'
import useMatchedInvites from './useMatchedInvites'
import { translateInviteType } from './utils'

const { fetchInvites } = useMatchedInvites()

const props = defineProps<{ invite: MeetingInvite }>()

const { t } = useI18n()
const router = useRouter()

const submitting = ref<'accept' | 'reject'>()

async function acceptInvite(inv: MeetingInvite) {
  submitting.value = 'accept'
  try {
    await matchedInviteType.api.action(inv.pk, 'accept')
    await sleep(250) // Slight delay for user, before sending to meeting page
    await router.push(
      `/m/${props.invite.meeting}/${slugify(props.invite.meeting_title)}`
    )
  } catch {
    openAlertEvent.emit('^Failed accepting invite')
  }
  submitting.value = undefined
}
async function rejectInvite(inv: MeetingInvite) {
  if (
    !(await dialogQuery({
      title: t('join.rejectInviteQuery'),
      theme: ThemeColor.Warning
    }))
  )
    return
  submitting.value = 'reject'
  try {
    await matchedInviteType.api.action(inv.pk, 'reject')
    fetchInvites()
  } catch {
    openAlertEvent.emit('^Invite rejection failed')
  }
  submitting.value = undefined
}

const invitedUserdata = computed(() => {
  return invitationScopes
    .getActivePlugins()
    .filter((scope) => scope.id in props.invite.user_data)
    .map((scope) => {
      const value = props.invite.user_data[scope.id]!
      return {
        icon: scope.icon,
        scope: scope.id,
        subtitle: translateInviteType(scope.id, t).typeLabel,
        title: scope.transformData?.(value) || value
      }
    })
})
</script>

<template>
  <v-card
    :title="invite.meeting_title"
    elevation="4"
    class="rounded-te-xl rounded-bs-xl"
  >
    <v-list density="compact">
      <v-list-subheader> {{ $t('invites.invitedAs') }}: </v-list-subheader>
      <v-list-item
        v-for="{ icon, scope, subtitle, title } in invitedUserdata"
        :key="scope"
        :prepend-icon="icon"
        :subtitle="subtitle"
        :title="title"
      />
    </v-list>
    <v-card-actions class="flex-wrap">
      <v-spacer />
      <v-btn
        color="warning"
        :loading="submitting === 'reject'"
        prepend-icon="mdi-close"
        :text="$t('join.rejectInvite')"
        @click="rejectInvite(invite)"
      />
      <v-btn
        color="primary"
        :loading="submitting === 'accept'"
        prepend-icon="mdi-door-open"
        :text="$t('join.acceptInvite')"
        variant="elevated"
        @click="acceptInvite(invite)"
      />
    </v-card-actions>
  </v-card>
</template>
