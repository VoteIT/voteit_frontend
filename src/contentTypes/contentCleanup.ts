import { Dictionary } from 'lodash'
import { channelLeftEvent } from '@/composables/events'
import { socket } from '@/utils/Socket'

type PKContent = { pk: number }
type ChannelMap<T extends PKContent> = Dictionary<keyof T>
type ChannelMapEntry<T extends PKContent> = { map: Map<number, T>, channelMap: ChannelMap<T> }
const channelMaps: ChannelMapEntry<any>[] = []

/**
 * Check if any subscribed channel type and pk is mapped to an attribute of obj
 */
function checkProtectingChannels<T extends PKContent> (obj: T, channelMap: ChannelMap<T>) {
  for (const { channelType, pk } of socket.channels.getSubscribedChannels()) {
    const attr = channelMap[channelType]
    if (attr && obj[attr] === pk) return true
  }
  return false
}

/**
 * Clean up a content map based in registered channel mappings.
 * Any other subscribed channel providing the same object should protect the data.
 */
function cleanupContentType<T extends PKContent> (map: Map<number, T>, channelMap: ChannelMap<T>) {
  for (const obj of map.values()) {
    if (!checkProtectingChannels(obj, channelMap)) map.delete(obj.pk)
  }
}

/**
 * Set up event to clean all registered content types on channel left event
 */
channelLeftEvent.on(({ channelType }) => {
  for (const { channelMap, map } of channelMaps) {
    if (channelType in channelMap) cleanupContentType(map, channelMap)
  }
})

export default {
  register<T extends { pk: number }> (map: Map<number, T>, channelMap: ChannelMap<T>) {
    channelMaps.push({
      channelMap,
      map
    })
  }
}
