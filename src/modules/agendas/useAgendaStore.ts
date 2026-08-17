import { ifilter, sorted } from 'itertools'
import { defineStore } from 'pinia'
import { shallowReactive } from 'vue'

import { channelLeftEvent } from '@/composables/events'

import { AgendaBody, AgendaItem, AgendaState } from './types'
import { LastRead } from '@/utils/types'
import { agendaBodyType, agendaItemType, lastReadType } from './contentTypes'
import { agendaDeletedEvent } from './events'

export default defineStore('agendas', () => {
  const agendaBodies = shallowReactive(new Map<number, AgendaBody>())
  const agendaItems = shallowReactive(new Map<number, AgendaItem>())
  const agendaItemsLastRead = shallowReactive(new Map<number, Date>())

  agendaItemType
    .updateMap(agendaItems, { participants: 'meeting', moderators: 'meeting' })
    .onDeleted((agendaItem) => agendaDeletedEvent.emit(agendaItem.pk))

  // Delete as first event
  agendaDeletedEvent.on((pk) => {
    agendaItems.delete(pk)
    agendaBodies.delete(pk)
  })

  agendaBodyType.updateMap(agendaBodies, { agenda_item: 'pk' })

  /*
   ** Clear private agenda items when leaving moderators channel.
   */
  channelLeftEvent.on(({ channelType, pk }) => {
    if (channelType !== 'moderators') return
    for (const { pk: agendaPk, meeting, state } of agendaItems.values()) {
      if (meeting === pk && state === AgendaState.Private)
        agendaDeletedEvent.emit(agendaPk)
    }
  })

  lastReadType.onChanged((lastRead) => {
    agendaItemsLastRead.set(lastRead.agenda_item, new Date(lastRead.timestamp))
  })

  function getAgendaBody(agendaItem: number) {
    return agendaBodies.get(agendaItem)
  }

  function getAgendaItem(pk: number) {
    return agendaItems.get(pk)
  }

  function getAgendaItems(predicate: (ai: AgendaItem) => boolean) {
    return sorted(ifilter(agendaItems.values(), predicate), (ai) => ai.order)
  }

  function getLastRead(ai: number) {
    return agendaItemsLastRead.get(ai)
  }

  /**
   * Check if an agenda item has new content
   */
  function hasNewContent(agendaItem: AgendaItem): boolean {
    // If no content, there are no new items
    if (!agendaItem.related_modified) return false
    const lastRead = getLastRead(agendaItem.pk)
    // Else, if no lastRead or set to earlier time, there are new items
    return !lastRead || new Date(agendaItem.related_modified) > lastRead
  }

  async function createAgendaItem(meeting: number, title: string) {
    const data = await agendaItemType.api.add({ meeting, title })
    // Only if not already set by channel message. Serializers may differ.
    if (!agendaItems.has(data.pk)) agendaItems.set(data.pk, data)
    return data
  }

  async function updateLastRead(agendaItem: number) {
    const data = await agendaItemType.api.action<LastRead>(
      'update-last-read',
      agendaItem
    )
    agendaItemsLastRead.set(data.agenda_item, new Date(data.timestamp))
  }
  // END AGENDA API

  return {
    createAgendaItem,
    getAgendaBody,
    getAgendaItem,
    getAgendaItems,
    getLastRead,
    hasNewContent,
    updateLastRead
  }
})
