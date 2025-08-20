<script setup lang="ts">
import { any, sorted } from 'itertools'
import { computed } from 'vue'

import { getFullName } from '@/utils'
import { userId } from '@/composables/useAuthentication'
import DefaultDialog from '@/components/DefaultDialog.vue'
import User from '@/components/User.vue'
import UserAvatar from '@/components/UserAvatar.vue'

import useUserDetails from '@/modules/organisations/useUserDetails'

import { GroupMembership, MeetingGroup } from '../types'
import useMeetingGroups from '../useMeetingGroups'
import useVoteTransfers from '../electoralRegisters/useVoteTransfers'
import useMeeting from '../useMeeting'

const props = defineProps<{
  group: MeetingGroup & { memberships: GroupMembership[] }
}>()

const { allGroupMembers, getMeetingGroup, getRole } = useMeetingGroups(
  props.group.meeting
)
const { isModerator } = useMeeting()
const { getUser } = useUserDetails()
const {
  api,
  canRecieveVote,
  getForUsers,
  hasMainRole,
  hasSubstRole,
  hasVoteRole
} = useVoteTransfers(props.group.meeting)

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

const groupTransfers = computed(() =>
  getForUsers(mains.value, substitutes.value).map((t) => ({
    ...t,
    canManage:
      isModerator.value ||
      t.source === userId.value ||
      t.target === userId.value
  }))
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
    //
    const problems = hasMainRole(gm) ? others : others.filter(hasMainRole)
    for (const problem of problems) {
      yield {
        fullName: getFullName(user),
        groupName: getMeetingGroup(problem.meeting_group)?.title ?? '?',
        roleName: getRole(problem.role)?.title ?? '?',
        userid: user.userid
      }
    }
  }
}

const roleProblems = computed(() => [...iterRoleProblems()])
const hasRoleProblem = computed(() => any(iterRoleProblems()))

function orderByName(gm: { user: number }) {
  const user = getUser(gm.user)
  if (!user) return ''
  return getFullName(user)
}

const annotatedMembers = computed(() =>
  sorted(
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
          (isModerator.value || gm.user === userId.value),
        hasVoteInGroup: !transfer === isMain,
        roleTitle: getRole(gm.role)?.title
      }
    }),
    orderByName
  )
)

const canManageVotes = computed(
  () =>
    isModerator.value ||
    props.group.memberships.some(
      (gm) => gm.user === userId.value && gm.role && hasVoteRole(gm)
    )
)
</script>

<template>
  <DefaultDialog
    :title="$t('erMethods.mainSubstDelegate.votesIn', { ...group })"
  >
    <template #activator="{ props }">
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
    </template>
    <template #default="{ close }">
      <v-alert
        v-if="roleProblems.length"
        class="mb-3"
        :text="$t('erMethods.mainSubstDelegate.mainProblemText')"
        :title="$t('erMethods.mainSubstDelegate.mainProblemTitle')"
        type="warning"
      >
        <ul class="my-2">
          <li v-for="problem in roleProblems">
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
      <v-list>
        <v-list-item v-for="m in annotatedMembers" :subtitle="m.roleTitle">
          <template #prepend>
            <UserAvatar :pk="m.user" />
          </template>
          <template #title>
            <User :pk="m.user" userid />
          </template>
          <template #append>
            <v-menu v-if="canManageVotes && m.canTransfer">
              <template #activator="{ props }">
                <v-btn
                  append-icon="mdi-chevron-down"
                  class="mr-2"
                  color="primary"
                  size="small"
                  :text="$t('erMethods.mainSubstDelegate.transfer')"
                  v-bind="props"
                />
              </template>
              <v-list>
                <v-list-item
                  v-for="{ disabled, user } in availableTargets"
                  :disabled="disabled"
                  :subtitle="
                    disabled
                      ? $t('erMethods.mainSubstDelegate.voteInOtherGroup')
                      : undefined
                  "
                  @click="api.add(m.user, user)"
                >
                  <template #title>
                    <User :pk="user" userid no-popup />
                  </template>
                </v-list-item>
              </v-list>
            </v-menu>
            <v-chip
              v-if="m.hasVoteInGroup"
              append-icon="mdi-check-circle"
              color="success"
              :text="$t('erMethods.mainSubstDelegate.hasVote')"
            />
          </template>
        </v-list-item>
      </v-list>
      <h2 v-if="groupTransfers.length">Överföringar</h2>
      <v-table v-if="groupTransfers.length">
        <thead>
          <tr>
            <th>Från</th>
            <th></th>
            <th>Till</th>
            <th v-if="canManageVotes"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in groupTransfers">
            <td><User :pk="t.source" userid /></td>
            <td><v-icon icon="mdi-arrow-right" /></td>
            <td><User :pk="t.target" userid /></td>
            <td v-if="t.canManage">
              <v-menu>
                <template #activator="{ props }">
                  <v-btn
                    append-icon="mdi-chevron-down"
                    color="primary"
                    size="small"
                    :text="$t('erMethods.mainSubstDelegate.change')"
                    v-bind="props"
                  />
                </template>
                <v-list>
                  <v-list-item
                    v-for="{ disabled, user } in availableTargets"
                    :disabled="disabled"
                    :subtitle="
                      disabled
                        ? $t('erMethods.mainSubstDelegate.voteInOtherGroup')
                        : undefined
                    "
                    @click="api.update(t.pk, user)"
                  >
                    <template #title>
                      <User :pk="user" userid no-popup />
                    </template>
                  </v-list-item>
                  <v-list-item
                    append-icon="mdi-undo"
                    base-color="warning"
                    :title="$t('erMethods.mainSubstDelegate.return')"
                    @click="api.delete(t.pk)"
                  />
                </v-list>
              </v-menu>
            </td>
          </tr>
        </tbody>
      </v-table>
      <div class="text-right mt-3">
        <v-btn :text="$t('close')" variant="text" @click="close" />
      </div>
    </template>
  </DefaultDialog>
  <v-tooltip
    v-if="hasRoleProblem"
    :text="$t('erMethods.mainSubstDelegate.mainProblemTitle')"
  >
    <template #activator="{ props }">
      <v-icon class="ml-1" color="red" icon="mdi-alert" v-bind="props" />
    </template>
  </v-tooltip>
</template>
