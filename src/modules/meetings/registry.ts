import { Dictionary } from 'lodash'
import { Component, Ref } from 'vue'
import { ComposerTranslation } from 'vue-i18n'

import { MenuItem } from '@/utils/types'
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

interface ExportsPlugin extends MeetingPlugin {
  getExports(
    t: ComposerTranslation,
    meetingId: number
  ): { title?: string; formats: { format: string; url: string }[] }[]
  getTitle(t: ComposerTranslation): string
}

interface SettingsPlugin extends MeetingPlugin {
  component?: Component<any, { path: string; translationKey: string }>
  quickComponent?: Component
  icon: string
  route?: {
    name: string
    params?: Dictionary<string | number>
  }
  isConfigured?(meeting: Meeting): boolean
  isDisabled?(meeting: Meeting): boolean
  getDescription?(t: ComposerTranslation): string
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

export interface MeetingInviteAnnotationPlugin<
  T extends { name: string } = { name: string }
> extends MeetingPlugin {
  getTranslator?(
    t: ComposerTranslation,
    meeting: Ref<number>
  ): (annotation: T) => { subtitle?: string; title: string }
  getPossibleValues?(
    meeting: Meeting
  ): { value: string; description?: string }[]
}

export interface MeetingMenuPlugin extends MeetingPlugin {
  getItems(context: {
    meeting: Meeting
    menu: string
    t: ComposerTranslation
  }): MenuItem[]
}

export const meetingExportPlugins = new PluginHandler<ExportsPlugin>()
export const meetingSettingsPlugins = new PluginHandler<SettingsPlugin>()
export const meetingSlotPlugins = new PluginHandler<MeetingSlotPlugin>()
export const meetingRolePlugins = new PluginHandler<MeetingRolePlugin>()
export const meetingGroupTablePlugins =
  new PluginHandler<MeetingGroupTablePlugin>()
export const meetingBubblePlugins = new PluginHandler<MeetingBubblePlugin>()
export const meetingInviteAnnotationPlugins =
  new PluginHandler<MeetingInviteAnnotationPlugin>()
export const meetingMenuPlugins = new PluginHandler<MeetingMenuPlugin>()
