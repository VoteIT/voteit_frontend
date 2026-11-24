<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { dialogAlert, dialogQuery, minTime, slugify } from '@/utils'
import { ThemeColor } from '@/utils/types'
import { invitationScopes } from '../organisations/registry'
import { DEFAULT_ROLE_ORDER } from '../meetings/constants'
import { MeetingRole } from '../meetings/types'
import { getMeetingRoleIcon, translateMeetingRole } from '../meetings/utils'

import { matchedInviteType } from './contentTypes'
import { MeetingInvite } from './types'
import { translateInviteType } from './utils'
import useInviteStore from './useInviteStore'

const { fetchMatchedInvites } = useInviteStore()

const props = defineProps<{ invite: MeetingInvite }>()

const { t } = useI18n()
const router = useRouter()

const submitting = ref<'accept' | 'reject'>()

async function acceptInvite(inv: MeetingInvite) {
  submitting.value = 'accept'
  try {
    // Slight delay for user, before sending to meeting page
    await minTime(matchedInviteType.api.action('accept', inv.pk))
    await router.push(
      `/m/${props.invite.meeting}/${slugify(props.invite.meeting_title)}`
    )
  } catch {
    dialogAlert('Failed accepting invite')
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
    await matchedInviteType.api.action('reject', inv.pk)
    fetchMatchedInvites()
  } catch {
    dialogAlert('Invite rejection failed')
  }
  submitting.value = undefined
}

const invitedUserdata = computed(() => {
  return invitationScopes
    .getPlugins((scope) => scope.id in props.invite.user_data)
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

const roles = computed(() =>
  DEFAULT_ROLE_ORDER.filter(
    (role) =>
      role !== MeetingRole.Participant && props.invite.roles.includes(role)
  ).map((role) => ({
    role,
    icon: getMeetingRoleIcon(role),
    title: translateMeetingRole(role, t)
  }))
)
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
      <template v-if="roles.length">
        <v-list-subheader> {{ $t('roles') }}: </v-list-subheader>
        <div class="px-4 d-flex ga-2">
          <v-icon
            v-for="{ role, icon, title } in roles"
            :key="role"
            v-tooltip:top="title"
            :icon="icon"
          />
        </div>
      </template>
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
        variant="flat"
        @click="acceptInvite(invite)"
      />
    </v-card-actions>
  </v-card>
</template>
