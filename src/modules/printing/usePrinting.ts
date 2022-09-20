import { ref } from 'vue'

const backOnPrinted = ref(false)

export default function usePrinting () {
  return {
    backOnPrinted
  }
}
