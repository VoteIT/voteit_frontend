<template>
  <div>
    <h2 class="mb-2">
      {{ t('accessPolicy.settings') }}
    </h2>
    <v-row>
      <v-col>
        <v-alert type="info" title="Bjud in deltagare">
          <p class="mb-2">
            {{ t('accessPolicy.invitationsAlert') }}
          </p>
          <v-btn
            color="primary"
            :to="getMeetingRoute('participants')"
            prepend-icon="mdi-account"
          >
            {{ t('meeting.participants') }}
          </v-btn>
        </v-alert>
        <v-switch
          :label="t('meeting.visibleInLists')"
          v-model="meetingListed"
          color="primary"
          :messages="t('accessPolicy.listedMeetingHelp')"
        />
        <v-expand-transition>
          <div v-if="meetingListed && !hasActivePolicy">
            <v-alert
              type="warning"
              :title="t('accessPolicy.noAccessPolicies')"
              :text="t('accessPolicy.noAccessPoliciesAlert')"
              class="my-4"
            />
          </div>
        </v-expand-transition>
        <!-- TODO Add more access policies later! -->
        <div class="my-12 text-center">
          <v-btn
            v-if="!accessPolicies.length"
            @click="addAutomaticAccess"
            prepend-icon="mdi-account-cog"
            size="large"
            color="primary"
          >
            {{ t('accessPolicies.automatic.add') }}
          </v-btn>
        </div>
        <v-card v-for="p in annotatedPolicies" :key="p.pk">
          <div class="d-flex align-start pr-3">
            <v-card-title class="flex-grow-1">
              {{ p.title }}
            </v-card-title>
            <v-switch
              color="primary"
              :modelValue="p.active"
              @update:modelValue="setActive(p, $event!)"
              :label="t('active')"
              class="flex-grow-0"
              hide-details
            />
          </div>
          <v-card-text>
            <p class="mb-4">
              {{ p.description }}
            </p>
            <h2 class="text-h6 mb-2">
              {{ t('selectRoles') }}
            </h2>
            <div>
              <v-chip-group
                :modelValue="p.roles_given"
                @update:modelValue="setRoles(p, $event)"
                multiple
              >
                <v-chip
                  color="primary"
                  v-for="role in roles"
                  :key="role.value"
                  v-bind="role"
                />
              </v-chip-group>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-tooltip
              v-if="p.active"
              :model-value="copied"
              :text="t('copied')"
              location="top"
              :open-on-hover="false"
            >
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  prepend-icon="mdi-content-copy"
                  :color="copied ? 'success' : 'primary'"
                  variant="elevated"
                  @click="copy(meetingJoinUrl)"
                >
                  {{ t('meeting.copyUrl') }}
                </v-btn>
              </template>
            </v-tooltip>
            <QueryDialog
              :text="t('accessPolicy.confirmDelete')"
              color="warning"
              @confirmed="deletePolicy(p)"
            >
              <template #activator="{ props }">
                <v-btn color="warning" prepend-icon="mdi-delete" v-bind="props">
                  {{ t('content.delete') }}
                </v-btn>
              </template>
            </QueryDialog>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useClipboard } from '@vueuse/core'

import useAlert from '@/composables/useAlert'
import { AccessPolicyType } from '@/contentTypes/types'
import useMeeting from '@/modules/meetings/useMeeting'

import useAccessPolicies from './useAccessPolicies'
import { MeetingRole } from '../types'
import { meetingType } from '../contentTypes'
import QueryDialog from '@/components/QueryDialog.vue'
import { translateMeetingRole } from '../utils'

const NON_MODIFIABLE_ROLES = Object.freeze([
  MeetingRole.Participant,
  MeetingRole.Moderator
])

const { t } = useI18n()
const { meetingId, meeting, meetingDialect, meetingJoinUrl, getMeetingRoute } =
  useMeeting()
const { alert } = useAlert()
const {
  accessPolicies,
  hasActivePolicy,
  addPolicy,
  deletePolicy,
  setActive,
  setRoles
} = useAccessPolicies(meetingId)

function translateAP(ap: AccessPolicyType): {
  description: string
  title: string
} {
  switch (ap) {
    case AccessPolicyType.Automatic:
      return {
        description: t('accessPolicies.automatic.description'),
        title: t('accessPolicies.automatic.title')
      }
    case AccessPolicyType.ModeratorApproved:
      // Not implemented
      return {
        description: 'accessPolicies.moderatorApproved.description',
        title: 'accessPolicies.moderatorApproved.title'
      }
  }
}

const annotatedPolicies = computed(() => {
  return accessPolicies.value.map((ap) => ({
    ...ap,
    ...translateAP(ap.name)
  }))
})

async function addAutomaticAccess() {
  await addPolicy({
    meeting: meetingId.value,
    name: AccessPolicyType.Automatic,
    roles_given: [MeetingRole.Participant]
  })
}

const meetingListed = computed<boolean>({
  get() {
    return !!meeting.value && meeting.value.visible_in_lists
  },
  set(value) {
    try {
      meetingType.api.patch(meetingId.value, {
        visible_in_lists: value
      })
    } catch {
      alert('*Could not set meeting visible_in_lists status')
    }
  }
})

const roles = computed(() => {
  return Object.values(MeetingRole)
    .filter((r) => !meetingDialect.value?.block_roles?.includes(r))
    .map((value) => ({
      disabled: NON_MODIFIABLE_ROLES.includes(value),
      text: translateMeetingRole(value, t),
      value
    }))
})

const { copy, copied } = useClipboard()
</script>
