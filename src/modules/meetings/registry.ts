import { Component, ComputedRef } from 'vue'

import PluginHandler from './PluginHandler'

import type { MeetingPlugin } from './PluginHandler'
import type { Meeting, MeetingGroupColumn } from './types'
import { ComposerTranslation } from 'vue-i18n'
import { RoleMatrixColumn } from '@/components/types'

interface MeetingBubblePlugin extends MeetingPlugin {
  component: Component
  icon: string
  order: number
  requireAttention: ComputedRef<boolean>
}

interface ExportsPlugin extends MeetingPlugin {
  getExports (t: ComposerTranslation, meetingId: number): { title?: string, formats: { format: string, url: string }[] }[]
  getTitle (t: ComposerTranslation): string
}

interface SettingsPlugin extends MeetingPlugin {
  icon: string
  isConfigured? (meeting: Meeting): boolean
  isDisabled? (meeting: Meeting): boolean
  component?: Component<any, { path: string, translationKey: string }>
  getDescription? (t: ComposerTranslation): string
  getTitle (t: ComposerTranslation): string
  quickComponent?: Component
}

interface MeetingSlotPlugin extends MeetingPlugin {
  slot: 'appendMenu' | 'presenceMain'
  component: Component
}

type MeetingRolePlugin = MeetingPlugin & { transform (columns: RoleMatrixColumn[], meeting: Meeting): RoleMatrixColumn[], contentType: string }
type MeetingGroupTablePlugin = MeetingPlugin & { transform (columns: MeetingGroupColumn[], meeting: Meeting): MeetingGroupColumn[] }

export const meetingExportPlugins = new PluginHandler<ExportsPlugin>()
export const meetingSettingsPlugins = new PluginHandler<SettingsPlugin>()
export const meetingSlotPlugins = new PluginHandler<MeetingSlotPlugin>()
export const meetingRolePlugins = new PluginHandler<MeetingRolePlugin>()
export const meetingGroupTablePlugins = new PluginHandler<MeetingGroupTablePlugin>()
export const meetingBubblePlugins = new PluginHandler<MeetingBubblePlugin>()
