import ContentType from '@/contentTypes/ContentType'
import defineChannel from '@/socket/defineChannel'

import { IMeetingRoom } from './types'

export const roomChannel = defineChannel('room')

export const roomType = new ContentType<IMeetingRoom>({
  name: 'room',
  restEndpoint: 'rooms/'
})
