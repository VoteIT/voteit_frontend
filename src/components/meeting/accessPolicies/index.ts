/* eslint-disable camelcase */
import { Component } from 'vue'
import { AccessPolicyType } from '@/contentTypes/types'
import Automatic from './Automatic.vue'
import ModeratorApproved from './ModeratorApproved.vue'

type APMapping = {
  [ key in AccessPolicyType ]: Component
}

export default {
  automatic: Automatic,
  moderator_approved: ModeratorApproved
} as APMapping
