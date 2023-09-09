import { BaseContentType } from '@/contentTypes/ContentType'

interface ActiveChangedMsg {
  active: boolean
  meeting: number
  user: number
}

export const activeUserType = new BaseContentType<ActiveChangedMsg>({
  name: 'active_user'
})
