<template>
  <v-card :title="invite.meeting_title" elevation="4" class="rounded-te-xl rounded-bs-xl">
    <v-list density="compact">
      <v-list-subheader>
        {{ t('invites.invitedAs') }}:
      </v-list-subheader>
      <v-list-item
        :prepend-icon="scopePlugin?.icon || 'mdi-help'"
        :title="scopePlugin?.transformData?.(invite.invite_data) || invite.invite_data"
        :subtitle="t(`invites.${invite.type}.typeLabel`)"
      />
    </v-list>
    <v-card-actions class="flex-wrap">
      <v-spacer />
      <v-btn color="warning" prepend-icon="mdi-close" :disabled="submitting" @click="rejectInvite(invite)">
        {{ t('join.rejectInvite') }}
      </v-btn>
      <v-btn variant="elevated" color="primary" prepend-icon="mdi-door-open" :disabled="submitting" @click="acceptInvite(invite)">
        {{ t('join.acceptInvite') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { dialogQuery, slugify } from '@/utils'
import { matchedInviteType } from './contentTypes'
import { MeetingInvite } from './types'
import useMeetingInvites from './useMeetingInvites'
import useMeetings from './useMeetings'
import { ThemeColor } from '@/utils/types'
import { invitationScopes } from '../organisations/registry'

const { fetchInvites } = useMeetingInvites()
const { fetchMeetings } = useMeetings()

const props = defineProps<{ invite: MeetingInvite }>()

const { t } = useI18n()
const router = useRouter()

const submitting = ref(false)
async function acceptInvite (inv: MeetingInvite) {
  submitting.value = true
  try {
    await matchedInviteType.api.action(inv.pk, 'accept')
    await fetchMeetings()
    router.push(`/m/${props.invite.meeting}/${slugify(props.invite.meeting_title)}`)
  } catch {
    submitting.value = false
  }
}
async function rejectInvite (inv: MeetingInvite) {
  if (!await dialogQuery({
    title: t('join.rejectInviteQuery'),
    theme: ThemeColor.Warning
  })) return
  submitting.value = true
  try {
    await matchedInviteType.api.action(inv.pk, 'reject')
    fetchInvites()
  } catch {
    submitting.value = false
  }
}

const scopePlugin = computed(() => invitationScopes.getPlugin(props.invite.type))
</script>
