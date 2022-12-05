import { Component } from 'vue'

import PluginHandler from './PluginHandler'

import type { MeetingPlugin } from './PluginHandler'
import type { Meeting } from './types'
import { ComposerTranslation } from 'vue-i18n'

interface ExportsPlugin extends MeetingPlugin {
  getExports (t: ComposerTranslation, meetingId: number): { title?: string, formats: { format: string, url: string }[] }[]
  getTitle (t: ComposerTranslation): string
}

interface SettingsPlugin extends MeetingPlugin {
  icon: string
  component?: Component<any, { path: string, translationKey: string }>
  getDescription? (t: ComposerTranslation): string
  translationKey: string
  quickComponent?: Component
  isConfigured?: (meeting: Meeting) => boolean
}

export const meetingExportPlugins = new PluginHandler<ExportsPlugin>()
export const meetingSettingsPlugins = new PluginHandler<SettingsPlugin>()
