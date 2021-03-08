/* eslint-disable camelcase */
import { DefineComponent } from 'vue'
import { AccessPolicyType } from '@/contentTypes/types'
import Automatic from './Automatic.vue'
import ModeratorApproved from './ModeratorApproved.vue'

type APMapping = {
  [ key in AccessPolicyType ]: DefineComponent
}

export default {
  automatic: Automatic,
  moderator_approved: ModeratorApproved
} as APMapping
