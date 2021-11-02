import FullscreenView from './FullscreenView.vue'
import FullscreenAppBar from './FullscreenAppBar.vue'

export default {
  path: '/speakers/:id/:system',
  name: 'speakerFullscreen',
  components: {
    default: FullscreenView,
    appBar: FullscreenAppBar
  }
}
