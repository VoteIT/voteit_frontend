import { computed } from 'vue'
import { useDisplay } from 'vuetify'

export default function useDefaults() {
  const { mobile } = useDisplay()

  const dialogDefaults = computed(() => {
    return {
      width: 640
    }
  })

  const collapsedBodyHeight = computed(() => (mobile.value ? 80 : 240))
  const collapsedBodyHeightMobile = computed(() =>
    mobile.value ? 80 : undefined
  )

  return {
    collapsedBodyHeight,
    collapsedBodyHeightMobile,
    dialogDefaults
  }
}
