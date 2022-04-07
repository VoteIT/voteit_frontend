<template>
  <v-card :title="invite.meeting_title" elevation="4">
    <v-list-subheader>
      {{ t('meeting.invites.invitedAs') }}:
    </v-list-subheader>
    <v-list-item :prepend-icon="icon" :title="invite.invite_data" :subtitle="t(`meeting.invites.types.${invite.type}`)" />
    <v-card-actions class="flex-wrap">
      <v-spacer />
      <v-btn variant="text" color="warning" prepend-icon="mdi-close" :disabled="submitting" @click="rejectInvite(invite)">
        {{ t('join.rejectInvite') }}
      </v-btn>
      <v-btn color="primary" prepend-icon="mdi-door-open" :disabled="submitting" @click="acceptInvite(invite)">
        {{ t('join.acceptInvite') }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { matchedInviteType } from './contentTypes'
import { MeetingInvite } from './types'
import useMeetingInvites from './useMeetingInvites'
import slugify from 'slugify'
import useMeetings from './useMeetings'
import { dialogQuery } from '@/utils'
import { ThemeColor } from '@/utils/types'

const { fetchInvites } = useMeetingInvites()
const { fetchMeetings } = useMeetings()

const TYPE_ICONS = {
  email: 'mdi-email'
}

export default defineComponent({
  props: {
    invite: {
      type: Object as PropType<MeetingInvite>,
      required: true
    }
  },
  setup (props) {
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

    return {
      t,
      icon: computed(() => TYPE_ICONS[props.invite.type]),
      submitting,
      acceptInvite,
      rejectInvite
    }
  }
})
</script>

<style lang="sass" scoped>
.v-card
  border-top-right-radius: 14px
  border-bottom-left-radius: 14px
</style>
