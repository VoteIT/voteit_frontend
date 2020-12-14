import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
// import store from './store'

import Alerts from './plugins/Alerts'
// import Api from './plugins/Api'
// import Channels from './plugins/Channels'
import Slugify from './plugins/Slugify'
import Icon from './components/Icon'
// import Authentication from './components/mixins/Authentication'
import ProgressBar from './components/ProgressBar'

createApp(App)
  // .use(store)
  .use(router)
  .use(Alerts)
  // .use(Api)
  // .use(Channels)
  .use(Slugify)
  .component('Icon', Icon)
  .component('ProgressBar', ProgressBar)
  // .mixin(Authentication)
  .mount('#app')
