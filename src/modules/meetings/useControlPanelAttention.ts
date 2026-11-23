import { computed } from 'vue'
import { createSharedComposable } from '@vueuse/core'

import { meetingSettingsPlugins } from './registry'
import useMeeting from './useMeeting'
import useRequiredComponent from './useRequiredComponent'
import './controlPanels'

/**
 * Which meeting control panels require attention. Calls each panel's
 * attention composable, so use it from setup.
 */
function useControlPanelAttention() {
  const { canChange, meeting } = useMeeting()

  // Panels register at import time, so the set is fixed by now
  const attention = new Map(
    meetingSettingsPlugins.getPlugins().map((p) => [
      p.id,
      // Panels for meeting components have the component name as id
      p.useRequiresAttention?.() ?? useRequiredComponent(p.id).warnRequired
    ])
  )

  const attentionIds = computed(() => {
    if (!meeting.value || !canChange.value) return new Set<string>()
    return new Set(
      meetingSettingsPlugins
        .getActivePlugins(meeting.value)
        .filter((p) => attention.get(p.id)?.value)
        .map((p) => p.id)
    )
  })

  function requiresAttention(id: string) {
    return attentionIds.value.has(id)
  }

  const hasAttention = computed(() => attentionIds.value.size > 0)

  return { attentionIds, hasAttention, requiresAttention }
}

/**
 * Shared between components, so each panel's attention composable (and
 * whatever it fetches) runs once, however many places show attention.
 */
export default createSharedComposable(useControlPanelAttention)
