<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

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
import { sorted } from 'itertools'

const props = defineProps<{
  group: MeetingGroup & { memberships: GroupMembership[] }
}>()

const { t } = useI18n()
const { allGroupMembers, groupRoles, getMeetingGroup } = useMeetingGroups(
  props.group.meeting
)
const { isModerator } = useMeeting() // TODO: Permissions for all actions
const { getUser } = useUserDetails()
const {
  api,
  canRecieveVote,
  getForUsers,
  hasMainRole,
  hasSubstRole,
  hasVoteRole
} = useVoteTransfers(props.group.meeting)

const mains = computed(() => {
  const roleId = groupRoles.value.find((r) => r.role_id === 'main')?.pk
  return props.group.memberships
    .filter((gm) => gm.role === roleId)
    .map((gm) => gm.user)
})

const substitutes = computed(() => {
  const roleId = groupRoles.value.find((r) => r.role_id === 'substitute')?.pk
  return props.group.memberships
    .filter((gm) => gm.role === roleId)
    .map((gm) => gm.user)
})

const groupTransfers = computed(() =>
  getForUsers(mains.value, substitutes.value)
)

function joinGroupNames(memberships: GroupMembership[]) {
  return memberships
    .map((o) => getMeetingGroup(o.meeting_group)?.title ?? '?')
    .join(', ')
}

function* iterProblemMembers() {
  for (const gm of props.group.memberships) {
    if (!gm.role) continue
    const others = allGroupMembers.value.filter(
      (other) =>
        other.pk !== gm.pk && other.user === gm.user && hasVoteRole(other)
    )
    if (!others.length) continue
    const user = getUser(gm.user)
    if (!user) continue
    const translationBase = {
      ...user,
      fullName: getFullName(user)
    }
    if (hasMainRole(gm))
      yield t('erMethods.mainSubstDelegate.mainProblemDetails', {
        ...translationBase,
        count: others.length,
        groupNames: joinGroupNames(others)
      })
    const mainRoles = others.filter(hasMainRole)
    if (hasSubstRole(gm) && mainRoles.length)
      yield t('erMethods.mainSubstDelegate.mainProblemSubstDetails', {
        ...translationBase,
        count: mainRoles.length,
        groupNames: joinGroupNames(mainRoles)
      })
  }
}

const problemMembers = computed(() => [...iterProblemMembers()])

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

function orderByName(gm: { user: number }) {
  const user = getUser(gm.user)
  if (!user) return ''
  return getFullName(user)
}

const annotatedMembers = computed(() =>
  sorted(
    props.group.memberships
      .filter((gm) => gm.role && hasVoteRole(gm))
      .map((gm) => {
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
          roleTitle: groupRoles.value.find((gr) => gr.pk === gm.role)?.title
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
        v-if="problemMembers.length"
        class="mb-3"
        :text="$t('erMethods.mainSubstDelegate.mainProblemText')"
        :title="$t('erMethods.mainSubstDelegate.mainProblemTitle')"
        type="warning"
      >
        <ul class="my-2">
          <li v-for="problem in problemMembers">• {{ problem }}</li>
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
            <td v-if="canManageVotes">
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
    v-if="problemMembers.length"
    :text="$t('erMethods.mainSubstDelegate.mainProblemTitle')"
  >
    <template #activator="{ props }">
      <v-icon class="ml-1" color="red" icon="mdi-alert" v-bind="props" />
    </template>
  </v-tooltip>
</template>
