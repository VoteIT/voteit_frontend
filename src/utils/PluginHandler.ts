import { filter } from 'itertools'

export interface BasePlugin {
  id: string
}

export default class PluginHandler<P extends BasePlugin> {
  private plugins: Map<string, P>

  constructor() {
    this.plugins = new Map()
  }

  public getPlugins(predicate: (p: P) => boolean = () => true) {
    return filter(this.plugins.values(), predicate)
  }

  public getPlugin(id: string) {
    return this.plugins.get(id)
  }

  public hasPlugin(id: string) {
    return this.plugins.has(id)
  }

  public register(plugin: P) {
    this.plugins.set(plugin.id, plugin)
  }
}
