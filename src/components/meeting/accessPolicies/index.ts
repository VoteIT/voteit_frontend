/* eslint-disable camelcase */
import { Component } from 'vue'
import { AccessPolicyType } from '@/contentTypes/types'
import Automatic from './Automatic.vue'
import ModeratorApproved from './ModeratorApproved.vue'

const mapping: Record<AccessPolicyType, Component> = {
  automatic: Automatic,
  moderator_approved: ModeratorApproved
}

export default mapping
