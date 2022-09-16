import { DefineComponent } from 'vue'

import PluginHandler from './PluginHandler'

import type { MeetingPlugin } from './PluginHandler'
import type { Meeting } from './types'

interface SettingsPlugin extends MeetingPlugin {
  id: string
  icon: string
  component?: DefineComponent<{}, any, any, any, any, any, any, any, any, any, any>
  translationKey: string
  quickComponent?: DefineComponent<{}, any, any, any, any, any, any, any, any, any, any>
  isConfigured?: (meeting: Meeting) => boolean
}

export const meetingSettingsPlugins = new PluginHandler<SettingsPlugin>()
