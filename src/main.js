import { createApp } from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import store from './store'

import Api from './plugins/Api'
import Socket from './plugins/Socket'

createApp(App).use(store).use(router).use(Api).use(Socket).mount('#app')
