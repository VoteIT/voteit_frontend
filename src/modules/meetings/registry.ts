import { Dictionary } from 'lodash'
import { Component } from 'vue'
import { ComposerTranslation } from 'vue-i18n'

import { MenuItem, TreeMenuLink } from '@/utils/types'
import { RoleMatrixColumn } from '@/components/types'

import PluginHandler from './PluginHandler'
import type { MeetingPlugin } from './PluginHandler'
import type { Meeting, MeetingGroupColumn } from './types'

interface MeetingBubblePlugin extends MeetingPlugin {
  component: Component
  icon: string
  order: number
  requireAttention: boolean | ((meeting?: Meeting) => boolean)
}

interface SettingsTab {
  id: string
  title: string
  component: Component
  icon?: string
  disabled?: boolean
}

interface SettingsPlugin extends MeetingPlugin {
  component?: Component<any, { path: string; translationKey: string }>
  quickComponent?: Component
  icon: string
  route?: {
    name: string
    params?: Dictionary<string | number>
  }
  checkAdvanced?: (meeting: Meeting) => boolean
  isConfigured?(meeting: Meeting): boolean
  isDisabled?(meeting: Meeting): boolean
  getDescription?(t: ComposerTranslation): string
  getTabs?(meeting: Meeting, t: ComposerTranslation): SettingsTab[]
  getTitle(t: ComposerTranslation): string
}

interface MeetingSlotPlugin extends MeetingPlugin {
  slot: 'appendMenu' | 'presenceMain' | 'appendUserMenu'
  component: Component
}

type MeetingRolePlugin = MeetingPlugin & {
  transform(columns: RoleMatrixColumn[], meeting: Meeting): RoleMatrixColumn[]
  contentType: string
}
type MeetingGroupTablePlugin = MeetingPlugin & {
  transform(
    columns: MeetingGroupColumn[],
    meeting: Meeting
  ): MeetingGroupColumn[]
}

export interface MeetingMenuPlugin extends MeetingPlugin {
  getItems(context: {
    meeting: Meeting
    menu: string
    t: ComposerTranslation
  }): MenuItem[]
}

export interface MeetingNavPlugin extends MeetingPlugin {
  iterItems(context: {
    meeting: Meeting
    menu: string
    t: ComposerTranslation
  }): Generator<TreeMenuLink>
}

export const meetingSettingsPlugins = new PluginHandler<SettingsPlugin>()
export const meetingSlotPlugins = new PluginHandler<MeetingSlotPlugin>()
export const meetingRolePlugins = new PluginHandler<MeetingRolePlugin>()
export const meetingGroupTablePlugins =
  new PluginHandler<MeetingGroupTablePlugin>()
export const meetingBubblePlugins = new PluginHandler<MeetingBubblePlugin>()
export const meetingMenuPlugins = new PluginHandler<MeetingMenuPlugin>()
export const meetingNavPlugins = new PluginHandler<MeetingNavPlugin>()
