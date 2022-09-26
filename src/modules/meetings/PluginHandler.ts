import { Meeting } from './types'

export interface MeetingPlugin {
  id: string,
  checkActive?: (meeting: Meeting) => boolean
}

export default class PluginHandler<P extends MeetingPlugin> {
  private plugins: Map<string, P>

  constructor () {
    this.plugins = new Map()
  }

  public * iterPlugins (filter: (p: P) => boolean) {
    for (const p of this.plugins.values()) {
      if (filter(p)) yield p
    }
  }

  public register (plugin: P) {
    this.plugins.set(plugin.id, plugin)
  }

  public getActivePlugins (meeting: Meeting): P[] {
    return [...this.iterPlugins(p => !p.checkActive || p.checkActive(meeting))]
  }

  public getPlugin (id: string) {
    return this.plugins.get(id)
  }

  public hasPlugin (id: string) {
    return this.plugins.has(id)
  }
}
