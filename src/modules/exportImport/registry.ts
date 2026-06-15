import { ComposerTranslation } from 'vue-i18n'

import PluginHandler, { MeetingPlugin } from '../meetings/PluginHandler'

interface ExportsPlugin extends MeetingPlugin {
  getExports(
    meetingId: number
  ): { title?: string; formats: { format: string; url: string }[] }[]
  getTitle(t: ComposerTranslation): string
}

export const meetingExportPlugins = new PluginHandler<ExportsPlugin>()
