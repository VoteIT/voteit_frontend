import { inject, computed, Ref } from 'vue'

export default function useUnread (modifiedOrCreated: Date) {
  const lastRead = inject<Ref<Date | undefined>>('lastRead')
  const isUnread = computed(() => {
    if (!lastRead) return false // No unread support
    return !lastRead.value || modifiedOrCreated > lastRead.value // If there is a ref, but undefined, consider all unread, otherwise check if later
  })

  return {
    isUnread
  }
}
