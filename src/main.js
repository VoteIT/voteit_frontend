import { createApp } from 'vue'
import { VueShowdownPlugin } from 'vue-showdown'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'

import Alerts from './plugins/Alerts.js'
import Api from './plugins/Api.js'
import Slugify from './plugins/Slugify.js'

import Icon from './components/Icon'
import Btn from './components/Btn'
import User from './components/User'
import ProgressBar from './components/ProgressBar.vue'

console.log(VueShowdownPlugin)

createApp(App)
  .use(router)
  .use(VueShowdownPlugin)
  .use(Alerts)
  .use(Api)
  .use(Slugify)
  .component('Icon', Icon)
  .component('Btn', Btn)
  .component('User', User)
  .component('ProgressBar', ProgressBar)
  .mount('#app')
