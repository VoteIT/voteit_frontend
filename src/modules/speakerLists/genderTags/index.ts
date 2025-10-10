import { useI18n } from 'vue-i18n'

import { meetingSlotPlugins } from '@/modules/meetings/registry'
import useMeetingComponent from '@/modules/meetings/useMeetingComponent'

import UserMenuItem from './UserMenuItem.vue'
import { speakerAnnotationRegistry } from '../registry'
import useGenderTag from './useGenderTag'
import { getGenderIcon, translateGender } from './utils'

meetingSlotPlugins.register({
  checkActive(meeting) {
    return useMeetingComponent(meeting.pk, 'gtags').componentActive.value
  },
  component: UserMenuItem,
  id: 'gtagsUserMenu',
  slot: 'appendUserMenu'
})

speakerAnnotationRegistry.register({
  checkActive(meeting) {
    return useMeetingComponent(meeting, 'gtags').componentActive.value
  },
  *iterAnnotations(meeting, user, t) {
    const tag = useGenderTag(meeting, user).value
    if (!tag) return
    yield {
      icon: getGenderIcon(tag),
      text: translateGender(t, tag)
    }
  }
})
