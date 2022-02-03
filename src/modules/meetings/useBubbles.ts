import { sortBy } from 'lodash'
import { BubbleComponent } from './types'

const bubbles: BubbleComponent[] = []

export default function useBubbles () {
  function register (component: any) {
    bubbles.push(component)
    sortBy(bubbles, ['order'])
  }

  return {
    bubbles,
    register
  }
}
