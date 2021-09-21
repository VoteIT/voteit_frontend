import Plenary from './Plenary.vue'
import AppBar from './AppBar.vue'

export default {
  path: '/p/:id/:aid',
  name: 'Plenary',
  components: {
    default: Plenary,
    appBar: AppBar
  }
}
