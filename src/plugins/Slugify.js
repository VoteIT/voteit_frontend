import { slugify } from '@/utils'

export default {
  install (app) {
    app.config.globalProperties.$slugify = slugify
  }
}
