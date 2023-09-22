import { Dictionary } from 'lodash'
import { computed } from 'vue'
import { RouteLocationRaw, useRoute, useRouter } from 'vue-router'

/**
 * Composable to easily set a subpath when using tab navigation.
 */
export default function useTabRoute (
  getRoute: (name: string, params?: Dictionary<string | number>) => RouteLocationRaw,
  defaultName: string,
  subName: string,
  params?: Dictionary<string | number>
) {
  const route = useRoute()
  const router = useRouter()

  const currentTab = computed<string>({
    get () {
      if (Array.isArray(route.params.tabId)) throw new Error('tabId must only have one value')
      return route.params.tabId || 'default'
    },
    set (value) {
      const routeName = value === 'default'
        ? defaultName
        : subName
      router.push(getRoute(
        routeName,
        {
          tabId: value,
          ...params
        }
      ))
    }
  })

  return {
    currentTab
  }
}
