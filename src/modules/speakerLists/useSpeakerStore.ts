import { Predicate, any, filter, first, ifilter, sorted } from 'itertools'
import { defineStore } from 'pinia'
import { reactive } from 'vue'

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
import { countBy } from 'lodash'

export default defineStore('speakers', () => {
  const speakerSystems = reactive<Map<number, SpeakerSystem>>(new Map())
  const speakerLists = reactive<Map<number, SpeakerList>>(new Map())
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
  function anySpeakerList(predicate: Predicate<SpeakerList>) {
    return any(speakerLists.values(), predicate)
  }

  function getSpeakerList(list: number) {
    return speakerLists.get(list)
  }

  /**
   * Get current speaker for speaker list, if any.
   */
  function getCurrent(list: number) {
    return first(
      speakers.values(),
      (s) => s.speaker_list === list && isCurrentSpeaker(s)
    ) as CurrentSpeaker | undefined
  }

  /**
   * Get speaker object for user in queue (used to map queue of user ids to speaker objects)
   */
  function userToSpeaker(list: number, user: number) {
    return first(
      speakers.values(),
      (s) => s.speaker_list === list && s.user === user && !isHistoricSpeaker(s)
    )
  }

  /**
   * Get sorted speaker history for list, sorted by start time, descending.
   */
  function getHistory(list: number) {
    return sorted(
      ifilter(
        speakers.values(),
        (speaker) => speaker.speaker_list === list && isHistoricSpeaker(speaker)
      ),
      (sl) => sl.started!,
      true
    ) as HistoricSpeaker[]
  }

  /**
   * Find a speaker system matching a specific predicate.
   * @example
   * findSpeakerSystem((s) => s.room === 1)
   */
  function findSpeakerSystem(predicate: Predicate<SpeakerSystem>) {
    return first(speakerSystems.values(), predicate)
  }

  function getSpeakerSystems(
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
  function timesSpokenGetter(list: number) {
    const spokenUserIds = getHistory(list).map(({ user }) => user)
    const map = countBy(spokenUserIds)
    return (user: number) => map[user] ?? 0
  }

  function getSpeakerLists(predicate: Predicate<SpeakerList>) {
    return filter(speakerLists.values(), predicate)
  }

  /**
   * Get the speaker system object for a room.
   */
  function getRoomSpeakerSystem(room: number) {
    return first(speakerSystems.values(), (sls) => sls.room === room)
  }

  function getRoomSpeakerLists(room: number, agendaItem?: number) {
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

  const listApi = {
    shuffle(list: number) {
      return speakerListType.api.action(list, 'shuffle')
    }
  }

  const speakerApi = {
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

  return {
    listApi,
    speakerApi,
    anySpeakerList,
    findSpeakerSystem,
    getCurrent,
    getHistory,
    getRoomSpeakerLists,
    getRoomSpeakerSystem,
    getSpeakerList,
    getSpeakerLists,
    getSpeakerSystems,
    timesSpokenGetter,
    userToSpeaker
  }
})
