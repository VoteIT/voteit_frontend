import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'

import moment from 'moment'

import Alerts from './plugins/Alerts.js'
import Api from './plugins/Api.js'
import Slugify from './plugins/Slugify.js'

import Icon from './components/Icon'
import Btn from './components/Btn'
import User from './components/User'
import ProgressBar from './components/ProgressBar.vue'

moment.locale(document.documentElement.lang)

createApp(App)
  .use(router)
  .use(Alerts)
  .use(Api)
  .use(Slugify)
  .component('Icon', Icon)
  .component('Btn', Btn)
  .component('User', User)
  .component('ProgressBar', ProgressBar)
  .mount('#app')
