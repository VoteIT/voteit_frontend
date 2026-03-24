import { count, first, imap } from 'itertools'
import { Ref, computed } from 'vue'

import useSpeakerStore from './useSpeakerStore'

/*
 * These functions should all be imported directly. Function call is unneccessary.
 * Possibly use with a meeting ref in future, to get meeting specific systems in som scoped functions.
 */
export default function useSpeakerLists(meeting: Ref<number>) {
  const { anySpeakerList, getSpeakerSystems } = useSpeakerStore()
  const speakerSystems = computed(() => getSpeakerSystems(meeting.value))

  function getUniqueListTitle(title: string): string {
    const roomsIds = speakerSystems.value.map((s) => s.room)
    function checkUnique(title: string) {
      return !anySpeakerList(
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
