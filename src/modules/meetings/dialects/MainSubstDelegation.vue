<script setup lang="ts">
import { any } from 'itertools'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'

import { getFullName } from '@/utils'
import useAuthStore from '@/modules/auth/useAuthStore'
import DefaultDialog from '@/components/DefaultDialog.vue'
import SearchableUserList from '@/components/SearchableUserList.vue'
import User from '@/components/User.vue'
import UserAvatar from '@/components/UserAvatar.vue'

import useUserDetails from '@/modules/organisations/useUserDetails'
import useErrorHandler from '@/composables/useErrorHandler'

import { GroupMembership, MeetingGroup } from '../types'
import useMeetingGroups from '../useMeetingGroups'
import useVoteTransfers from '../electoralRegisters/useVoteTransfers'
import useGroupStore from '../useGroupStore'
import useMeeting from '../useMeeting'

const props = defineProps<{
  group: MeetingGroup & { memberships: GroupMembership[] }
}>()

const { allGroupMembers } = useMeetingGroups(props.group.meeting)
const { getMeetingGroup, getGroupRole } = useGroupStore()
const authStore = useAuthStore()
const { isModerator, meetingId } = useMeeting()
const { getUser } = useUserDetails(meetingId)
const {
  api,
  canRecieveVote,
  getForUsers,
  hasMainRole,
  hasSubstRole,
  hasVoteRole
} = useVoteTransfers(props.group.meeting)
const { handler } = useErrorHandler({ target: 'dialog' })
const { smAndUp } = useDisplay()
const { locale } = useI18n()

/**
 * Vote transfer calls, with errors reported to the user.
 */
const transferActions = {
  add: handler(api.add),
  update: handler(api.update),
  delete: handler(api.delete)
}

function getName(pk: number) {
  const user = getUser(pk)
  return user ? getFullName(user) || user.userid || '' : ''
}

/**
 * User ids available for vote transfer
 */
const availableTargets = computed(() =>
  props.group.memberships
    .filter(
      (gm) =>
        hasSubstRole(gm) && // Must have subst role in this group
        !groupTransfers.value.some((t) => t.target === gm.user) // Remove transfers in this group
    )
    .map((gm) => ({ ...gm, disabled: !canRecieveVote(gm.user) }))
)

const mains = computed(() =>
  props.group.memberships.filter(hasMainRole).map((gm) => gm.user)
)
const substitutes = computed(() =>
  props.group.memberships.filter(hasSubstRole).map((gm) => gm.user)
)

/**
 * Transfers in this group. Transfers regarding me come first, then alphabetical by source.
 */
const groupTransfers = computed(() =>
  getForUsers(mains.value, substitutes.value)
    .map((t) => {
      const isMine =
        t.source === authStore.user?.pk || t.target === authStore.user?.pk
      return {
        ...t,
        canManage: isModerator.value || isMine,
        isMine
      }
    })
    .sort(
      (a, b) =>
        Number(b.isMine) - Number(a.isMine) ||
        getName(a.source).localeCompare(getName(b.source), locale.value)
    )
)

function* iterRoleProblems() {
  for (const gm of props.group.memberships) {
    if (!hasVoteRole(gm)) continue
    const others = allGroupMembers.value
      .filter((other) => other.pk !== gm.pk && other.user === gm.user)
      .filter(hasVoteRole)
    if (!others.length) continue
    const user = getUser(gm.user)
    if (!user) continue
    const problems = hasMainRole(gm) ? others : others.filter(hasMainRole)
    for (const problem of problems)
      yield {
        fullName: getFullName(user),
        groupName: getMeetingGroup(problem.meeting_group)?.title ?? '?',
        roleName: getGroupRole(problem.role)?.title ?? '?',
        userid: user.userid
      }
  }
}

const roleProblems = computed(() => [...iterRoleProblems()])
const hasRoleProblem = computed(() => any(iterRoleProblems()))

const annotatedMembers = computed(() =>
  props.group.memberships.filter(hasVoteRole).map((gm) => {
    const transfer = groupTransfers.value.find(
      (vt) => vt.source === gm.user || vt.target === gm.user
    )
    const isMain = hasMainRole(gm)
    return {
      ...gm,
      canTransfer:
        !!availableTargets.value.length &&
        isMain &&
        !transfer &&
        (isModerator.value || gm.user === authStore.user?.pk),
      hasVoteInGroup: !transfer === isMain,
      roleTitle: getGroupRole(gm.role)?.title
    }
  })
)

const canManageVotes = computed(
  () =>
    isModerator.value ||
    props.group.memberships.some(
      (gm) => gm.user === authStore.user?.pk && hasVoteRole(gm)
    )
)
</script>

<template>
  <DefaultDialog
    v-if="annotatedMembers.length"
    :title="$t('erMethods.mainSubstDelegate.votesIn', { ...group })"
  >
    <template #activator="{ props }">
      <v-badge color="warning" icon="mdi-alert" :model-value="hasRoleProblem">
        <v-btn
          v-if="canManageVotes"
          color="primary"
          size="small"
          :text="$t('erMethods.mainSubstDelegate.handle')"
          v-bind="props"
        />
        <v-btn
          v-else
          color="secondary"
          size="small"
          :text="$t('erMethods.mainSubstDelegate.display')"
          v-bind="props"
        />
      </v-badge>
    </template>
    <template #default="{ close }">
      <v-alert
        v-if="roleProblems.length"
        class="mb-3"
        icon="mdi-alert"
        :text="$t('erMethods.mainSubstDelegate.mainProblemText')"
        :title="$t('erMethods.mainSubstDelegate.mainProblemTitle')"
        type="warning"
      >
        <ul class="my-2">
          <li v-for="(problem, i) in roleProblems" :key="i">
            •
            <i18n-t keypath="erMethods.mainSubstDelegate.mainProblemDetail">
              <template #user>
                {{ problem.fullName }} <small>({{ problem.userid }})</small>
              </template>
              <template #role>
                <em>{{ problem.roleName }}</em>
              </template>
              <template #group>
                <em>{{ problem.groupName }}</em>
              </template>
            </i18n-t>
          </li>
        </ul>
      </v-alert>
      <v-alert
        class="mb-3"
        :text="$t('erMethods.mainSubstDelegate.voteErAlert')"
        type="info"
      />
      <template v-if="groupTransfers.length">
        <h2>{{ $t('erMethods.mainSubstDelegate.transfers') }}</h2>
        <v-table class="mb-3">
          <thead>
            <tr>
              <th>{{ $t('erMethods.mainSubstDelegate.from') }}</th>
              <th class="px-0"></th>
              <th>{{ $t('erMethods.mainSubstDelegate.to') }}</th>
              <th class="px-0" v-if="canManageVotes"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="t in groupTransfers"
              :key="t.pk"
              :class="{ 'bg-surface-active': t.isMine }"
            >
              <td><User :pk="t.source" userid /></td>
              <td class="px-0"><v-icon icon="mdi-arrow-right" /></td>
              <td><User :pk="t.target" userid /></td>
              <td v-if="canManageVotes" class="px-0">
                <template v-if="t.canManage">
                  <v-menu max-height="400">
                    <template #activator="{ props }">
                      <v-btn
                        v-if="smAndUp"
                        append-icon="mdi-chevron-down"
                        color="primary"
                        size="small"
                        :text="$t('erMethods.mainSubstDelegate.change')"
                        v-bind="props"
                      />
                      <v-btn
                        v-else
                        icon="mdi-dots-vertical"
                        size="small"
                        variant="tonal"
                        v-bind="props"
                      />
                    </template>
                    <SearchableUserList autofocus :items="availableTargets">
                      <template #prepend>
                        <p
                          class="text-caption text-medium-emphasis px-4 pb-2 menu-info"
                        >
                          {{ $t('erMethods.mainSubstDelegate.transferInfo') }}
                        </p>
                        <v-list-item
                          base-color="warning"
                          prepend-icon="mdi-undo"
                          :title="$t('erMethods.mainSubstDelegate.return')"
                          @click="transferActions.delete(t.pk)"
                        />
                        <v-divider class="mb-2" />
                      </template>
                      <template #item="{ item: { disabled, user } }">
                        <v-list-item
                          :disabled="disabled"
                          :subtitle="
                            disabled
                              ? $t(
                                  'erMethods.mainSubstDelegate.voteInOtherGroup'
                                )
                              : undefined
                          "
                          @click="transferActions.update(t.pk, user)"
                        >
                          <template #title>
                            <User :pk="user" userid no-popup />
                          </template>
                        </v-list-item>
                      </template>
                    </SearchableUserList>
                  </v-menu>
                </template>
              </td>
            </tr>
          </tbody>
        </v-table>
      </template>
      <SearchableUserList :items="annotatedMembers">
        <template #item="{ item: m }">
          <v-list-item :subtitle="m.roleTitle">
            <template #prepend>
              <UserAvatar :pk="m.user" />
            </template>
            <template #title>
              <User :pk="m.user" userid />
            </template>
            <template #append>
              <v-menu v-if="canManageVotes && m.canTransfer" max-height="400">
                <template #activator="{ props }">
                  <v-btn
                    v-if="smAndUp"
                    append-icon="mdi-chevron-down"
                    class="mr-1"
                    color="primary"
                    size="small"
                    :text="$t('erMethods.mainSubstDelegate.transfer')"
                    v-bind="props"
                  />
                  <v-btn
                    v-else
                    class="mr-1"
                    icon="mdi-dots-vertical"
                    size="small"
                    variant="tonal"
                    v-bind="props"
                  />
                </template>
                <SearchableUserList autofocus :items="availableTargets">
                  <template #prepend>
                    <p
                      class="text-caption text-medium-emphasis px-4 pb-2 menu-info"
                    >
                      {{ $t('erMethods.mainSubstDelegate.transferInfo') }}
                    </p>
                  </template>
                  <template #item="{ item: { disabled, user } }">
                    <v-list-item
                      :disabled="disabled"
                      :subtitle="
                        disabled
                          ? $t('erMethods.mainSubstDelegate.voteInOtherGroup')
                          : undefined
                      "
                      @click="transferActions.add(m.user, user)"
                    >
                      <template #title>
                        <User :pk="user" userid no-popup />
                      </template>
                    </v-list-item>
                  </template>
                </SearchableUserList>
              </v-menu>
              <template v-if="m.hasVoteInGroup">
                <v-chip
                  v-if="smAndUp"
                  append-icon="mdi-check-circle"
                  color="success"
                  :text="$t('erMethods.mainSubstDelegate.hasVote')"
                />
                <v-icon
                  v-else
                  color="success"
                  icon="mdi-check-circle"
                  :aria-label="$t('erMethods.mainSubstDelegate.hasVote')"
                  :title="$t('erMethods.mainSubstDelegate.hasVote')"
                />
              </template>
            </template>
          </v-list-item>
        </template>
      </SearchableUserList>
      <div class="text-right mt-3">
        <v-btn :text="$t('close')" variant="text" @click="close" />
      </div>
    </template>
  </DefaultDialog>
  <span v-else>-</span>
</template>

<style scoped>
.menu-info {
  max-width: 320px;
}
</style>
