<script setup lang="ts">
import { computed } from 'vue'

import { DATE_FULL, formatDate } from '@/utils/dates'
import DefaultDialog from '@/components/DefaultDialog.vue'
import useErrorHandler from '@/composables/useErrorHandler'

import useMeetingStore from '../meetings/useMeetingStore'

import useClearVotes from './useClearVotes'
import useOrgStore from './useOrgStore'

const orgStore = useOrgStore()
const { getMeeting } = useMeetingStore()
const { handled } = useErrorHandler({ target: 'dialog' })
const { clear, clearing, result } = useClearVotes()

const autoClear = computed(() => !!orgStore.organisation?.auto_clear_votes)

const pending = computed(() =>
  (result.value?.pending ?? []).map(({ meeting, clearable_after, votes }) => ({
    date: formatDate(clearable_after, DATE_FULL),
    meeting: getMeeting(meeting)?.title ?? `#${meeting}`,
    pk: meeting,
    votes
  }))
)
</script>

<template>
  <v-card
    v-if="orgStore.organisation"
    prepend-icon="mdi-delete-clock"
    :title="$t('organization.voteRetention.title')"
  >
    <template #text>
      <p>
        {{
          $t(
            'organization.voteRetention.profileDays',
            orgStore.organisation.vote_retention_days
          )
        }}
        {{
          autoClear
            ? $t('organization.voteRetention.profileAuto')
            : $t('organization.voteRetention.profileManual')
        }}
        {{ $t('organization.voteRetention.profileKept') }}
      </p>
    </template>
    <template v-if="!autoClear" #actions>
      <v-spacer />
      <DefaultDialog
        :title="$t('organization.voteRetention.clearMine')"
        @close="result = undefined"
      >
        <template #activator="{ props }">
          <v-btn
            prepend-icon="mdi-delete-sweep"
            :text="$t('organization.voteRetention.clearMine')"
            variant="tonal"
            v-bind="props"
          />
        </template>
        <template #default="{ close }">
          <template v-if="!result">
            <p class="mb-6">{{ $t('organization.voteRetention.clearInfo') }}</p>
            <v-btn
              block
              color="warning"
              :loading="clearing"
              prepend-icon="mdi-delete-sweep"
              size="x-large"
              :text="$t('organization.voteRetention.clearMine')"
              @click="handled(clear)"
            />
          </template>
          <template v-else>
            <v-alert
              :type="result.cleared ? 'success' : 'info'"
              :text="
                result.cleared
                  ? $t('organization.voteRetention.cleared', result.cleared)
                  : $t('organization.voteRetention.nothingCleared')
              "
            />
            <template v-if="pending.length">
              <h3 class="mt-4 mb-2">
                {{ $t('organization.voteRetention.pendingTitle') }}
              </h3>
              <ul class="ml-4">
                <li v-for="{ date, meeting, pk, votes } in pending" :key="pk">
                  {{
                    $t(
                      'organization.voteRetention.pendingItem',
                      { date, meeting },
                      votes
                    )
                  }}
                </li>
              </ul>
            </template>
            <div class="text-right mt-4">
              <v-btn color="primary" :text="$t('close')" @click="close" />
            </div>
          </template>
        </template>
      </DefaultDialog>
    </template>
  </v-card>
</template>
