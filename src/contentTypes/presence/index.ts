import Channel from '../Channel'
import ContentType from '../ContentType'
import { Presence } from '../types'

export default new ContentType<Presence>({
  channelName: 'presence'
})
