import { first } from 'itertools'
import { defineStore } from 'pinia'
import { reactive } from 'vue'

import { noteType } from './contentTypes'
import { IProposalNote } from './types'

export default defineStore('notes', () => {
  const notes = reactive(new Map<number, IProposalNote>())

  noteType.updateMap(notes, { agenda_item: 'agenda_item' })

  function getProposalNote(proposal: number) {
    return first(notes.values(), (n) => n.proposal === proposal)
  }

  return {
    getProposalNote
  }
})
