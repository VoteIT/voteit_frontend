import TypedEvent from '@/utils/TypedEvent'
import accessPolicy from './accessPolicy'
import agendaItem from './agendaItem'
import Channel from './Channel'
import devLogin from './devLogin'
import discussionPost from './discussionPost'
import electoralRegister from './electoralRegister'
import meeting from './meeting'
import meetingRole from './meetingRole'
import poll from './poll'
import presence from './presence'
import presenceCheck from './presenceCheck'
import proposal from './proposal'
import speakerList from './speakerList'
import speakerSystem from './speakerSystem'

import { WorkflowState } from './types'

interface ContentType {
  naturalKey: string
  workflowState?: WorkflowState[]
  rules?: any
  useWorkflows?: any
  useChannels?: any
  useContentApi?: any
}

type ContentTypes = {
  [ key: string ] : ContentType
}

const contentTypes: ContentTypes = {
  accessPolicy,
  agendaItem,
  devLogin,
  discussionPost,
  electoralRegister,
  meeting,
  meetingRole,
  poll,
  presence,
  presenceCheck,
  proposal,
  speakerList,
  speakerSystem
}

export default contentTypes
