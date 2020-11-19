import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import store from './store'

import Api from './plugins/Api'
import Objects from './plugins/Objects'
import Slugify from './plugins/Slugify'
import Icon from './components/Icon'
import Authentication from './components/mixins/Authentication'
import ProgressBar from './components/ProgressBar'

createApp(App)
  .use(store)
  .use(router)
  .use(Api)
  .use(Objects)
  .use(Slugify)
  .component('Icon', Icon)
  .component('ProgressBar', ProgressBar)
  .mixin(Authentication)
  .mount('#app')
