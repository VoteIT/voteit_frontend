export interface BasePlugin {
  id: string
}

export default class PluginHandler<P extends BasePlugin> {
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

  public getPlugin (id: string) {
    return this.plugins.get(id)
  }

  public hasPlugin (id: string) {
    return this.plugins.has(id)
  }
}
