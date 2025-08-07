import { meetingSlotPlugins } from '@/modules/meetings/registry'
import useMeetingComponent from '@/modules/meetings/useMeetingComponent'

import UserMenuItem from './UserMenuItem.vue'

meetingSlotPlugins.register({
  checkActive(meeting) {
    return useMeetingComponent(meeting.pk, 'gtags').componentActive.value
  },
  component: UserMenuItem,
  id: 'gtagsUserMenu',
  slot: 'appendUserMenu'
})
