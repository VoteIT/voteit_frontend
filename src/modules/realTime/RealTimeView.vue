<script setup lang="ts">
import { provide } from 'vue'
import { RoleContextKey } from '@/injectionKeys'

import useMeetingChannel from '../meetings/useMeetingChannel'
import useMeeting from '../meetings/useMeeting'

import useRealTime from './useRealTime'
import ClockFace from './ClockFace.vue'

provide(RoleContextKey, 'meeting')

const { meetingId } = useMeeting()
const { leftActive, rightActive, pauseMessage } = useRealTime(meetingId)

useMeetingChannel()

const targetTime = new Date()
targetTime.setHours(targetTime.getHours() + 1)
targetTime.setMinutes(targetTime.getMinutes() + 1)
</script>

<template>
  <div v-if="!leftActive && !rightActive">
    <h2 class="text-center mb-8">
      {{ pauseMessage }}
    </h2>
    <ClockFace :target-time="targetTime" />
  </div>
  <div v-else class="d-flex">
    <div v-if="leftActive" class="left flex-grow-1">
      <h2>Nej men hej</h2>
    </div>
    <div v-if="leftActive && rightActive" class="spacer"></div>
    <div v-if="rightActive" class="right flex-grow-1">
      <h2>
        <em>Hej, men nej!</em>
      </h2>
    </div>
  </div>
</template>

<style scoped lang="sass">
.left,
.right
  flex-basis: 50%
  background-color: rgba(0,0,0,.05)

.spacer
  width: 10px
</style>
