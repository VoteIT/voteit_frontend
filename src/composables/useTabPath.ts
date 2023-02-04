import { computed, Ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

/**
 * Composable to easily set a subpath when using tab navigation.
 */
export default function useTabPath (path: Ref<string>) {
  const route = useRoute()
  const router = useRouter()

  const currentTab = computed({
    get () {
      return route.params.tabId || 'default'
    },
    set (value) {
      const subPath = value === 'default'
        ? '/p'
        : `/p/${value}`
      router.push(path.value + subPath)
    }
  })

  return {
    currentTab
  }
}
