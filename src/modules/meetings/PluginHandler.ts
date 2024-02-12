import PluginHandler from '@/utils/PluginHandler'

import { Meeting } from './types'

export interface MeetingPlugin {
  id: string
  checkActive?: (meeting: Meeting) => boolean
}

export default class MeetingPluginHandler<
  P extends MeetingPlugin
> extends PluginHandler<P> {
  public getActivePlugins(meeting: Meeting): P[] {
    return this.getPlugins((p) => !p.checkActive || p.checkActive(meeting))
  }
}
