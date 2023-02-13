import ContentType from '@/contentTypes/ContentType'

interface ActiveChangedMsg {
  active: boolean
  meeting: number
  user: number
}

export const activeUserType = new ContentType<ActiveChangedMsg>({
  name: 'active_user'
})
