import { beforeAppStateEvent, channelLeftEvent } from '@/composables/events'
import { socket } from '@/utils/Socket'

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
 * Check if any subscribed channel type and pk is mapped to an attribute of obj
 */
function checkProtectingChannels<T extends PKContent>(
  obj: T,
  channelMap: ChannelMap<T>
) {
  return socket.channels.getSubscribedChannels().some(({ channelType, pk }) => {
    const attr = channelMap[channelType]
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
 * Clean up channels before processing app_state (just delete all cleanable data)
 */
beforeAppStateEvent.on(({ channelType, pk }) => {
  for (const { channelMap, map } of channelMaps) {
    const attr = channelMap[channelType]
    if (!attr) continue
    for (const [key, obj] of map.entries()) {
      if (obj[attr] === pk) map.delete(key)
    }
  }
})

/**
 * Set up event to clean all registered content types on channel left event
 */
channelLeftEvent.on(({ channelType }) => {
  for (const { channelMap, map } of channelMaps)
    if (channelType in channelMap) cleanupContentType(map, channelMap)
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
