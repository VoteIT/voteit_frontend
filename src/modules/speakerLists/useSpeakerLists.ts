import { Predicate, any, count, filter, first, imap } from 'itertools'
import { countBy, orderBy } from 'lodash'
import { Ref, computed, reactive } from 'vue'

import {
  SpeakerList,
  SpeakerSystem,
  Speaker,
  HistoricSpeaker,
  isCurrentSpeaker,
  isHistoricSpeaker
} from './types'
import { speakerListType, speakerSystemType, speakerType } from './contentTypes'

export const speakerSystems = reactive<Map<number, SpeakerSystem>>(new Map())
export const speakerLists = reactive<Map<number, SpeakerList>>(new Map())
const speakers = reactive<Map<number, Speaker>>(new Map())

speakerSystemType.updateMap(speakerSystems, { meeting: 'meeting' })
speakerListType.updateMap(speakerLists, {
  sls: 'speaker_system',
  agenda_item: 'agenda_item'
})
speakerType.updateMap(speakers, { sls: 'sls' })

/**
 * Check in any speaker list matches predicate (lazy way)
 */
export function anySpeakerList(predicate: Predicate<SpeakerList>) {
  return any(speakerLists.values(), predicate)
}

/**
 * Get current speaker for speaker list, if any.
 */
export function getCurrent(list: number) {
  for (const speaker of speakers.values()) {
    if (speaker.speaker_list === list && isCurrentSpeaker(speaker))
      return speaker
  }
}

/**
 * Get sorted speaker history for list, sorted by start time, descending.
 */
export function getHistory(list: number) {
  return orderBy(
    filter(
      speakers.values(),
      (speaker) => speaker.speaker_list === list && isHistoricSpeaker(speaker)
    ),
    'started',
    'desc'
  ) as HistoricSpeaker[]
}

/**
 * Find a speaker system matching a specific predicate.
 * @example
 * findSpeakerSystem((s) => s.room === 1)
 */
export function findSpeakerSystem(predicate: Predicate<SpeakerSystem>) {
  return first(speakerSystems.values(), predicate)
}

export function getSpeakerSystems(
  meeting: number,
  predicate?: Predicate<SpeakerSystem>
) {
  return filter(
    speakerSystems.values(),
    (s) => s.meeting === meeting && (!predicate || predicate(s))
  )
}

/**
 * Generate a getter for times spoken on list.
 * @example
 * const getSpoken = timesSpokenGetter(listId)
 * const spoken = getSpoken(userId)
 */
export function timesSpokenGetter(list: number) {
  const spokenUserIds = getHistory(list).map(({ user }) => user)
  const map = countBy(spokenUserIds)
  return (user: number) => map[user] ?? 0
}

export function getSpeakerLists(predicate: Predicate<SpeakerList>) {
  return filter(speakerLists.values(), predicate)
}

export function getSystemSpeakerLists(systemId: number, agendaItem?: number) {
  return filter(
    speakerLists.values(),
    (list) =>
      list.speaker_system === systemId &&
      (!agendaItem || list.agenda_item === agendaItem)
  )
}

/*
 * These functions should all be imported directly. Function call is unneccessary.
 * Possibly use with a meeting ref in future, to get meeting specific systems in som scoped functions.
 */
export default function useSpeakerLists(meeting: Ref<number>) {
  const speakerSystems = computed(() => getSpeakerSystems(meeting.value))

  function getUniqueListTitle(title: string): string {
    const systemIds = speakerSystems.value.map((s) => s.pk)
    function checkUnique(title: string) {
      return !any(
        speakerLists.values(),
        (list) =>
          systemIds.includes(list.speaker_system) && list.title === title
      )
    }
    if (checkUnique(title)) return title
    return first(
      imap(count(1), (n) => `${title} - ${n}`),
      checkUnique
    )!
  }

  return {
    speakerSystems,
    getUniqueListTitle
  }
}
