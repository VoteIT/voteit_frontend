import { useStorage } from '@vueuse/core'

type DisplayMode =
  | 'any'
  | 'onlySpeakers'
  | 'onlyProposals'
  | 'prioritizeSpeakers'
  | 'prioritizeProposals'

export const roomDisplayMode = useStorage<DisplayMode>(
  'realtime:displayMode',
  'any'
)
