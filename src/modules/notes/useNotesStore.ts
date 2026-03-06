import { first } from 'itertools'
import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { useStorage } from '@vueuse/core'

import { noteType } from './contentTypes'
import { IProposalNote } from './types'

export default defineStore('notes', () => {
  const notes = reactive(new Map<number, IProposalNote>())
  const hideIntent = useStorage('notes:hiteIntentOnDevice', false)

  noteType.updateMap(notes, { agenda_item: 'agenda_item' })

  function getProposalNote(proposal: number) {
    return first(notes.values(), (n) => n.proposal === proposal)
  }

  return {
    getProposalNote,
    hideIntent
  }
})
