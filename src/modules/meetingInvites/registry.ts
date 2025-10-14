import { Ref } from 'vue'
import { ComposerTranslation } from 'vue-i18n'

import PluginHandler from '@/utils/PluginHandler'

import { Meeting } from '../meetings/types'
import { MeetingPlugin } from '../meetings/PluginHandler'

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

export const meetingInviteAnnotationPlugins = new PluginHandler<
  MeetingInviteAnnotationPlugin<any>
>()
