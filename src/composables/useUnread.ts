import { inject, computed, InjectionKey, Ref } from 'vue'

export const LastReadKey: InjectionKey<Ref<Date>> = Symbol('LastRead')

export default function useUnread (modifiedOrCreated: Date) {
  const lastRead = inject(LastReadKey)
  const isUnread = computed(() => {
    if (!lastRead) return false // No unread support
    return modifiedOrCreated > lastRead.value // Should not be possible to be undef. Defaults to epoch.
  })

  return {
    lastRead,
    isUnread
  }
}
