import { computed } from 'vue'
import { useDisplay } from 'vuetify'

export default function useDefaults () {
  const { mobile } = useDisplay()

  const dialogDefaults = computed(() => {
    return {
      width: mobile.value ? 280 : 560,
      minHeight: 400,
      maxHeight: '70vh'
    }
  })

  const collapsedBodyHeight = computed(() => mobile.value ? 80 : 240)
  const collapsedBodyHeightMobile = computed(() => mobile.value ? 80 : undefined)

  return {
    collapsedBodyHeight,
    collapsedBodyHeightMobile,
    dialogDefaults
  }
}
