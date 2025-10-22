import { orderBy } from 'lodash'
import { computed, MaybeRef, reactive, ref, unref } from 'vue'
import { ComposerTranslation } from 'vue-i18n'

import { sleep } from '@/utils'

import { electoralRegisterType, erMethodType } from '../contentTypes'
import { meetings } from '../useMeetings'
import type { ElectoralRegister, ErMethod } from './types'

// Needs reactive, so that permission checks are run again when an ER is inserted.
const registers = reactive<Map<number, ElectoralRegister>>(new Map())

electoralRegisterType.updateMap(
  registers as Map<number, ElectoralRegister>, // Don't bother about that null value. That's ok.
  { meeting: 'meeting' }
)

const _erMethods = ref<ErMethod[] | null>(null)

async function fetchErMethods() {
  try {
    const { data } = await erMethodType.api.list()
    _erMethods.value = data
  } catch {} // TODO
}

function getErMethod(name: string) {
  return _erMethods.value?.find((erm) => erm.name === name)
}

const fetchingRegisters = new Set<number>() // Register ids that are already being fetched
async function fetchRegister(pk: number, retries = 3) {
  // Wait 250-1250 ms to avoid self-DDOS of fetch when already got value from websocket channel
  await sleep(250 + Math.random())
  if (registers.has(pk) || fetchingRegisters.has(pk)) return // Stop: Got it, or already fetching
  fetchingRegisters.add(pk)
  try {
    const { data } = await electoralRegisterType.api.retrieve(pk)
    registers.set(pk, data)
  } catch (e) {
    if (retries < 1) return console.error(e)
    fetchingRegisters.delete(pk)
    fetchRegister(pk, retries - 1)
  }
  fetchingRegisters.delete(pk)
}

function getRegister(pk: number) {
  if (!registers.has(pk)) fetchRegister(pk) // computed objects will trigger again if registers changes
  return registers.get(pk)
}

function hasWeightedVotes({ weights }: ElectoralRegister) {
  return weights.some(({ weight }) => weight !== 1)
}

const erMethods = computed<ErMethod[] | null>(() => {
  if (!_erMethods.value) fetchErMethods()
  return _erMethods.value
})

export function* getErAttributes(method: ErMethod, t: ComposerTranslation) {
  if (method.handles_active_check)
    yield {
      icon: 'mdi-account-network',
      text: t('electoralRegister.handlesActiveCheck')
    }
  if (method.handles_vote_weight)
    yield {
      icon: 'mdi-account-plus',
      text: t('electoralRegister.handlesVoteWeight')
    }
  if (method.group_votes_active)
    yield {
      icon: 'mdi-account-group',
      text: t('electoralRegister.groupVotesActive')
    }
  if (method.allow_manual)
    yield {
      icon: 'mdi-book-open-variant',
      text: t('electoralRegister.createManual')
    }
  if (method.allow_trigger)
    yield {
      icon: 'mdi-star-check',
      text: t('electoralRegister.triggerWhenever')
    }
}

export default function useElectoralRegisters(meetingId?: MaybeRef<number>) {
  const meeting = computed(() => {
    const meeting = unref(meetingId)
    if (!meeting) return
    return meetings.get(meeting)
  })

  const availableErMethods = computed(() => {
    if (erMethod.value && erMethodLocked.value) return [erMethod.value]
    if (!erMethods.value) return
    return erMethods.value.filter((method) => {
      if (!method.available) return false
      if (method.group_votes_active === null) return true
      return !!meeting.value?.group_votes_active === method.group_votes_active
    })
  })

  const erMethod = computed(() => {
    if (!meetingId) return
    return erMethods.value?.find(
      (erm) => erm.name === meeting.value?.er_policy_name
    )
  })
  const erMethodWeighted = computed(() => erMethod.value?.handles_vote_weight)

  const erMethodAllowsManual = computed(() => erMethod.value?.allow_manual)
  /**
   * If meeting has a dialect, and that dialect dictates an ER method, consider this to be locked
   */
  const erMethodLocked = computed(() => {
    return !!meeting.value?.dialect?.er_policy_name
  })

  async function fetchRegisters() {
    if (!meetingId)
      throw new Error(
        'Call using useElectoralRegisters(Ref<meetingId>) to fetch meeting registers'
      )
    try {
      const { data } = await electoralRegisterType.api.list({
        meeting: unref(meetingId)
      })
      for (const er of data) {
        registers.set(er.pk, er)
      }
    } catch {} // TODO
  }

  function isMeetingER(er: ElectoralRegister | null): er is ElectoralRegister {
    return er?.meeting === unref(meetingId)
  }

  function getWeightInCurrent(user: number) {
    return currentElectoralRegister.value?.weights.find((w) => w.user === user)
      ?.weight
  }

  const sortedRegisters = computed(() => {
    if (!meetingId) return []
    return orderBy(
      [...registers.values()].filter(isMeetingER).map((er) => ({
        ...er,
        hasWeightedVotes: hasWeightedVotes(er)
      })),
      'created',
      'desc'
    )
  })
  const currentElectoralRegister = computed(() => {
    return sortedRegisters.value.at(0)
  })
  const usersInCurrentRegister = computed(() => {
    return new Set(currentElectoralRegister.value?.weights.map((w) => w.user))
  })

  return {
    availableErMethods,
    currentElectoralRegister,
    erMethod,
    erMethodAllowsManual,
    erMethodLocked,
    erMethodWeighted,
    erMethods,
    sortedRegisters,
    usersInCurrentRegister,
    getErMethod,
    getRegister,
    getWeightInCurrent,
    hasWeightedVotes,
    fetchRegisters
  }
}
