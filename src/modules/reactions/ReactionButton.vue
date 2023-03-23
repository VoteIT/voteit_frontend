<template>
  <RealReactionButton
    :button="button"
    :count="count"
    :disabled="!canReact"
    :list-disabled="!canListReactions"
    v-model="reacted"
    @list-open="fetchUsers"
  >
    <template #userList>
      <UserList :userIds="reactionUsers" />
    </template>
  </RealReactionButton>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

import UserList from '@/components/UserList.vue'

import useReactions from './useReactions'
import { canAddReaction, canDeleteReaction, canListReactions as canList } from './rules'
import { ReactionButton, ReactionRelation } from './types'
import RealReactionButton from './RealReactionButton.vue'

const props = defineProps<{ button: ReactionButton, relation: ReactionRelation }>()

const { fetchReactions, getUserReaction, setUserReacted, removeUserReacted, getButtonReactionCount } = useReactions()
const reaction = computed(() => getUserReaction(props.button, props.relation))
const count = computed(() => getButtonReactionCount(props.button, props.relation))
const reactionUsers = ref<number[]>([])
async function fetchUsers () {
  const data = await fetchReactions(props.button, props.relation)
  reactionUsers.value = data.users
}

const reacted = computed({
  get () {
    return !!reaction.value
  },
  set (value) {
    const method = value
      ? setUserReacted
      : removeUserReacted
    method(props.button, props.relation)
  }
})

const canReact = computed(() => reaction.value ? canDeleteReaction(reaction.value) : canAddReaction(props.button))
const canListReactions = computed(() => !!count.value && canList(props.button))
</script>
