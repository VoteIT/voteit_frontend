import { paramPk } from '@/loader/channelRequirement'
import type { RequirementFactory } from '@/loader/types'
import { openAlertEvent } from '@/utils/events'
import { t } from '@/utils/locales'

import useERStore from './useERStore'

/**
 * The meeting's electoral registers. A failure is reported and shrugged off -
 * the view has plenty to show without them, and blocking the navigation over
 * it would leave the user nowhere.
 */
export const electoralRegisterRequirement: RequirementFactory = (to) => {
  const pk = paramPk(to, 'id')
  if (!pk) return
  const { fetchMeetingRegisters } = useERStore()
  return {
    key: `electoral-registers/${pk}`,
    async load() {
      try {
        await fetchMeetingRegisters(pk)
      } catch {
        openAlertEvent.emit('^' + t('electoralRegister.fetchFailed'))
      }
    }
  }
}
