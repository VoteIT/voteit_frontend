<script lang="ts" setup>
import { computed, ref } from 'vue'

import Moment from '@/components/Moment.vue'
import { dialogAlert } from '@/utils'
import AccountMeetingList from '../auth/AccountMeetingList.vue'
import useAuthStore from '../auth/useAuthStore'

import { AccountInvites, mergeAccountMeetings } from './utils'

const props = defineProps<AccountInvites>()

const authStore = useAuthStore()

const switching = ref(false)

const accountName = computed(() =>
  [props.account.first_name, props.account.last_name].filter(Boolean).join(' ')
)

const meetings = computed(() => mergeAccountMeetings(props))

async function switchAccount() {
  switching.value = true
  try {
    // Reloads the page on success
    await authStore.switchUser(props.account)
  } catch {
    dialogAlert('Failed switching account')
    switching.value = false
  }
}
</script>

<template>
  <v-card
    :title="accountName"
    :subtitle="account.userid || undefined"
    prepend-icon="mdi-account-switch"
  >
    <v-card-text>
      <p>
        {{ $t('invites.usedElsewhere.switchDescription', invites.length) }}
      </p>
      <p v-if="account.last_login" class="mt-2 text-medium-emphasis">
        {{ $t('auth.linkAccount.lastLogin') }}
        <Moment :date="account.last_login" ordinary />
      </p>
      <p v-else class="mt-2 text-medium-emphasis">
        {{ $t('auth.linkAccount.neverUsed') }}
      </p>
      <AccountMeetingList :meetings="meetings" :total="account.meeting_count" />
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn
        color="primary"
        :loading="switching"
        prepend-icon="mdi-account-switch"
        :text="$t('invites.usedElsewhere.switch')"
        variant="elevated"
        @click="switchAccount"
      />
    </v-card-actions>
  </v-card>
</template>
