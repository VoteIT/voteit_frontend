import { filter } from 'itertools'
import { computed, MaybeRef, reactive, unref } from 'vue'

import { voteTransferType } from '../contentTypes'
import { GroupMembership, IVoteTransfer } from '../types'
import useMeetingGroups from '../useMeetingGroups'

const voteTransfers = reactive(new Map<number, IVoteTransfer>())

voteTransferType.updateMap(voteTransfers, { meeting: 'meeting' })

export default function useVoteTransfers(meeting: MaybeRef<number>) {
  const transfers = computed(() => {
    const m = unref(meeting)
    return filter(voteTransfers.values(), (vt) => vt.meeting === m)
  })

  const { allGroupMembers, groupRoles } = useMeetingGroups(meeting)

  const mainRole = computed(() =>
    groupRoles.value.find((r) => r.role_id === 'main')
  )
  const substRole = computed(() =>
    groupRoles.value.find((r) => r.role_id === 'substitute')
  )

  function hasMainRole(gm: GroupMembership) {
    return gm.role === substRole.value?.pk
  }

  function hasSubstRole(gm: GroupMembership) {
    return gm.role === mainRole.value?.pk
  }

  function hasVoteRole(gm: GroupMembership) {
    return hasMainRole(gm) || hasSubstRole(gm)
  }

  const freeTargetUsers = computed(() => {
    const targets = new Set(transfers.value.map((t) => t.target))
    const mainUsers = new Set(
      allGroupMembers.value.filter(hasMainRole).map((gm) => gm.user)
    )
    return new Set(
      allGroupMembers.value
        .filter(
          (gm) =>
            hasSubstRole(gm) && !mainUsers.has(gm.user) && !targets.has(gm.user)
        )
        .map((gm) => gm.user)
    )
  })

  function canRecieveVote(user: number) {
    return freeTargetUsers.value.has(user)
  }

  /**
   * Use this to get vote transfers for a particular group, based on main and substitute roles in that group.
   */
  function getForUsers(sources: number[], targets: number[]) {
    return transfers.value.filter(
      ({ source, target }) =>
        sources.includes(source) && targets.includes(target)
    )
  }

  /**
   * API to transfer vote
   */
  const api = {
    add(source: number, target: number) {
      return voteTransferType.api.add({
        meeting: unref(meeting),
        source,
        target
      })
    },
    delete(vt: number) {
      return voteTransferType.api.delete(vt)
    },
    update(vt: number, target: number) {
      return voteTransferType.api.patch(vt, { target })
    }
  }

  return {
    api,
    mainRole,
    substRole,
    voteTransfers: transfers,
    canRecieveVote,
    getForUsers,
    hasMainRole,
    hasSubstRole,
    hasVoteRole
  }
}
