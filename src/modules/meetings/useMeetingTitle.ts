import { computed, Ref } from 'vue'
import { useTitle } from '@vueuse/core'
import useMeeting from './useMeeting'

export default function useMeetingTitle (title: string | Ref<string>) {
  const { meeting } = useMeeting()
  useTitle(computed(() => `${typeof title === 'string' ? title : title.value} | ${meeting.value?.title ?? ''}`))
}
