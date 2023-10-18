import { Ref, ref } from 'vue'

const leftActive = ref(false)
const rightActive = ref(false)
const pauseMessage = ref('Paused')

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function useRealTime(meetingId: Ref<number>) {
  return {
    leftActive,
    rightActive,
    pauseMessage
  }
}
