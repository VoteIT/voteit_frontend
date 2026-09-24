import { sorted } from 'itertools'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { countMatching } from '@/utils'

import { orgControlPanelPlugins } from './registry'
import './controlPanels'

/**
 * Control panels active for the current organisation, and how many of them
 * require attention. Calls each panel's attention composable, so use it from
 * setup.
 */
export default function useOrgControlPanel() {
  const { t } = useI18n()

  // Panels register at import time, so the set is fixed by now
  const attention = new Map(
    orgControlPanelPlugins
      .getPlugins()
      .map((p) => [p.id, p.useRequiresAttention?.()])
  )

  const panels = computed(() =>
    sorted(
      orgControlPanelPlugins.getActivePlugins().map((panel) => ({
        component: panel.component,
        description: panel.getDescription?.(t),
        icon: panel.icon,
        id: panel.id,
        requiresAttention: !!attention.get(panel.id)?.value,
        title: panel.getTitle(t),
        to: panel.component
          ? { name: 'orgControlPanel', params: { panel: panel.id } }
          : undefined
      })),
      (p) => p.title.toLocaleLowerCase()
    )
  )

  const attentionCount = computed(() =>
    countMatching(panels.value, (p) => p.requiresAttention)
  )

  return { attentionCount, panels }
}
