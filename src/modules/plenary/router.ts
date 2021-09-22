import Plenary from './Plenary.vue'
import appBar from './AppBar.vue'
import navigationDrawer from './AgendaNavigation.vue'

export default {
  path: '/p/:id/:aid',
  name: 'Plenary',
  components: {
    default: Plenary,
    appBar,
    navigationDrawer
  }
}
