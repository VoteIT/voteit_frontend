import Channel from '../Channel'
import ContentType from '../ContentType'
import { PresenceCheck } from '../types'

export default new ContentType<PresenceCheck>({
  channelName: 'presence_system'
})
