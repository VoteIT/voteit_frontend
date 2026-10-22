import {
  MaybeRefOrGetter,
  onMounted,
  onUnmounted,
  reactive,
  toValue,
  watch
} from 'vue'
import { useIntervalFn } from '@vueuse/core'

const BOKEH_COLORS = [
  'accent',
  'error',
  'info',
  'primary',
  'secondary',
  'success',
  'surface',
  'white'
] as const
// How much of the distance left to an edge one tick may cover. Below 1, so a
// bokeh heading for an edge slows down as it nears it and can never pass it.
const EDGE_BRAKE = 0.2

interface Bokeh {
  color: (typeof BOKEH_COLORS)[number]
  size: number // 1-10, in vw
  x: number // 0-100, in vw
  y: number // 0-100, in vh
  dx: number // momentum, x units per tick
  dy: number // momentum, y units per tick
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

function randomInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

/**
 * Normally distributed position on a 0-100 axis, centred on the middle
 * (Box-Muller). Clamped, so the rare outlier lands on the edge.
 */
function randomPosition(spread = 15) {
  const u = 1 - Math.random() // (0, 1], log(0) is -Infinity
  const v = Math.random()
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  return clamp(50 + z * spread)
}

function randomBokeh(maxSpeed: number): Bokeh {
  return {
    color: BOKEH_COLORS[randomInt(0, BOKEH_COLORS.length - 1)],
    size: randomInt(3, 10),
    x: randomPosition(),
    y: randomPosition(),
    dx: (Math.random() * 2 - 1) * maxSpeed,
    dy: (Math.random() * 2 - 1) * maxSpeed
  }
}

/**
 * Nudge momentum on a 0-100 axis at random, then hold it to what the position
 * allows: at most maxSpeed either way, and never past an edge.
 */
function steer(position: number, momentum: number, maxSpeed: number) {
  const nudged = momentum + (Math.random() - 0.5) * maxSpeed * 0.5
  return clamp(
    nudged,
    Math.max(-maxSpeed, -position * EDGE_BRAKE),
    Math.min(maxSpeed, (100 - position) * EDGE_BRAKE)
  )
}

/**
 * Bokeh drifting at random, one step a second, for as long as `paused` is
 * false. Pausing rather than stopping, so they can pick up where they left off.
 */
export default function useBokeh(
  count: number,
  {
    maxSpeed,
    paused
  }: { maxSpeed: MaybeRefOrGetter<number>; paused: MaybeRefOrGetter<boolean> }
) {
  // Deep reactive: the drift changes position and momentum in place.
  const bokeh = reactive<Bokeh[]>(
    Array.from({ length: count }, () => randomBokeh(toValue(maxSpeed)))
  )

  const drift = useIntervalFn(
    () => {
      const speed = toValue(maxSpeed)
      for (const elem of bokeh) {
        elem.dx = steer(elem.x, elem.dx, speed)
        elem.dy = steer(elem.y, elem.dy, speed)
        elem.x += elem.dx
        elem.y += elem.dy
      }
    },
    1000,
    { immediate: false, immediateCallback: true }
  )
  watch(
    () => toValue(paused),
    (isPaused) => (isPaused ? drift.pause() : drift.resume())
  )

  // First step as soon as the bokeh are on screen. Not on nextTick: the DOM is
  // patched by then but not yet styled, so the step's positions would be where
  // they start, with nothing to transition from. Two frames is past a paint.
  let unmounted = false
  onMounted(() =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (!unmounted && !toValue(paused)) drift.resume()
      })
    )
  )
  onUnmounted(() => (unmounted = true))

  return bokeh
}
