import { any } from 'itertools'

import {
  beforeChannelStateEvent,
  channelLeftEvent,
  getSubscribedChannels
} from '@/socket/defineChannel'
import type { ChannelRef } from '@/socket/defineChannel'

// Utility type to get keys where the property has certain types
type KeysOfType<T, Value> = keyof {
  [K in keyof T as T[K] extends Value ? K : never]: T[K]
}
type Dictionary<T> = { [index: string]: T } // Use 'type' instead of 'interface' Dictionary here

type PKContent = { pk: number }
export type ChannelMap<T extends PKContent> = Dictionary<KeysOfType<T, number>>
type ChannelMapEntry<T extends PKContent> = {
  channelMap: ChannelMap<T>
  map: Map<number, T>
}
const channelMaps: ChannelMapEntry<PKContent>[] = []

/**
 * Check if any subscribed channel type and pk is mapped to an attribute of obj.
 * @param except Channel to disregard. A channel about to redeliver its state
 * does not protect what its previous subscription left behind.
 * @returns true if obj is protected
 */
function checkProtectingChannels<T extends PKContent>(
  obj: T,
  channelMap: ChannelMap<T>,
  except?: ChannelRef
) {
  return any(getSubscribedChannels(), ({ channel_type, pk }) => {
    if (channel_type === except?.channel_type && pk === except.pk) return false
    const attr = channelMap[channel_type]
    return attr && obj[attr] === pk
  })
}

/**
 * Clean up a content map based in registered channel mappings.
 * Any other subscribed channel providing the same object should protect the data.
 */
function cleanupContentType<T extends PKContent>(
  map: Map<number, T>,
  channelMap: ChannelMap<T>
) {
  for (const obj of map.values())
    if (!checkProtectingChannels(obj, channelMap)) map.delete(obj.pk)
}

/**
 * Clean up a channel before its state arrives (just delete all cleanable data)
 */
beforeChannelStateEvent.on((channel) => {
  const { channel_type, pk } = channel
  for (const { channelMap, map } of channelMaps) {
    const attr = channelMap[channel_type]
    if (!attr) continue
    for (const [key, obj] of map.entries()) {
      // Delete only if obj belongs to this channel, and isn't protected from another subscribed channel
      if (obj[attr] !== pk || checkProtectingChannels(obj, channelMap, channel))
        continue
      map.delete(key)
    }
  }
})

/**
 * Set up event to clean all registered content types on channel left event
 */
channelLeftEvent.on(({ channel_type }) => {
  for (const { channelMap, map } of channelMaps)
    if (channel_type in channelMap) cleanupContentType(map, channelMap)
})

export default {
  /**
   * Register content (Map object), providing a mapping of channel types to attributes on the content object.
   * Any content not protected by a currently subscribed channel will be deleted when leaving a registered channel type.
   * @example
   * // agenda item objects can originate from two different channels: 'participants' and 'moderators'
   * // In both cases, the channel pk is found on the object attribute 'meeting'.
   * const agendaItems = new Map<number, AgendaItem>()
   * contentCleanup.register(agendaItems, { participants: 'meeting', moderators: 'meeting' })
   * @param map Map object, mapping the objects primary key to the full object
   * @param channelMap An object, mapping channel types to the attribute on the object pointing to a channels id (number)
   */
  register<T extends PKContent>(
    map: Map<number, T>,
    channelMap: ChannelMap<T>
  ) {
    channelMaps.push({
      channelMap,
      map
    })
  }
}
