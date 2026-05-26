import { onUnmounted, watch, type Ref } from 'vue'

type Phase =
  | 'initial-delay'
  | 'scroll-down'
  | 'pause-bottom'
  | 'scroll-up'
  | 'pause-top'

export function useAutoScroll(
  el: Ref<HTMLElement | null>,
  options?: { speed?: number; pauseDuration?: number; initialDelay?: number }
) {
  const speed = options?.speed ?? 40
  const pauseDuration = options?.pauseDuration ?? 1_500
  const initialDelay = options?.initialDelay ?? 800

  let rafId: number | null = null
  let phase: Phase = 'initial-delay'
  let phaseElapsed = 0
  let lastTs: number | null = null

  function tick(ts: number) {
    const el_ = el.value
    if (!el_) {
      rafId = requestAnimationFrame(tick)
      return
    }

    const delta = lastTs == null ? 0 : ts - lastTs
    lastTs = ts

    const maxScroll = el_.scrollHeight - el_.clientHeight

    if (maxScroll <= 0) {
      lastTs = null
      setTimeout(() => {
        rafId = requestAnimationFrame(tick)
      }, 1_000)
      return
    }

    phaseElapsed += delta

    switch (phase) {
      case 'initial-delay':
        if (phaseElapsed >= initialDelay) {
          phase = 'scroll-down'
          phaseElapsed = 0
        }
        break
      case 'scroll-down':
        el_.scrollTop = Math.min(
          el_.scrollTop + (speed * delta) / 1000,
          maxScroll
        )
        if (el_.scrollTop >= maxScroll) {
          phase = 'pause-bottom'
          phaseElapsed = 0
        }
        break
      case 'pause-bottom':
        if (phaseElapsed >= pauseDuration) {
          phase = 'scroll-up'
          phaseElapsed = 0
        }
        break
      case 'scroll-up':
        el_.scrollTop = Math.max(el_.scrollTop - (speed * delta) / 1_000, 0)
        if (el_.scrollTop <= 0) {
          phase = 'pause-top'
          phaseElapsed = 0
        }
        break
      case 'pause-top':
        if (phaseElapsed >= pauseDuration) {
          phase = 'scroll-down'
          phaseElapsed = 0
        }
        break
    }

    rafId = requestAnimationFrame(tick)
  }

  watch(
    el,
    (newEl) => {
      if (newEl) {
        phase = 'initial-delay'
        phaseElapsed = 0
        lastTs = null
        rafId = requestAnimationFrame(tick)
      }
    },
    { immediate: true }
  )

  onUnmounted(() => {
    if (rafId != null) cancelAnimationFrame(rafId)
  })
}
