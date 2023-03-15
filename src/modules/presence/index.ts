import { meetingSettingsPlugins } from '../meetings/registry'

import QuickPanel from './QuickPanel.vue'

meetingSettingsPlugins.register({
  id: 'presence',
  icon: 'mdi-hand-wave',
  getTitle (t) {
    return t('presence.check')
  },
  checkActive (meeting) {
    return !meeting.dialect?.block_components?.includes('presence_check')
  },
  quickComponent: QuickPanel
})
