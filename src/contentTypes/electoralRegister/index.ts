import ContentType from '../ContentType'
import { ElectoralRegister } from '../types'

export default new ContentType<ElectoralRegister>({
  restEndpoint: 'electoral-registers/'
})
