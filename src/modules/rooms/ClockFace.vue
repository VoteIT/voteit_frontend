<script setup lang="ts">
import { computed, ref } from 'vue'
import { useIntervalFn } from '@vueuse/core'

const props = defineProps<{
  targetTime?: Date
}>()

function getTime(date: Date) {
  const time =
    date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds() * 1
  return {
    hours: (time / 60 / 12) * 6,
    minutes: (time / 60) * 6
  }
}

const target = computed(() => props.targetTime && getTime(props.targetTime))
const hours = ref(0)
const minutes = ref(0)

// eslint-disable-next-line vue/return-in-computed-property
const timeToGo = computed(() => {
  if (!target.value) return
  const minutesToGo = target.value.minutes - minutes.value
  if (minutesToGo <= 0) return
  if (minutesToGo < 360)
    return {
      '--start': minutes.value,
      '--time': minutesToGo % 360
    }
  // const hoursToGo = target.value.hours - hours.value
  // if (hoursToGo < 360)
  //   return {
  //     '--start': hours.value,
  //     '--time': hoursToGo % 360
  //   }
})

function updateTime() {
  const now = getTime(new Date())
  hours.value = now.hours
  minutes.value = now.minutes
}

updateTime()
useIntervalFn(updateTime, 250)
</script>

<template>
  <div class="clock" style="--clock-size: min(calc(100vw - 60px), 400px)">
    <div
      v-if="timeToGo"
      class="pie"
      :style="{ ...timeToGo, '--b': '10px' }"
    ></div>
    <div class="face-outline">
      <div v-for="n in 12" :key="n" :class="`point-${n}`"></div>
    </div>
    <div class="hands">
      <div class="hour" :style="{ transform: `rotate(${hours}deg)` }"></div>
      <div class="minute" :style="{ transform: `rotate(${minutes}deg)` }"></div>
    </div>
    <div class="face-centre"></div>
  </div>
</template>

<style scoped lang="sass">
.clock
  box-sizing: content-box
  position: relative
  border: calc(var(--clock-size) * .01) solid rgba(var(--v-theme-secondary), .2)
  background-color: rgba(var(--v-theme-secondary), .1)
  border-radius: 50%
  height: var(--clock-size)
  width: var(--clock-size)
  margin-left: auto
  margin-right: auto

.face-outline > div
  position: absolute
  background: rgba(var(--v-theme-secondary), .2)
  width: calc(var(--clock-size) * .05)
  height: calc(var(--clock-size) * .05)
  left: calc(var(--clock-size) * .475)
  top: calc(var(--clock-size) * .05)
  border-radius: 100%
  -webkit-transform-origin: 50% calc(var(--clock-size) * .45)
  transform-origin: 50% calc(var(--clock-size) * .45)

.point-1
  -webkit-transform: rotate(30deg)
  transform: rotate(30deg)
.point-2
  -webkit-transform: rotate(60deg)
  transform: rotate(60deg)
.point-3
  -webkit-transform: rotate(90deg)
  transform: rotate(90deg)
.point-4
  -webkit-transform: rotate(120deg)
  transform: rotate(120deg)
.point-5
  -webkit-transform: rotate(150deg)
  transform: rotate(150deg)
.point-6
  -webkit-transform: rotate(180deg)
  transform: rotate(180deg)
.point-7
  -webkit-transform: rotate(210deg)
  transform: rotate(210deg)
.point-8
  -webkit-transform: rotate(240deg)
  transform: rotate(240deg)
.point-9
  -webkit-transform: rotate(270deg)
  transform: rotate(270deg)
.point-10
  -webkit-transform: rotate(300deg)
  transform: rotate(300deg)
.point-11
  -webkit-transform: rotate(330deg)
  transform: rotate(330deg)

.hands
  > div
    position: absolute
    width: calc(var(--clock-size) * .015)
    border-radius: calc(var(--clock-size) * .0075)
    left: calc(var(--clock-size) * .4925)
    background: #000
    -webkit-transform-origin: 50% 100%
    transform-origin: 50% 100%

  .hour
    height: calc(var(--clock-size) * .25)
    top: calc(var(--clock-size) * .25)
    -webkit-transform: rotate(306deg)
    transform: rotate(306deg)

  .minute
    height: calc(var(--clock-size) * .4)
    top: calc(var(--clock-size) * .1)
    -webkit-transform: rotate(50deg)
    transform: rotate(50deg)

.face-centre
  position: absolute
  width: calc(var(--clock-size) * .04)
  height: calc(var(--clock-size) * .04)
  top: calc(var(--clock-size) * .48)
  left: calc(var(--clock-size) * .48)
  border-radius: 100%
  background: #000

  &::after
    content: ''
    position: absolute
    width: calc(var(--clock-size) * .02)
    height: calc(var(--clock-size) * .02)
    top: calc(var(--clock-size) * .01)
    left: calc(var(--clock-size) * .01)
    border-radius: 50%
    background: rgba(255, 255 ,255 , .6)

.pie
  width: var(--clock-size)
  aspect-ratio: 1
  display: inline-grid
  place-content: center
  &::before
    content: ''
    position: absolute
    border-radius: 50%
    inset: 0
    background: conic-gradient(rgba(var(--v-theme-warning), .2) 0, rgba(var(--v-theme-warning), .3) calc(var(--time) * 1deg), #0000 0)
    transform: rotate(calc(var(--start) * 1deg))
</style>
