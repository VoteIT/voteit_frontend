<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { dialogAlert, dialogQuery, minTime, slugify } from '@/utils'
import { ThemeColor } from '@/utils/types'

import { matchedInviteType } from './contentTypes'
import InvitedAsList from './InvitedAsList.vue'
import { MeetingInvite } from './types'
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
</script>

<template>
  <v-card
    :title="invite.meeting_title"
    elevation="4"
    class="rounded-te-xl rounded-bs-xl"
  >
    <InvitedAsList :invites="[invite]" />
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
