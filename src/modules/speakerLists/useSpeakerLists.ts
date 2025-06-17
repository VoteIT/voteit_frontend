import { Predicate, any, count, filter, first, imap } from 'itertools'
import { countBy, orderBy } from 'lodash'
import { Ref, computed, reactive } from 'vue'

import {
  SpeakerList,
  SpeakerSystem,
  Speaker,
  HistoricSpeaker,
  isCurrentSpeaker,
  isHistoricSpeaker,
  CurrentSpeaker
} from './types'
import { speakerListType, speakerSystemType, speakerType } from './contentTypes'

export const speakerSystems = reactive<Map<number, SpeakerSystem>>(new Map())
export const speakerLists = reactive<Map<number, SpeakerList>>(new Map())
const speakers = reactive<Map<number, Speaker>>(new Map())

speakerSystemType.updateMap(speakerSystems, { meeting: 'meeting' })
speakerListType.updateMap(speakerLists, {
  room: 'room',
  agenda_item: 'agenda_item'
})
speakerType.updateMap(speakers, { room: 'room' })

/**
 * Check if any speaker list matches predicate (lazy way)
 */
export function anySpeakerList(predicate: Predicate<SpeakerList>) {
  return any(speakerLists.values(), predicate)
}

/**
 * Get current speaker for speaker list, if any.
 */
export function getCurrent(list: number) {
  return first(
    speakers.values(),
    (s) => s.speaker_list === list && isCurrentSpeaker(s)
  ) as CurrentSpeaker | undefined
}

/**
 * Get speaker object for user in queue (used to map queue of user ids to speaker objects)
 */
export function userToSpeaker(list: number, user: number) {
  return first(
    speakers.values(),
    (s) => s.speaker_list === list && s.user === user && !isHistoricSpeaker(s)
  )
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

/**
 * Get the speaker system object for a room.
 */
export function getRoomSpeakerSystem(room: number) {
  return first(speakerSystems.values(), (sls) => sls.room === room)
}

export function getRoomSpeakerLists(room: number, agendaItem?: number) {
  const speakerSystem = getRoomSpeakerSystem(room)
  return filter(
    speakerLists.values(),
    (list) =>
      list.room === room && (!agendaItem || list.agenda_item === agendaItem)
  ).map((l) => ({
    ...l,
    isActive: l.pk === speakerSystem?.active_list
  }))
}

export const listApi = {
  shuffle(list: number) {
    return speakerListType.api.action(list, 'shuffle')
  }
}

export const speakerApi = {
  add(speaker_list: number, user: number) {
    return speakerType.api.add({ speaker_list, user })
  },
  delete(speaker: number) {
    return speakerType.api.delete(speaker)
  },
  start(speaker: number) {
    return speakerType.api.action(speaker, 'start')
  },
  stop(speaker: number) {
    return speakerType.api.action(speaker, 'stop')
  },
  undo(speaker: number) {
    return speakerType.api.action(speaker, 'undo')
  }
}

/*
 * These functions should all be imported directly. Function call is unneccessary.
 * Possibly use with a meeting ref in future, to get meeting specific systems in som scoped functions.
 */
export default function useSpeakerLists(meeting: Ref<number>) {
  const speakerSystems = computed(() => getSpeakerSystems(meeting.value))

  function getUniqueListTitle(title: string): string {
    const roomsIds = speakerSystems.value.map((s) => s.room)
    function checkUnique(title: string) {
      return !any(
        speakerLists.values(),
        (list) => roomsIds.includes(list.room) && list.title === title
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
