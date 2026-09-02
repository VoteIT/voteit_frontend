<script lang="ts" setup>
import { imap, sum } from 'itertools'
import { DateTime } from 'luxon'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useIdle, useIntervalFn, useTitle } from '@vueuse/core'

import { slugify } from '@/utils'
import { cols } from '@/utils/defaults'

import AppBar from '@/components/AppBar.vue'
import Richtext from '@/components/Richtext.vue'
import RoleMatrix from '@/components/RoleMatrix.vue'
import UserMenu from '@/components/UserMenu.vue'
import UserSearch from '@/components/UserSearch.vue'
import DefaultDialog from '@/components/DefaultDialog.vue'
import EditableHelpText from '@/components/EditableHelpText.vue'
import useDefaults from '@/composables/useDefaults'
import useErrorHandler from '@/composables/useErrorHandler'

import useAuthStore from '../auth/useAuthStore'
import InviteCard from '../meetingInvites/InviteCard.vue'
import useInviteStore from '../meetingInvites/useInviteStore'
import AddMeeting from '../meetings/AddMeetingModal.vue'
import useMeetings from '../meetings/useMeetings'
import { MeetingState } from '../meetings/types'
import { translateMeetingRole } from '../meetings/utils'
import useMeetingStore from '../meetings/useMeetingStore'

import ContactInfoTab from './ContactInfoTab.vue'
import OrgEditForm from './OrgEditForm.vue'
import useOrgStore from './useOrgStore'
import { organisationType } from './contentTypes'
import { OrganisationRole } from './types'
import useContactInfo from './useContactInfo'
import FindMeetingDialog from './FindMeetingDialog.vue'
import { displayRoles } from './utils'
import { meetingType } from '../meetings/contentTypes'

const inviteStore = useInviteStore()

const organisationIcons: Record<OrganisationRole, string> = {
  meeting_creator: 'mdi-calendar-plus',
  org_manager: 'mdi-account-supervisor-circle'
}

const { t } = useI18n()
const { handled } = useErrorHandler({ target: 'dialog' })
const { isAuthenticated, user } = storeToRefs(useAuthStore())
const orgStore = useOrgStore()
const meetingStore = useMeetingStore()

const currentTab = ref('default')

useMeetings()

const { requiresCheck } = useContactInfo(true)

useTitle(
  computed(() =>
    orgStore.organisation ? `${orgStore.organisation.title} | VoteIT` : 'VoteIT'
  )
)

async function fetchInvitesIfAuthenticated() {
  if (!user.value) return
  try {
    await inviteStore.fetchMatchedInvites()
  } catch (e) {
    // Polled in the background — don't interrupt the user on every failure
    console.warn(e)
  }
}

watch(user, () => {
  inviteStore.clearMatchedInvites()
  fetchInvitesIfAuthenticated()
})
const { idle } = useIdle()
useIntervalFn(
  fetchInvitesIfAuthenticated,
  computed(() => (idle.value ? 600_000 : 15_000)),
  { immediateCallback: true }
)

const editing = ref(false)
const { collapsedBodyHeightMobile } = useDefaults()

const tabs = computed(() => {
  if (!orgStore.canChangeOrganisation) return
  return [
    {
      value: 'default',
      text: t('home.home')
    },
    {
      value: 'roles',
      text: t('roles')
    },
    {
      value: 'contactInfo',
      text: t('home.contactInfo.title')
    }
  ]
})

async function addUser(user: number) {
  if (!orgStore.organisation) throw new Error('No organisation')
  const { pk } = orgStore.organisation
  await handled(
    () => organisationType.addRoles(pk, user, OrganisationRole.MeetingCreator),
    'roles'
  )
}

function mkGroupRule(
  state: keyof (typeof meetingStore)['participatingMeetings'],
  maxLength?: number
) {
  return {
    meetings: computed(() => meetingStore.participatingMeetings[state]),
    state: meetingType.sm.getState(state),
    maxLength
  }
}

/** Meetings listed upfront */
const groupRules = [
  mkGroupRule(MeetingState.Ongoing),
  mkGroupRule(MeetingState.Upcoming),
  mkGroupRule(MeetingState.Closed, 3)
]

const meetingGroups = computed(() => {
  return groupRules
    .map(({ maxLength, meetings, state }) => {
      return {
        meetings:
          maxLength && !groupsExpanded.value
            ? meetings.value.slice(0, maxLength)
            : meetings.value,
        title: state.translate(t, meetings.value.length),
        expandable: !!maxLength && meetings.value.length > maxLength
      }
    })
    .filter(({ meetings }) => meetings.length)
})
const groupsExpanded = ref(false)
const meetingCount = computed(() =>
  sum(imap(groupRules, ({ meetings }) => meetings.value.length))
)
</script>

<template>
  <AppBar />
  <UserMenu />
  <v-main>
    <v-container>
      <v-row v-if="orgStore.organisation" class="home my-4">
        <v-col
          v-if="!isAuthenticated"
          v-bind="cols.wideLeft.right"
          class="d-flex flex-column ga-3"
          order-md="1"
        >
          <v-btn
            v-if="orgStore.loginURL"
            block
            color="primary"
            :disabled="!orgStore.canLogin"
            :href="orgStore.loginURL"
            prepend-icon="mdi-login"
            :text="$t('organization.loginTo', { ...orgStore.organisation })"
          />
          <v-alert
            v-if="!orgStore.canLogin"
            :text="$t('organization.cantLogin')"
            type="error"
          />
          <EditableHelpText :modelValue="orgStore.organisation.help_info" />
          <v-card
            elevation="0"
            prepend-icon="mdi-information-outline"
            append-icon="mdi-chevron-right"
            :title="$t('about.title')"
            :text="$t('about.description')"
            :to="{ name: 'about' }"
          />
        </v-col>
        <v-col v-bind="cols.wideLeft.left" order-md="0">
          <v-tabs
            v-if="tabs"
            :items="tabs"
            v-model="currentTab"
            align-tabs="end"
            class="mb-4"
          />
          <v-window v-model="currentTab">
            <v-window-item value="default">
              <v-alert
                v-if="tabs && requiresCheck"
                :title="$t('home.contactInfo.requiresCheck')"
                :text="$t('home.contactInfo.requiresCheckDescription')"
                type="warning"
                class="mb-4"
              >
                <template #append>
                  <v-btn
                    :text="$t('home.contactInfo.check')"
                    @click="currentTab = 'contactInfo'"
                  />
                </template>
              </v-alert>
              <OrgEditForm
                v-if="editing"
                :organisation="orgStore.organisation"
                @close="editing = false"
              />
              <template v-else>
                <header class="d-flex">
                  <h1 class="flex-grow-1">
                    {{ orgStore.organisation.page_title }}
                  </h1>
                  <v-menu v-if="orgStore.canChangeOrganisation">
                    <template #activator="{ props }">
                      <v-btn
                        icon="mdi-dots-vertical"
                        variant="text"
                        v-bind="props"
                      />
                    </template>
                    <v-list>
                      <v-list-item
                        prepend-icon="mdi-pencil"
                        :title="$t('edit')"
                        @click="editing = true"
                      />
                    </v-list>
                  </v-menu>
                </header>
                <Richtext
                  :value="orgStore.organisation.body"
                  :maxHeight="collapsedBodyHeightMobile"
                />
              </template>
            </v-window-item>

            <template v-if="orgStore.canChangeOrganisation">
              <v-window-item value="roles">
                <UserSearch class="mb-6" @submit="addUser" />
                <RoleMatrix
                  admin
                  :contentType="organisationType"
                  :pk="orgStore.organisation.pk"
                  :icons="organisationIcons"
                  :remove-confirm-text="$t('areYouSure')"
                />
              </v-window-item>

              <v-window-item value="contactInfo">
                <ContactInfoTab />
              </v-window-item>
            </template>
          </v-window>
        </v-col>
        <v-divider vertical />
        <v-col v-if="isAuthenticated" v-bind="cols.wideLeft.right">
          <div v-if="inviteStore.matchedInvites.length" class="mb-4">
            <h2 class="mb-2">
              {{ $t('join.invites', inviteStore.matchedInvites.length) }}
            </h2>
            <InviteCard
              v-for="inv in inviteStore.matchedInvites"
              :key="inv.pk"
              :invite="inv"
              class="mb-4"
            />
          </div>
          <h2 class="mb-3">
            {{ $t('home.yourMeetings', meetingCount) }}
          </h2>
          <div
            v-for="{ expandable, meetings, title } in meetingGroups"
            :key="title"
          >
            <h3>
              {{ title }}
            </h3>
            <v-list class="my-3" :border="true" rounded>
              <v-list-item
                v-for="{
                  pk,
                  start_time,
                  title,
                  current_user_roles
                } in meetings"
                :key="pk"
                class="meeting-item"
                :to="{
                  name: 'meeting',
                  params: { id: pk, slug: slugify(title) }
                }"
                :title="title"
                :subtitle="
                  start_time
                    ? DateTime.fromISO(start_time).toLocaleString()
                    : undefined
                "
              >
                <template #append>
                  <v-tooltip
                    v-for="{ role, icon } in displayRoles"
                    :key="role"
                    :text="translateMeetingRole(role, t)"
                  >
                    <template
                      #activator="{ props }"
                      v-if="current_user_roles?.includes(role)"
                    >
                      <v-icon v-bind="props" :icon="icon" />
                    </template>
                  </v-tooltip>
                </template>
              </v-list-item>
              <v-btn
                v-if="expandable && !groupsExpanded"
                block
                :text="$t('organization.showMore')"
                variant="text"
                @click="groupsExpanded = true"
              />
            </v-list>
          </div>
          <p v-if="!meetingGroups.length" class="mb-4">
            <em>{{ $t('home.noCurrentMeetings') }}</em>
          </p>
          <DefaultDialog
            v-if="orgStore.canAddMeeting"
            :title="$t('meeting.create')"
          >
            <template #activator="{ props }">
              <v-btn
                block
                color="primary"
                prepend-icon="mdi-plus"
                :text="$t('meeting.create')"
                variant="text"
                v-bind="props"
              />
            </template>
            <template v-slot="{ close }">
              <AddMeeting @close="close" />
            </template>
          </DefaultDialog>
          <FindMeetingDialog />
          <EditableHelpText
            :modelValue="orgStore.organisation.help_info"
            :editable="!!orgStore.canChangeOrganisation"
            :handler="(help_info) => orgStore.updateOrganisation({ help_info })"
            :placeholder="$t('home.helpInfoPlaceholder')"
            class="mt-3"
          />
        </v-col>
      </v-row>
      <v-row v-else-if="orgStore.organisationIsUnavailable">
        <v-col v-bind="cols.default">
          <v-sheet class="py-8 px-4 text-center" :border="true" rounded>
            <h1 class="mb-4">
              {{ $t('home.noOrganisationTitle') }}
            </h1>
            <p class="mb-12">
              {{ $t('home.noOrganisationDescription') }}
            </p>
            <p>
              <i18n-t keypath="home.noOrganisationTryItOut">
                <template #projectURL>
                  <a href="https://voteit.se">VoteIT.se</a>
                </template>
              </i18n-t>
            </p>
          </v-sheet>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<style scoped lang="sass">
.meeting-item
  :deep(.v-list-item-title)
    white-space: normal
</style>
