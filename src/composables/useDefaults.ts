import { computed } from 'vue'
import { useDisplay } from 'vuetify'

const cols = {
  default: {
    cols: 12,
    lg: 8,
    offsetLg: 2
  }
}

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
    cols,
    dialogDefaults
  }
}
