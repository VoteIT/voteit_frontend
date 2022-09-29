import { Component } from 'vue'

import PluginHandler from './PluginHandler'

import type { MeetingPlugin } from './PluginHandler'
import type { Meeting } from './types'

interface SettingsPlugin extends MeetingPlugin {
  icon: string
  component?: Component<any, { path: string, translationKey: string }>
  translationKey: string
  quickComponent?: Component
  isConfigured?: (meeting: Meeting) => boolean
}

export const meetingSettingsPlugins = new PluginHandler<SettingsPlugin>()
