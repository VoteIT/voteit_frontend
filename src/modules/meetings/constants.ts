import { MeetingRole } from './types';

export const DEFAULT_ROLE_ORDER = [
  MeetingRole.Participant,
  MeetingRole.Moderator,
  MeetingRole.Participant,
  MeetingRole.PotentialVoter,
  MeetingRole.Proposer,
  MeetingRole.Discusser
]
