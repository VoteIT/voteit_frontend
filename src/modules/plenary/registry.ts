import { Component } from 'vue'
import { Proposal } from '../proposals/types'
import { ComposerTranslation } from 'vue-i18n'

interface IPlenaryCustomSuggestion {
  getComponent<Props extends {}>(
    proposals: Proposal[]
  ): { component: Component<Props>; props: Props } | void
  getTitle(t: ComposerTranslation): string
}
interface IPlenaryTagSuggestion {
  getTags(proposals: Proposal[]): { tag: string; count: number }[]
  getTitle(t: ComposerTranslation): string
  style?: string
}
type IMixedSuggestion = IPlenaryCustomSuggestion | IPlenaryTagSuggestion

export function isTagSuggestion(
  plugin: IMixedSuggestion
): plugin is IPlenaryTagSuggestion {
  return 'getTags' in plugin
}

class PlenarySuggestions {
  private plugins: IMixedSuggestion[]

  constructor() {
    this.plugins = []
  }

  register(plugin: IMixedSuggestion) {
    this.plugins.push(plugin)
  }

  *iterPlugins(t: ComposerTranslation, proposals: Proposal[]) {
    if (!proposals.length) return
    for (const plugin of this.plugins) {
      if (isTagSuggestion(plugin)) {
        const tags = plugin.getTags(proposals)
        if (tags.length)
          yield {
            style: plugin.style,
            title: plugin.getTitle(t),
            tags,
            v: 'tags' as const
          }
      } else {
        const component = plugin.getComponent(proposals)
        if (component)
          yield { ...component, title: plugin.getTitle(t), v: 'cust' as const }
      }
    }
  }
}

export const plenarySuggestions = new PlenarySuggestions()
