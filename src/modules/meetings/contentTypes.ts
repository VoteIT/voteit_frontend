import ContentType from '@/contentTypes/ContentType'
import { MeetingInvite } from './types'

export const meetingInviteType = new ContentType<MeetingInvite>({
  restEndpoint: 'handle-matched-invites/'
})
