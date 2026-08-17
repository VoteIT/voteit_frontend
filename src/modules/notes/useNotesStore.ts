import { first } from 'itertools'
import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'
import { useStorage } from '@vueuse/core'

import IndexedMap from '@/utils/IndexedMap'
import { noteType } from './contentTypes'
import { IProposalNote } from './types'

export default defineStore('notes', () => {
  const notes = shallowReactive(
    new IndexedMap<IProposalNote, 'proposal'>({ proposal: (n) => n.proposal })
  )
  const hideIntent = useStorage('notes:hiteIntentOnDevice', false)

  noteType.updateMap(notes, { agenda_item: 'agenda_item' })

  function getProposalNote(proposal: number) {
    return first(notes.iterBy('proposal', proposal))
  }

  return {
    getProposalNote,
    hideIntent
  }
})
