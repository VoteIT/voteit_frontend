import { Meeting } from './types'

export interface MeetingPlugin {
  checkActive?: (meeting: Meeting) => boolean
}

export default class PluginHandler<P extends MeetingPlugin> {
  private plugins: P[]

  constructor () {
    this.plugins = []
  }

  public register (plugin: P) {
    this.plugins.push(plugin)
  }

  public getActivePlugins (meeting: Meeting): P[] {
    return this.plugins.filter(p => !p.checkActive || p.checkActive(meeting))
  }
}
