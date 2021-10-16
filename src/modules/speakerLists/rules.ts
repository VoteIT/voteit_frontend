import meetingRules from '@/contentTypes/meeting/rules'

import { meetings } from '../meetings/useMeetings'

import { SpeakerSystem, SpeakerSystemState } from './types'

function systemIsArchived (system: SpeakerSystem): boolean {
  return system.state === SpeakerSystemState.Archived
}

export function canChangeSpeakerSystem (system: SpeakerSystem): boolean {
  const meeting = meetings.get(system.meeting)
  return meetingRules.isModerator(meeting) && meetingRules.isActive(meeting) && !systemIsArchived(system)
}
