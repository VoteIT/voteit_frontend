import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import store from './store'

import Api from './plugins/Api'
import Objects from './plugins/Objects'
import Slugify from './plugins/Slugify'

createApp(App)
  .use(store)
  .use(router)
  .use(Api)
  .use(Objects)
  .use(Slugify)
  .mount('#app')
