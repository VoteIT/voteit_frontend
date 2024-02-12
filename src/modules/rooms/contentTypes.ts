import ContentType from '@/contentTypes/ContentType'
import { IMeetingRoom } from './types'

export const roomType = new ContentType<IMeetingRoom>({
  name: 'room',
  channels: ['room'],
  restEndpoint: 'rooms/',
  restConfig: { alertOnError: false }
})
