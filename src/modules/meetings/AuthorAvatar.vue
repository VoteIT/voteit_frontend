<script setup lang="ts">
import UserAvatar from '@/components/UserAvatar.vue'
import { Author, isGroupAuthor } from './types'

defineProps<{
  author: Author
  size?: 'small'
}>()
</script>

<template>
  <v-avatar
    v-if="isGroupAuthor(author)"
    color="secondary"
    icon="mdi-account-multiple"
    :size="size"
  />
  <UserAvatar v-else popup :pk="author.author" :size="size" />
</template>
