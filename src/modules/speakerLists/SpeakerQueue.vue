<script setup lang="ts">
import { computed, ref } from 'vue'

import User from '@/components/User.vue'

import useAuthStore from '../auth/useAuthStore'

import { SpeakerList } from './types'

const props = defineProps<{
  list: SpeakerList
}>()

const authStore = useAuthStore()

const queue = computed(() =>
  props.list.queue.filter((user) => user !== props.list.current)
)

const expandQueue = ref(false)
</script>

<template>
  <div class="speaker-queue">
    <h4>
      {{ $t('speaker.queue') }}
      <v-btn
        :class="{ expanded: expandQueue }"
        variant="text"
        size="small"
        v-if="
          queue.length > 1 &&
          (queue.length !== 2 || queue[1] !== authStore.user?.pk)
        "
        @click="expandQueue = !expandQueue"
        icon="mdi-chevron-down"
      />
    </h4>
    <div v-if="queue.length" class="mb-2">
      <template v-for="(userPk, i) in queue" :key="userPk">
        <v-expand-transition>
          <div
            :class="{ self: userPk === authStore.user?.pk }"
            v-show="expandQueue || i === 0 || userPk === authStore.user?.pk"
          >
            {{ i + 1 }}. <User :pk="userPk" />
          </div>
        </v-expand-transition>
      </template>
    </div>
    <p v-else class="mb-2">
      <em>{{ $t('speaker.queueEmpty') }}</em>
    </p>
  </div>
</template>

<style scoped lang="sass">
.self
  font-weight: 700

.mdi-chevron-down
  transition: transform .2s
.expanded .mdi-chevron-down
  transform: rotate(180deg)
</style>
