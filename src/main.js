import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'

import Alerts from './plugins/Alerts.js'
import Api from './plugins/Api.js'
import Slugify from './plugins/Slugify.js'

import Icon from './components/Icon.vue'
import Btn from './components/Btn.vue'
import ProgressBar from './components/ProgressBar.vue'

createApp(App)
  .use(router)
  .use(Alerts)
  .use(Api)
  .use(Slugify)
  .component('Icon', Icon)
  .component('Btn', Btn)
  .component('ProgressBar', ProgressBar)
  .mount('#app')
