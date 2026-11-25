<script lang="ts" setup>
import { computed } from 'vue'

import Moment from '@/components/Moment.vue'
import AccountMeetingList from '../auth/AccountMeetingList.vue'

import InvitedAsList from './InvitedAsList.vue'
import { AccountInvites } from './utils'

/** Invites used by an account the user can't switch to. See SwitchAccountCard. */
const props = defineProps<AccountInvites>()

const accountName = computed(() =>
  [props.account.first_name, props.account.last_name].filter(Boolean).join(' ')
)

const meetings = computed(() =>
  props.invites.map((inv) => ({ pk: inv.meeting, title: inv.meeting_title }))
)
</script>

<template>
  <v-card
    :title="accountName"
    prepend-icon="mdi-account-question"
    elevation="4"
    class="rounded-te-xl rounded-bs-xl"
  >
    <v-card-text>
      <p>
        {{ $t('invites.usedElsewhere.otherDescription', invites.length) }}
      </p>
      <p v-if="account.last_login" class="mt-2 text-medium-emphasis">
        {{ $t('auth.linkAccount.lastLogin') }}
        <Moment :date="account.last_login" ordinary />
      </p>
      <p v-else class="mt-2 text-medium-emphasis">
        {{ $t('auth.linkAccount.neverUsed') }}
      </p>
      <AccountMeetingList :meetings="meetings" />
    </v-card-text>
    <InvitedAsList :invites="invites" />
    <v-card-text class="pt-0 text-medium-emphasis">
      {{ $t('invites.usedElsewhere.cantSwitch') }}
    </v-card-text>
  </v-card>
</template>
